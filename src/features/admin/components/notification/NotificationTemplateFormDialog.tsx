import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, Bell, Eye } from "lucide-react";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import {
  notificationTypeLabel,
  notificationChannelLabel,
} from "@/shared/constants/notificationLabels";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  extractPlaceholders,
  insertPlaceholderAt,
  renderWithSamples,
} from "@/features/admin/utils/handlebars";
import { getVariableDoc } from "@/features/admin/constants/templateVariableDocs";
import TemplateVariablePalette from "@/features/admin/components/notification/TemplateVariablePalette";
import {
  notificationTemplateFormSchema,
  type NotificationTemplateFormValues,
} from "@/features/admin/schemas/notification/notification-template.schema";
import {
  useCreateTemplate,
  useReviseTemplate,
} from "@/features/admin/hooks/notification/useNotificationTemplates";
import {
  TEMPLATE_TITLE_MAX,
  TEMPLATE_BODY_MAX,
  type NotificationTemplateDto,
} from "@/features/admin/types/notification/notification-template.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null ⇒ create mode; a value ⇒ edit (generates a new version of that same pair). */
  editTarget: NotificationTemplateDto | null;
}

const TYPE_OPTIONS = Object.values(NotificationTypeEnum)
  .map((value) => ({ value, label: notificationTypeLabel(value) }))
  .sort((a, b) => a.label.localeCompare(b.label, "en"));

const CHANNEL_OPTIONS = Object.values(NotificationChannelEnum).map((value) => ({
  value,
  label: notificationChannelLabel(value),
}));

export default function NotificationTemplateFormDialog({
  open,
  onOpenChange,
  editTarget,
}: Props) {
  const isEdit = editTarget !== null;
  const create = useCreateTemplate();
  const revise = useReviseTemplate();

  // Toggles the whole dialog body between the edit form and a review screen that renders the
  // template as an actual notification (icon, bold title, body, timestamp) — a small "Preview:"
  // caption under each field wasn't enough to judge how the whole message reads together.
  const [view, setView] = useState<"edit" | "review">("edit");

  const form = useForm<NotificationTemplateFormValues>({
    resolver: zodResolver(notificationTemplateFormSchema),
    // The dialog is remounted via `key` on the page side whenever the target changes, so
    // defaultValues is enough — no reset effect needed (which tends to cause a render tick with
    // the previous template's data).
    defaultValues: {
      type: editTarget?.type ?? NotificationTypeEnum.TicketCreated,
      channel: editTarget?.channel ?? NotificationChannelEnum.InApp,
      // New template ⇒ seed with `{{title}}` / `{{body}}` instead of blank. Those two builtins
      // exist on every notification type and already resolve to a human sentence (e.g. "Ticket
      // TK-1042 has just been created") — so Review reads correctly from the very first open,
      // instead of an author reaching for internal-looking chips (Ticket ID, Customer ID: raw
      // GUIDs) and shipping a template a recipient can't read.
      titleTemplate: editTarget?.titleTemplate ?? "{{title}}",
      bodyTemplate: editTarget?.bodyTemplate ?? "{{body}}",
    },
  });

  // List of variables extracted from the content being typed RIGHT NOW — the author sees
  // immediately which variables they just declared, instead of having to save and reopen the
  // preview to find out.
  //
  // Use useWatch, NOT form.watch(): watch() returns a function that the React Compiler can't
  // safely memoize, and eslint blocks it immediately (`react-hooks/incompatible-library`).
  const title =
    useWatch({ control: form.control, name: "titleTemplate" }) ?? "";
  const body = useWatch({ control: form.control, name: "bodyTemplate" }) ?? "";
  const placeholders = useMemo(
    () => extractPlaceholders(title, body),
    [title, body],
  );

  // Variables flagged `internal` in the doc dictionary (raw GUIDs, bare enum numbers) that ended
  // up in the content — meaningless to the recipient, so Review calls them out explicitly instead
  // of letting the author notice only after the notification ships unreadable.
  const internalPlaceholders = useMemo(
    () => placeholders.filter((n) => getVariableDoc(n)?.internal),
    [placeholders],
  );

  // Type determines which set of variables is valid; in edit mode the selector is locked, so this value is fixed.
  const selectedType =
    useWatch({ control: form.control, name: "type" }) ??
    NotificationTypeEnum.TicketCreated;

  // Insert target. This used to be inferred from "the last focused field", but clicking a chip
  // moves focus out of the field, so the author could not see where the variable would land — and
  // in practice it went into the wrong one. The target is now an explicit, sticky on-screen choice.
  const [target, setTarget] = useState<"titleTemplate" | "bodyTemplate">(
    "bodyTemplate",
  );

  // Placeholders in the CURRENTLY TARGETED field only — Title and Body are separate strings, so a
  // variable typed into Body must not show as "already added" in the palette while composing Title.
  const placeholdersInTarget = useMemo(
    () => extractPlaceholders(target === "titleTemplate" ? title : body),
    [target, title, body],
  );

  // Refs are needed to read the caret position on insert, and to move the caret just past the
  // token that was inserted.
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Insert a variable into the targeted field, at the caret position.
   *
   * The caret must be restored just past the token afterwards: otherwise the field loses focus and
   * the next insert falls back to the start of the string (selectionStart of a just-blurred input is
   * 0) — clicking two variables in a row would send the second one to the front of the sentence.
   */
  const handleInsert = (name: string) => {
    const el = target === "titleTemplate" ? titleRef.current : bodyRef.current;
    const current = target === "titleTemplate" ? title : body;

    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;

    const { value, caret } = insertPlaceholderAt(current, name, start, end);
    form.setValue(target, value, { shouldDirty: true, shouldValidate: true });

    // Wait for React to write the new value into the DOM before placing the caret.
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  // Preview sentence — variables replaced with sample values so the author sees how the sentence
  // actually reads instead of mentally expanding `{{code}}`. Display only; what is saved to the DB
  // is still the raw template.
  const previewOf = (text: string) =>
    renderWithSamples(text, (n) => getVariableDoc(n)?.sample);

  const onSubmit = async (values: NotificationTemplateFormValues) => {
    try {
      if (isEdit) {
        await revise.mutateAsync({
          id: editTarget.id,
          payload: {
            titleTemplate: values.titleTemplate,
            bodyTemplate: values.bodyTemplate,
          },
        });
      } else {
        await create.mutateAsync(values);
      }
      onOpenChange(false);
    } catch (error) {
      // EntityError → error shown under the right input field; HttpError (409 duplicate pair, 400 syntax error) → toast.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const isPending = create.isPending || revise.isPending;

  const handleOpenChange = (next: boolean) => {
    if (!next) setView("edit");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* The variable palette is tall (up to 20 chips), and together with the two editor fields it
          overflows a laptop screen — the bottom of the palette and the Save button used to be cut
          off with no way to scroll to them. */}
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {view === "review"
              ? "Review notification"
              : isEdit
                ? `Edit template: ${notificationTypeLabel(editTarget.type)} · ${notificationChannelLabel(editTarget.channel)}`
                : "Create notification template"}
          </DialogTitle>
          <DialogDescription>
            {view === "review" ? (
              <>
                How this renders as an actual notification, with sample data in
                place of each variable. What's saved is still the raw template —
                go back to keep editing.
              </>
            ) : isEdit ? (
              <>
                Editing creates <b>version {editTarget.version + 1}</b> and
                activates it; v{editTarget.version} is kept so you can roll
                back. Type and channel can't be changed — create a new template
                if you need different ones.
              </>
            ) : (
              <>
                Each pair (type × channel) has only one template. If a pair
                already has one, use edit to create a new version.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {view === "review" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start gap-3 rounded-md border bg-background p-3.5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-foreground">
                      {title ? previewOf(title) : "—"}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground whitespace-pre-wrap">
                      {body ? previewOf(body) : "—"}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Just now
                    </p>
                  </div>
                </div>

                {internalPlaceholders.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/40">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
                    <p className="text-xs text-amber-800 dark:text-amber-400">
                      This uses internal-only data the recipient can't make
                      sense of ({internalPlaceholders.join(", ")}) — it will
                      show up as a raw ID, like in the preview above. Consider
                      swapping it for a readable field from the palette.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setView("edit")}
              >
                <ArrowLeft className="size-4" />
                Back to edit
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isPending
                  ? "Saving…"
                  : isEdit
                    ? `Create version ${editTarget.version + 1}`
                    : "Create template"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* Only the content area scrolls — Save/Cancel stay in view instead of requiring a
                scroll to the bottom of the palette to reach them. */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 pb-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Notification type{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => v && field.onChange(Number(v))}
                          disabled={isEdit}
                          items={TYPE_OPTIONS.map((o) => ({
                            value: String(o.value),
                            label: o.label,
                          }))}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent alignItemWithTrigger={false}>
                            {TYPE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={String(o.value)}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Channel <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => v && field.onChange(Number(v))}
                          disabled={isEdit}
                          items={CHANNEL_OPTIONS.map((o) => ({
                            value: String(o.value),
                            label: o.label,
                          }))}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent alignItemWithTrigger={false}>
                            {CHANNEL_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={String(o.value)}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="titleTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Title <span className="text-destructive">*</span>{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({field.value?.length ?? 0}/{TEMPLATE_TITLE_MAX})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. New ticket"
                          {...field}
                          ref={titleRef}
                          onFocus={() => setTarget("titleTemplate")}
                        />
                      </FormControl>
                      {field.value && (
                        <p className="text-xs text-muted-foreground">
                          Preview: {previewOf(field.value)}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Body <span className="text-destructive">*</span>{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({field.value?.length ?? 0}/{TEMPLATE_BODY_MAX})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder="e.g. A ticket has just been created."
                          {...field}
                          ref={bodyRef}
                          onFocus={() => setTarget("bodyTemplate")}
                        />
                      </FormControl>
                      {field.value && (
                        <p className="text-xs text-muted-foreground">
                          Preview: {previewOf(field.value)}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TemplateVariablePalette
                  type={selectedType}
                  typedNames={placeholders}
                  typedNamesInTarget={placeholdersInTarget}
                  onInsert={handleInsert}
                  target={target}
                  onTargetChange={setTarget}
                />
              </div>

              <DialogFooter className="mt-4 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView("review")}
                >
                  <Eye className="size-4" />
                  Review
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Saving…"
                    : isEdit
                      ? `Create version ${editTarget.version + 1}`
                      : "Create template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
