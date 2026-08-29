import { useMemo } from "react";
import { AlertTriangle, ChevronDown, Check, Plus } from "lucide-react";
import { useTemplateVariables } from "@/features/admin/hooks/notification/useNotificationTemplates";
import { getVariableDoc } from "@/features/admin/constants/templateVariableDocs";
import type { NotificationTypeEnum } from "@/shared/enums/notification/notification.enum";

interface Props {
  /** The notification type being composed — decides which set of variables is valid. */
  type: NotificationTypeEnum;
  /** Variables typed across BOTH fields — used only for the "invalid variable" warning. */
  typedNames: string[];
  /** Variables typed in the CURRENTLY TARGETED field only — decides which chip shows a check. */
  typedNamesInTarget: string[];
  /** Insert `{{name}}` at the cursor position in the currently targeted field. */
  onInsert: (name: string) => void;
  /** The current insert target — decides whether a clicked chip lands in Title or Body. */
  target: "titleTemplate" | "bodyTemplate";
  onTargetChange: (target: "titleTemplate" | "bodyTemplate") => void;
}

/**
 * The palette of valid variables for a notification type, plus a warning for mistyped variables —
 * shown **as you type**.
 *
 * Why it's needed: when a template references a variable that doesn't exist, Handlebars renders an
 * **empty string rather than reporting an error**. Before 08/03/2026 authors had to guess key names,
 * and a wrong guess produced no signal — this project's template set ran for months with
 * `{{ticketCode}}` while the consumer wrote the key `code`, and `{{serialNumber}}` while the consumer
 * wrote `assetSerialNumber`. The backend now returns 400 on save, but catching it here means the
 * author doesn't have to hit save to find out they mistyped.
 *
 * 17/08/2026 — each chip now leads with a **plain-language name** ("Ticket code") instead of
 * the raw key, with `{{code}}` demoted to a caption underneath. The keys alone were unreadable: an
 * author looking at `{{code}}` `{{ticketId}}` `{{customerId}}` `{{screen}}` had no way to tell which
 * one is the ticket number the customer actually recognises and which is an internal GUID. The
 * descriptions come from a FE-side dictionary (`templateVariableDocs.ts`) because the BE endpoint
 * only returns key names.
 */
export default function TemplateVariablePalette({
  type,
  typedNames,
  typedNamesInTarget,
  onInsert,
  target,
  onTargetChange,
}: Props) {
  const { data: groups, isLoading } = useTemplateVariables();

  const group = useMemo(
    () => groups?.find((g) => g.type === type),
    [groups, type],
  );

  // Case-insensitive matching — the backend model is built with OrdinalIgnoreCase, so both
  // {{Code}} and {{code}} resolve.
  const allowedLower = useMemo(() => {
    if (!group) return null;
    return new Set(
      [...group.payload, ...group.builtin].map((v) => v.toLowerCase()),
    );
  }, [group]);

  const unknown = useMemo(() => {
    if (!allowedLower) return [];
    return typedNames.filter((n) => !allowedLower.has(n.toLowerCase()));
  }, [typedNames, allowedLower]);

  // Which variables are already in the TARGETED field — the chip shows a check instead of a plus
  // so the author can see at a glance what's left to add. Scoped to the target field (not both
  // fields combined): Title and Body are separate strings, so a variable used in Body must not
  // show as "already added" while the author is composing Title.
  const usedLower = useMemo(
    () => new Set(typedNamesInTarget.map((n) => n.toLowerCase())),
    [typedNamesInTarget],
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Loading variables…</p>
      </div>
    );
  }

  // Couldn't fetch the catalog (network loss, 403) — silently skip rather than blocking the author
  // from saving. The backend is still the final gate, so skipping here won't let a broken template into the DB.
  if (!group) return null;

  // Split each group into what a recipient can actually read vs. raw internal IDs (GUIDs, bare
  // enum numbers). Internal chips are still selectable — some templates legitimately need an ID
  // for a deep link — but they're demoted into a collapsed "Internal / debug only" section so the
  // default view only offers chips a human sentence can use, instead of an author reaching for
  // "Ticket ID" when they meant "Ticket code" (this exact mix-up shipped an unreadable template).
  const splitInternal = (names: string[]) => {
    const readable: string[] = [];
    const internal: string[] = [];
    for (const name of names) {
      (getVariableDoc(name)?.internal ? internal : readable).push(name);
    }
    return { readable, internal };
  };

  const payloadSplit = splitInternal(group.payload);
  const builtinSplit = splitInternal(group.builtin);
  const allInternal = [...payloadSplit.internal, ...builtinSplit.internal];

  const renderChips = (names: string[]) => (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {names.map((name) => {
        const doc = getVariableDoc(name);
        const used = usedLower.has(name.toLowerCase());
        return (
          <button
            key={name}
            type="button"
            onClick={() => onInsert(name)}
            title={doc ? `${doc.label} — e.g. ${doc.sample}` : `Insert ${name}`}
            className={
              "group flex items-start gap-2 rounded-md border px-2 py-1.5 text-left transition-colors " +
              (used
                ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                : "border-border bg-background hover:bg-accent")
            }
          >
            {/* The check is only an "already in the content" indicator — clicking still always
                inserts, since a variable can legitimately appear in both title and body. */}
            {used ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            ) : (
              <Plus className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">
                {doc?.label ?? name}
              </span>
              {doc && (
                <span className="block truncate text-3xs text-muted-foreground">
                  e.g. {doc.sample}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      {/* Target picker. Chips used to insert into "the last focused field", but clicking a chip
          moves focus out of that field — the author had no way to tell where the variable would
          land, and in practice it went into the wrong one. The target is now explicit and sticky. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Insert into:</span>
        <div className="inline-flex rounded-md border border-border bg-background p-0.5">
          {(
            [
              ["titleTemplate", "Title"],
              ["bodyTemplate", "Body"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onTargetChange(value)}
              className={
                "rounded px-2.5 py-1 text-xs transition-colors " +
                (target === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click an item below to insert it at the cursor. Only these items have a
        value at send time — anything else renders empty.
      </p>

      {payloadSplit.readable.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium">
            Data for this notification type
          </p>
          {renderChips(payloadSplit.readable)}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          This notification type carries no data of its own — only the common
          items below are available.
        </p>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium">
          Common items{" "}
          <span className="font-normal text-muted-foreground">
            (available on every type)
          </span>
        </p>
        {renderChips(builtinSplit.readable)}
      </div>

      {allInternal.length > 0 && (
        <details className="group/internal">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground select-none">
            <ChevronDown className="size-3.5 shrink-0 -rotate-90 transition-transform group-open/internal:rotate-0" />
            Internal / debug only ({allInternal.length})
          </summary>
          <p className="mt-1.5 mb-1.5 text-2xs text-muted-foreground">
            Raw IDs and codes — meaningless to the recipient. Rarely needed
            (e.g. a deep-link path); prefer the readable fields above.
          </p>
          {renderChips(allInternal)}
        </details>
      )}

      {unknown.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">
            {/* The mistyped name must still be printed verbatim — it is the only thing that lets
                the author find the spot to fix in the content. */}
            Invalid variables: {unknown.join(", ")}. These render empty at send
            time, and the server will reject the save.
          </p>
        </div>
      )}
    </div>
  );
}
