import { useMemo } from "react";
import { AlertTriangle, FileText, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTemplateVariables } from "@/features/admin/hooks/notification/useNotificationTemplates";
import { useBroadcastTemplatePreview } from "@/features/admin/hooks/notification/useNotificationGroups";
import { notificationChannelLabel } from "@/shared/constants/notificationLabels";
import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";

interface Props {
  type: NotificationTypeEnum;
  channels: NotificationChannelEnum[];
  title: string;
  body: string;
  /** Variable values the admin is filling in. The key is the variable name. */
  vars: Record<string, string>;
  onVarChange: (name: string, value: string) => void;
}

/**
 * The "use template" section of the broadcast form: variable input fields + content preview
 * **per channel**.
 *
 * <b>Why the preview must be split by channel:</b> templates are keyed by the pair (Type ×
 * Channel), and the SMS version gets compressed shorter since it's billed per segment — a single
 * send across 3 channels produces 3 different contents. A single shared preview would lie about
 * 2 of the 3 channels. This is also why it must render at send time rather than "pre-filling the
 * compose field".
 *
 * <b>Where the variable fields come from:</b> from the actual templates of the currently selected
 * channels (see <c>fieldNames</c>), not from the full set of payload keys that type could
 * potentially have. Common variables (Title/Body/UserId…) are auto-filled by the system, so they
 * never appear here — showing them would just be confusing.
 */
export default function BroadcastTemplateSection({
  type,
  channels,
  title,
  body,
  vars,
  onVarChange,
}: Props) {
  const { data: groups } = useTemplateVariables();

  // Drop empty fields from the payload: sending an empty string or omitting the key entirely both
  // render as blank, but omitting it lets the "variable has no value yet" section below tell the truth.
  const payloadJson = useMemo(() => {
    const filled = Object.entries(vars).filter(([, v]) => v.trim().length > 0);
    return filled.length === 0
      ? null
      : JSON.stringify(Object.fromEntries(filled));
  }, [vars]);

  const previewPayload = useMemo(
    () => ({ type, channels, title, body, payloadJson }),
    [type, channels, title, body, payloadJson],
  );

  const { data: preview, isFetching } = useBroadcastTemplatePreview(
    previewPayload,
    channels.length > 0,
  );

  /**
   * The list of fields to fill = **the variables that the templates of the currently selected
   * channels actually reference**, not the full set of payload keys that type could have.
   *
   * These two are meaningfully different. For example the "System notification" type declares 5
   * keys (`digest`, `count`, `from`, `to`, `notificationIds`), but those belong to a **machine-
   * generated digest message** — a human sender never fills them in, and its template just passes
   * them through verbatim. Showing all 5 fields would just make the user think they need to fill
   * something in.
   *
   * `missingVariables` from the preview is exactly "variables the template references that have no
   * value yet". Merge it with the already-filled fields so a field doesn't disappear the instant
   * you finish typing.
   */
  const fieldNames = useMemo(() => {
    const filled = Object.keys(vars).filter((k) => vars[k]?.trim().length > 0);

    if (!preview) {
      // No preview yet (first render) — temporarily use the catalog so the layout doesn't jump.
      return groups?.find((g) => g.type === type)?.payload ?? [];
    }

    const needed = new Set<string>(filled);
    for (const row of preview)
      row.missingVariables.forEach((v) => needed.add(v));
    return [...needed].sort((a, b) => a.localeCompare(b));
  }, [preview, vars, groups, type]);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Content will be built from the <b>notification template</b> of the
          selected type. Each channel has its own template so content can differ
          per channel — the SMS version is compressed shorter. The title and
          body you type below become the <b>fallback</b> for channels without a
          template.
        </p>
      </div>

      {fieldNames.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium">Fill in template variables</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {fieldNames.map((name) => (
              <label key={name} className="space-y-1">
                <span className="font-mono text-xs text-muted-foreground">
                  {`{{${name}}}`}
                </span>
                <Input
                  value={vars[name] ?? ""}
                  onChange={(e) => onVarChange(name, e.target.value)}
                  placeholder="leave blank ⇒ renders empty"
                />
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            This type's template doesn't need any variables — its content is
            pre-built, or it only uses common variables auto-filled by the
            system.
          </span>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium">
          Preview per channel{" "}
          {isFetching && (
            <span className="font-normal text-muted-foreground">
              — building…
            </span>
          )}
        </p>

        {!preview || preview.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Select channels to preview.
          </p>
        ) : (
          <div className="space-y-2">
            {preview.map((row) => (
              <div
                key={row.channel}
                className="rounded-md border border-border bg-background px-3 py-2"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {notificationChannelLabel(row.channel)}
                  </span>
                  {!row.hasTemplate && (
                    <Badge variant="outline" className="font-normal">
                      No template — using what you typed
                    </Badge>
                  )}
                </div>

                <p className="text-sm font-medium break-words">{row.title}</p>
                <p className="text-sm text-muted-foreground break-words">
                  {row.body}
                </p>

                {row.missingVariables.length > 0 && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      No value yet:{" "}
                      {row.missingVariables.map((v, i) => (
                        <span key={v}>
                          {i > 0 && ", "}
                          <code className="font-mono">{`{{${v}}}`}</code>
                        </span>
                      ))}{" "}
                      — that spot will render empty.
                    </span>
                  </p>
                )}

                {row.renderError && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Template has a syntax error — this channel will send using
                      what you typed.
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
