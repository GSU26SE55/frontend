import { useMemo, useState } from "react";
import { Bell, Send, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { extractPlaceholders } from "@/features/admin/utils/handlebars";
import { getVariableDoc } from "@/features/admin/constants/templateVariableDocs";
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

  // 17/08/2026 — the "raw JSON input" mode was removed. It existed as an escape hatch for templates
  // using block helpers (which need real bool/number types), but none of the 82 templates use one,
  // while every operator had to look at a JSON field irrelevant to what they were doing.
  const [vars, setVars] = useState<Record<string, string>>({});

  const preview = usePreviewTemplate();
  const testSend = useTestSendTemplate();

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

  /**
   * Collect the sample data from the input fields.
   * An empty field ⇒ SKIPPED (the key is not sent) — a variable with no value renders empty, which
   * is exactly how a template calling the wrong variable name gets spotted.
   */
  const buildSampleData = (): Record<string, unknown> | undefined => {
    const entries = placeholders
      .map((name) => [name, vars[name] ?? ""] as const)
      .filter(([, value]) => value !== "");

    // Object.fromEntries rather than assigning dynamic keys onto an object literal: a key named
    // "__proto__" would overwrite the prototype if assigned directly.
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  };

  /**
   * Fill every field with its documented sample value. Variables with no dictionary entry are left
   * alone rather than filled with a guess — a made-up value renders a sentence that looks right
   * while proving nothing.
   */
  const fillSampleValues = () => {
    setVars((prev) => {
      const next = { ...prev };
      for (const name of placeholders) {
        const doc = getVariableDoc(name);
        if (doc) next[name] = doc.sample;
      }
      return next;
    });
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void runPreview();
  };

  const onTestSend = async () => {
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
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {notificationTypeLabel(template.type)} ·{" "}
            {notificationChannelLabel(template.channel)} · v{template.version}
          </DialogTitle>
          <DialogDescription>
            Preview the content with sample data — nothing is sent anywhere. An
            empty field renders empty, which is how you spot a template calling
            the wrong variable name.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Sample data</span>
              {/* Filling every field by hand just to read one sentence is the most tedious part of
                  this screen — most users only want to check that the wording reads well. */}
              {placeholders.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={fillSampleValues}
                >
                  <Wand2 className="size-3.5" />
                  Fill samples
                </Button>
              )}
            </div>

            {placeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This template uses no variables — click "Preview" to render it.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {placeholders.map((name) => {
                  // The label is the plain-language name — the raw variable name is no longer
                  // shown, since a business user does not need to know the key the template calls.
                  const doc = getVariableDoc(name);
                  return (
                    <div key={name} className="space-y-1.5">
                      <Label
                        htmlFor={`tpl-var-${name}`}
                        className="text-xs font-medium"
                      >
                        {doc?.label ?? name}
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
                        // The sample value as placeholder doubles as documentation: the user sees
                        // straight away what kind of value this variable carries when actually sent.
                        placeholder={
                          doc ? `e.g. ${doc.sample}` : "(leave empty)"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={preview.isPending}>
                {preview.isPending ? "Rendering…" : "Preview"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canTestSend || outOfQuota || testSend.isPending}
                onClick={onTestSend}
                title={
                  !canTestSend
                    ? "Only Email templates can be test-sent"
                    : outOfQuota
                      ? "All 5 test sends for this hour have been used"
                      : "Send to your own email address"
                }
              >
                <Send className="size-3.5" />
                {testSend.isPending ? "Sending…" : "Send a test to me"}
              </Button>
              {remaining !== null && (
                <span className="text-xs text-muted-foreground">
                  {remaining} test sends left this hour
                </span>
              )}
            </div>

            {/* The reason a button is disabled must be readable without hovering: the `title`
                attribute does NOT show a tooltip on disabled elements (standard HTML behavior —
                disabled elements don't receive mouse events), so previously the button just went
                gray without saying why. */}
            {!canTestSend ? (
              <p className="text-xs text-muted-foreground">
                Only Email templates can be test-sent — this template is on the{" "}
                {notificationChannelLabel(template.channel)}.
              </p>
            ) : outOfQuota ? (
              <p className="text-xs text-muted-foreground">
                All 5 test sends for this hour have been used. Try again next
                hour.
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
                  The email goes to the address of the account you are signed in
                  as. Don't see it? Check the spam folder, and compare the
                  address above with the inbox you have open.
                </p>
              </div>
            )}
          </form>

          {previewError && (
            <p className="text-sm text-red-500 border border-red-500/30 bg-red-500/5 rounded-lg px-3 py-2">
              {previewError}
            </p>
          )}

          {rendered && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3 rounded-md border bg-background p-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-2sm font-semibold text-foreground wrap-break-word">
                    {rendered.title || (
                      <span className="italic text-muted-foreground">
                        (empty)
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word">
                    {rendered.body || <span className="italic">(empty)</span>}
                  </p>
                  <p className="mt-1.5 text-2xs text-muted-foreground">
                    Just now
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
