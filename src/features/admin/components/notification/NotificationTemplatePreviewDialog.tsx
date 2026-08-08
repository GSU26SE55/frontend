import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HttpError } from "@/shared/lib/errors";
import { MESSAGES } from "@/shared/constants/messages";
import { NotificationChannelEnum } from "@/shared/enums/notification/notification.enum";
import {
  notificationTypeLabel,
  notificationChannelLabel,
} from "@/shared/constants/notificationLabels";
import {
  extractPlaceholders,
  toInputValue,
} from "@/features/admin/utils/handlebars";
import {
  templateSampleDataSchema,
  parseSampleData,
  type TemplateSampleDataFormValues,
} from "@/features/admin/schemas/notification/notification-template.schema";
import {
  usePreviewTemplate,
  useTestSendTemplate,
} from "@/features/admin/hooks/notification/useNotificationTemplates";
import type {
  NotificationTemplateDto,
  TemplatePreviewDto,
} from "@/features/admin/types/notification/notification-template.types";

interface Props {
  template: NotificationTemplateDto | null;
  onClose: () => void;
}

type InputMode = "form" | "json";

export default function NotificationTemplatePreviewDialog({
  template,
  onClose,
}: Props) {
  const [rendered, setRendered] = useState<TemplatePreviewDto | null>(null);
  // Handlebars syntax errors (400) show right inside the dialog — a toast would scroll away
  // while the admin is still trying to fix the template.
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  // The test-send result shows RIGHT IN the dialog, not just as a toast: what the admin most needs
  // to know is WHICH address the mail went to (seeded accounts often carry a placeholder email like
  // admin@yourdomain.com — the mail sends fine but nobody receives it). A toast disappears after a
  // few seconds, exactly while the user is still waiting for the mail, so it gets missed.
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Form is the default: a template's variable set is known up front, so there's no reason to force
  // hand-typed JSON. Raw JSON stays as an escape hatch for future templates that use block helpers
  // (which need properly typed bool/number values) — no current template does that.
  const [mode, setMode] = useState<InputMode>("form");
  const [vars, setVars] = useState<Record<string, string>>({});

  const preview = usePreviewTemplate();
  const testSend = useTestSendTemplate();

  const form = useForm<TemplateSampleDataFormValues>({
    resolver: zodResolver(templateSampleDataSchema),
    defaultValues: { sampleDataJson: "" },
  });

  // Variables come from BOTH the title and the body — the body holds most of them, and the table
  // doesn't show it.
  const placeholders = useMemo(
    () =>
      template
        ? extractPlaceholders(template.titleTemplate, template.bodyTemplate)
        : [],
    [template],
  );

  // Resetting state when the template changes is handled by `key` on the page side (remounting the
  // component) — no effect setState, which avoids a cascading render.
  if (!template) return null;

  // BE blocks test-send on channels other than Email (SMS costs real money, push needs a device token).
  // 2026-08-02: channel is a NUMBER now, no longer the string "Email" — compare via the enum.
  const canTestSend = template.channel === NotificationChannelEnum.Email;
  const outOfQuota = remaining === 0;

  const jsonText = form.getValues().sampleDataJson?.trim() ?? "";

  /**
   * Collect the sample data for whichever mode is open.
   * An empty field ⇒ SKIPPED (that key isn't sent) — this keeps the old semantics of empty JSON: a
   * placeholder with no value renders empty, which is how you spot a template calling the wrong
   * variable name.
   */
  const buildSampleData = (): Record<string, unknown> | undefined => {
    if (mode === "json") return parseSampleData(jsonText);

    const entries = placeholders
      .map((name) => [name, vars[name] ?? ""] as const)
      .filter(([, value]) => value !== "");

    // Object.fromEntries rather than assigning dynamic keys onto an object literal: a key named
    // "__proto__" would overwrite the prototype if assigned directly.
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  };

  /** Broken JSON ⇒ block, so the test-send button doesn't silently fire with empty data. */
  const hasBrokenJson = () =>
    mode === "json" &&
    jsonText !== "" &&
    parseSampleData(jsonText) === undefined;

  const switchMode = (next: InputMode) => {
    if (next === mode) return;

    if (next === "json") {
      // Pre-fill the JSON from the values already in the form so nothing has to be retyped.
      const data = buildSampleData();
      form.setValue(
        "sampleDataJson",
        data ? JSON.stringify(data, null, 2) : "",
      );
    } else {
      // If the JSON is broken, leave the form as-is instead of overwriting it with unparseable data.
      const parsed = parseSampleData(jsonText);
      if (parsed) {
        setVars((prev) => ({
          ...prev,
          ...Object.fromEntries(
            placeholders.map((name) => [name, toInputValue(parsed[name])]),
          ),
        }));
      }
      // Clear the JSON field: it stays in form state even while hidden, and leaving a broken string
      // there makes zodResolver block submit with an error the user can't see in form mode.
      form.setValue("sampleDataJson", "", { shouldValidate: true });
    }

    setMode(next);
  };

  const runPreview = async () => {
    setPreviewError(null);
    try {
      const res = await preview.mutateAsync({
        id: template.id,
        payload: { sampleData: buildSampleData() },
      });
      setRendered(res.data ?? null);
    } catch (error) {
      setRendered(null);
      setPreviewError(
        error instanceof HttpError ? error.message : MESSAGES.unknownError,
      );
    }
  };

  // Only JSON mode runs zod validation. In form mode the JSON field is hidden, so a validation
  // error on it would block submit without showing up anywhere.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (mode === "json") {
      void form.handleSubmit(() => runPreview())(e);
      return;
    }
    e.preventDefault();
    void runPreview();
  };

  const onTestSend = async () => {
    if (hasBrokenJson()) {
      setPreviewError("Sample data is not valid JSON.");
      return;
    }
    setPreviewError(null);
    const res = await testSend.mutateAsync({
      id: template.id,
      payload: { sampleData: buildSampleData() },
    });
    setRemaining(res.data?.remainingThisHour ?? null);
    // BE returns a message like "Test message sent to {email}." — kept so it stays visible in the dialog.
    setSentTo(res.message ?? "Test message sent.");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {notificationTypeLabel(template.type)} ·{" "}
            {notificationChannelLabel(template.channel)} · v{template.version}
          </DialogTitle>
          <DialogDescription>
            Render with sample data — nothing is sent anywhere. Empty fields
            render empty, which is how you spot a template calling the wrong
            variable name.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Sample data</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => switchMode(mode === "form" ? "json" : "form")}
              >
                {mode === "form" ? "Enter raw JSON" : "Back to form"}
              </Button>
            </div>

            {mode === "form" ? (
              placeholders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This template has no variables — click "Preview" to render it
                  right away.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {placeholders.map((name) => (
                    <div key={name} className="space-y-1.5">
                      {/* Label kept as {{name}} — admin sees exactly the variable the template references. */}
                      <Label
                        htmlFor={`tpl-var-${name}`}
                        className="font-mono text-xs"
                      >
                        {`{{${name}}}`}
                      </Label>
                      <Input
                        id={`tpl-var-${name}`}
                        value={vars[name] ?? ""}
                        onChange={(e) =>
                          setVars((prev) => ({
                            ...prev,
                            [name]: e.target.value,
                          }))
                        }
                        placeholder="(leave blank)"
                      />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <FormField
                control={form.control}
                name="sampleDataJson"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={5}
                        className="font-mono text-xs"
                        placeholder={
                          placeholders.length > 0
                            ? `{\n${placeholders
                                .map((n) => `  "${n}": ""`)
                                .join(",\n")}\n}`
                            : "{}"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={preview.isPending}>
                {preview.isPending ? "Building…" : "Preview"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canTestSend || outOfQuota || testSend.isPending}
                onClick={onTestSend}
                title={
                  !canTestSend
                    ? "Test send is only available for Email channel templates"
                    : outOfQuota
                      ? "You've used all 5 test sends for this hour"
                      : "Send to your own email"
                }
              >
                <Send className="size-3.5" />
                {testSend.isPending ? "Sending…" : "Send test to me"}
              </Button>
              {remaining !== null && (
                <span className="text-xs text-muted-foreground">
                  {remaining} sends left this hour
                </span>
              )}
            </div>

            {/* The reason a button is disabled must be readable without hovering: the `title`
                attribute does NOT show a tooltip on disabled elements (standard HTML behavior —
                disabled elements don't receive mouse events), so previously the button just went
                gray without saying why. */}
            {!canTestSend ? (
              <p className="text-xs text-muted-foreground">
                Test send is only available for Email templates — this template
                is on the {notificationChannelLabel(template.channel)} channel.
              </p>
            ) : outOfQuota ? (
              <p className="text-xs text-muted-foreground">
                You've used all 5 test sends for this hour. Try again next hour.
              </p>
            ) : null}

            {sentTo && (
              <div className="text-xs rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                  {sentTo}
                </p>
                {/* Sent ≠ received. Spell out where to check when the email never shows up —
                    the most common cause is the account still carrying the default seed email. */}
                <p className="mt-1 text-muted-foreground">
                  The email is sent to the address of the account you're
                  currently logged in as. Don't see it? Check your spam folder,
                  and confirm the address above matches the mailbox you're
                  checking.
                </p>
              </div>
            )}
          </form>
        </Form>

        {previewError && (
          <p className="text-sm text-red-500 border border-red-500/30 bg-red-500/5 rounded-lg px-3 py-2">
            {previewError}
          </p>
        )}

        {rendered && (
          <div className="space-y-3 border border-border rounded-xl p-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Title</p>
              <p className="text-sm font-medium break-words">
                {rendered.title || (
                  <span className="text-muted-foreground italic">(empty)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Body</p>
              <p className="text-sm whitespace-pre-wrap break-words">
                {rendered.body || (
                  <span className="text-muted-foreground italic">(empty)</span>
                )}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
