// Extracts the list of {{...}} variables from a Handlebars template, to build a sample-data input
// form instead of making the admin type raw JSON by hand.
//
// Why this is needed: each template uses a different set of variables (a ticket has code/priority,
// a battery has assetSerialNumber/thresholdValue…). Previously the input was raw JSON with a FIXED
// hint shared across all 82 templates, and the admin had no way to tell because the table only
// showed the title, not the template body.
//
// ⚠️ 03/08/2026 — this function only extracts the variable names the author ACTUALLY TYPED; it does
// NOT know which names are valid. The valid list comes from
// `GET /api/admin/notification-templates/variables` and is cross-checked in `TemplateVariablePalette`.
// This distinction matters: the old template set once typed `{{ticketCode}}` while the consumer wrote
// key `code`, and `{{serialNumber}}` while the consumer wrote `assetSerialNumber` —
// Handlebars renders an unknown variable as EMPTY rather than erroring, so nobody noticed for months.

// {{var}} · {{{var}}} (unescaped output) · {{ var }} (extra whitespace).
// [^{}]* so it doesn't accidentally swallow into the next token.
const HANDLEBARS_TOKEN = /\{\{\{?([^{}]*)\}\}\}?/g;

// Leading characters of syntax that is NOT a fillable variable:
//   #  opens a block {{#if}}     /  closes a block {{/if}}   ^  inverted block {{^x}}
//   !  comment                   >  partial                  &  unescaped output
//   @  runtime-provided variable {{@index}} — not from sample data
const NON_VARIABLE_PREFIXES = new Set(["#", "/", "^", "!", ">", "&", "@"]);

// Handlebars keywords, not variables.
const RESERVED_KEYWORDS = new Set(["else", "this"]);

/**
 * Returns variable names in FIRST-APPEARANCE ORDER, deduplicated.
 *
 * Intentional limitation: skips helper calls with arguments (`{{formatDate x}}`) since we can't
 * tell which part is the variable to fill in. The current template set (82 templates, 39 variables)
 * uses no helpers, blocks, or triple-braces — the entire DB was scanned on 02/08/2026. The function
 * still handles those forms so that if someone adds a new template, the form won't show garbage.
 */
export function extractPlaceholders(
  ...templates: (string | null | undefined)[]
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const template of templates) {
    if (!template) continue;

    for (const match of template.matchAll(HANDLEBARS_TOKEN)) {
      const name = (match[1] ?? "").trim();

      if (!name) continue;
      if (NON_VARIABLE_PREFIXES.has(name[0])) continue;
      // Whitespace remaining inside ⇒ a helper call, not a plain variable.
      if (/\s/.test(name)) continue;
      if (RESERVED_KEYWORDS.has(name)) continue;
      if (seen.has(name)) continue;

      seen.add(name);
      names.push(name);
    }
  }

  return names;
}

/**
 * Appends `{{name}}` to the end of the content being composed — used for the click-to-insert
 * button in the valid-variables table. Auto-adds a space when appending to the end of an unfinished
 * sentence, so the token doesn't stick to the preceding text.
 */
export function insertPlaceholder(current: string, name: string): string {
  const token = `{{${name}}}`;
  if (!current) return token;
  return /\s$/.test(current) ? current + token : `${current} ${token}`;
}

/**
 * Converts an arbitrary JSON value to a string displayable in an input field, used when switching
 * from JSON mode to form mode. `null`/`undefined` → empty (meaning "not provided").
 */
export function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}
