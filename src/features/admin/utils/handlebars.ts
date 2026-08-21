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
 * Chèn `{{name}}` vào ĐÚNG vị trí con trỏ, trả về cả chuỗi mới lẫn vị trí caret sau khi chèn để
 * caller đặt lại con trỏ.
 *
 * Vì sao chèn tại con trỏ chứ không nối vào cuối: câu thông báo hầu như luôn có
 * biến nằm GIỮA câu ("Ticket {{code}} vừa được tạo"). Nối vào cuối buộc người soạn phải tự cắt dán
 * token về giữa — và đó đúng là thao tác làm hỏng cặp ngoặc, sinh ra biến sai tên mà Handlebars
 * lặng lẽ render thành chuỗi rỗng.
 *
 * `selectionStart/End` là vùng đang bôi đen (bằng nhau nếu chỉ có caret); token thay thế phần bôi
 * đen, đúng như hành vi gõ phím bình thường.
 */
export function insertPlaceholderAt(
  current: string,
  name: string,
  selectionStart: number,
  selectionEnd: number,
): { value: string; caret: number } {
  const token = `{{${name}}}`;
  const before = current.slice(0, selectionStart);
  const after = current.slice(selectionEnd);

  // Tự thêm khoảng trắng để token không dính vào chữ liền kề ("ticketTK-1042").
  const needsSpaceBefore = before !== "" && !/\s$/.test(before);
  const needsSpaceAfter = after !== "" && !/^\s/.test(after);
  const insert =
    (needsSpaceBefore ? " " : "") + token + (needsSpaceAfter ? " " : "");

  return {
    value: before + insert + after,
    caret: before.length + insert.length,
  };
}

/**
 * Thay mọi `{{bien}}` bằng giá trị mẫu tương ứng để dựng câu đọc thử.
 *
 * Đây CHỈ để hiển thị — chuỗi lưu xuống DB luôn là template gốc. Biến không tra được trong từ điển
 * giữ nguyên dạng thô: hiện ra như vậy chính là tín hiệu cho người soạn biết mình vừa gõ một tên
 * không có thật.
 */
export function renderWithSamples(
  template: string,
  sampleOf: (name: string) => string | undefined,
): string {
  return template.replace(HANDLEBARS_TOKEN, (whole, rawName: string) => {
    const name = (rawName ?? "").trim();
    if (!name || NON_VARIABLE_PREFIXES.has(name[0]) || /\s/.test(name))
      return whole;
    return sampleOf(name) ?? whole;
  });
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
