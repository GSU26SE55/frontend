import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  insertPlaceholder,
} from "@/features/admin/utils/handlebars";
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

  const form = useForm<NotificationTemplateFormValues>({
    resolver: zodResolver(notificationTemplateFormSchema),
    // The dialog is remounted via `key` on the page side whenever the target changes, so
    // defaultValues is enough — no reset effect needed (which tends to cause a render tick with
    // the previous template's data).
    defaultValues: {
      type: editTarget?.type ?? NotificationTypeEnum.TicketCreated,
      channel: editTarget?.channel ?? NotificationChannelEnum.InApp,
      titleTemplate: editTarget?.titleTemplate ?? "",
      bodyTemplate: editTarget?.bodyTemplate ?? "",
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

  // Type determines which set of variables is valid; in edit mode the selector is locked, so this value is fixed.
  const selectedType =
    useWatch({ control: form.control, name: "type" }) ??
    NotificationTypeEnum.TicketCreated;

  // Clicking a variable inserts it into whichever field was last being edited, not always a fixed
  // field. Defaults to the body since that's where most variables go.
  const [lastFocused, setLastFocused] = useState<
    "titleTemplate" | "bodyTemplate"
  >("bodyTemplate");

  const handleInsert = (name: string) => {
    const current = lastFocused === "titleTemplate" ? title : body;
    form.setValue(lastFocused, insertPlaceholder(current, name), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Edit template: ${notificationTypeLabel(editTarget.type)} · ${notificationChannelLabel(editTarget.channel)}`
              : "Create notification template"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? (
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification type</FormLabel>
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
                    <FormLabel>Channel</FormLabel>
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
                    Title{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({field.value?.length ?? 0}/{TEMPLATE_TITLE_MAX})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. New ticket {{code}}"
                      {...field}
                      onFocus={() => setLastFocused("titleTemplate")}
                    />
                  </FormControl>
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
                    Body{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({field.value?.length ?? 0}/{TEMPLATE_BODY_MAX})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="e.g. Ticket {{code}} was just created, priority {{priority}}."
                      {...field}
                      onFocus={() => setLastFocused("bodyTemplate")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TemplateVariablePalette
              type={selectedType}
              typedNames={placeholders}
              onInsert={handleInsert}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}
