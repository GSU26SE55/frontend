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
  /** null ⇒ chế độ tạo mới; có giá trị ⇒ sửa (sinh phiên bản mới của chính cặp đó). */
  editTarget: NotificationTemplateDto | null;
}

const TYPE_OPTIONS = Object.values(NotificationTypeEnum)
  .map((value) => ({ value, label: notificationTypeLabel(value) }))
  .sort((a, b) => a.label.localeCompare(b.label, "vi"));

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
    // Dialog được remount bằng `key` ở phía page mỗi khi đổi mục tiêu, nên defaultValues là đủ —
    // không cần effect reset (vốn hay gây một nhịp render với dữ liệu của mẫu trước).
    defaultValues: {
      type: editTarget?.type ?? NotificationTypeEnum.TicketCreated,
      channel: editTarget?.channel ?? NotificationChannelEnum.InApp,
      titleTemplate: editTarget?.titleTemplate ?? "",
      bodyTemplate: editTarget?.bodyTemplate ?? "",
    },
  });

  // Danh sách biến bóc từ nội dung ĐANG GÕ — người soạn thấy ngay mình vừa khai báo biến nào,
  // không phải lưu xong rồi mở lại xem trước mới biết.
  //
  // Dùng useWatch chứ KHÔNG dùng form.watch(): watch() trả về một hàm mà React Compiler không
  // memo hoá an toàn được, eslint chặn ngay (`react-hooks/incompatible-library`).
  const title =
    useWatch({ control: form.control, name: "titleTemplate" }) ?? "";
  const body = useWatch({ control: form.control, name: "bodyTemplate" }) ?? "";
  const placeholders = useMemo(
    () => extractPlaceholders(title, body),
    [title, body],
  );

  // Loại quyết định bộ biến nào hợp lệ; ở chế độ sửa thì ô chọn bị khoá nên giá trị này cố định.
  const selectedType =
    useWatch({ control: form.control, name: "type" }) ??
    NotificationTypeEnum.TicketCreated;

  // Bấm một biến thì chèn vào ô vừa soạn dở, không phải luôn luôn một ô cố định. Mặc định là thân
  // vì đó là chỗ đặt phần lớn biến.
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
      // EntityError → lỗi hiện dưới đúng ô nhập; HttpError (409 trùng cặp, 400 cú pháp) → toast.
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
              ? `Sửa mẫu: ${notificationTypeLabel(editTarget.type)} · ${notificationChannelLabel(editTarget.channel)}`
              : "Tạo mẫu thông báo"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? (
              <>
                Sửa sẽ tạo <b>phiên bản {editTarget.version + 1}</b> và bật lên;
                bản v{editTarget.version} được giữ lại để quay lui. Không đổi
                được loại và kênh — muốn khác thì tạo mẫu mới.
              </>
            ) : (
              <>
                Mỗi cặp (loại × kênh) chỉ có một mẫu. Cặp đã có mẫu thì dùng
                chức năng sửa để tạo phiên bản mới.
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
                    <FormLabel>Loại thông báo</FormLabel>
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
                    <FormLabel>Kênh gửi</FormLabel>
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
                    Tiêu đề{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({field.value?.length ?? 0}/{TEMPLATE_TITLE_MAX})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Ticket mới {{code}}"
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
                    Nội dung{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({field.value?.length ?? 0}/{TEMPLATE_BODY_MAX})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="VD: Ticket {{code}} vừa được tạo, mức ưu tiên {{priority}}."
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
                Huỷ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Đang lưu…"
                  : isEdit
                    ? `Tạo phiên bản ${editTarget.version + 1}`
                    : "Tạo mẫu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
