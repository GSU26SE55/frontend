import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useTemplateVariables } from "@/features/admin/hooks/notification/useNotificationTemplates";
import type { NotificationTypeEnum } from "@/shared/enums/notification/notification.enum";

interface Props {
  /** The notification type being composed — decides which set of variables is valid. */
  type: NotificationTypeEnum;
  /** Variables the author has typed, taken from the content currently being entered. */
  typedNames: string[];
  /** Insert `{{name}}` into the field being composed. */
  onInsert: (name: string) => void;
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
 */
export default function TemplateVariablePalette({
  type,
  typedNames,
  onInsert,
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

  const chip =
    "font-mono text-xs rounded border px-1.5 py-0.5 transition-colors " +
    "border-border bg-background hover:bg-accent hover:text-accent-foreground";

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        Click to insert a variable into the field being composed. Only the
        variables below have a value at actual send time — any other variable
        will render empty.
      </p>

      {group.payload.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium">Data for this type</p>
          <div className="flex flex-wrap gap-1.5">
            {group.payload.map((name) => (
              <button
                key={name}
                type="button"
                className={chip}
                onClick={() => onInsert(name)}
              >
                {`{{${name}}}`}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          This notification type doesn't come with its own data — only the
          common variables below are available.
        </p>
      )}

      <div>
        <p className="mb-1 text-xs font-medium">
          Common variables{" "}
          <span className="font-normal text-muted-foreground">
            (available for every type)
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {group.builtin.map((name) => (
            <button
              key={name}
              type="button"
              className={chip}
              onClick={() => onInsert(name)}
            >
              {`{{${name}}}`}
            </button>
          ))}
        </div>
      </div>

      {unknown.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">
            Unknown variable:{" "}
            {unknown.map((n, i) => (
              <span key={n}>
                {i > 0 && ", "}
                <code className="font-mono">{`{{${n}}}`}</code>
              </span>
            ))}
            . This will render empty at actual send time, and the server will
            refuse to save it.
          </p>
        </div>
      )}
    </div>
  );
}
