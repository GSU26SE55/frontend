import { useState } from "react";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HttpError } from "@/shared/lib/errors";
import { MESSAGES } from "@/shared/constants/messages";
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

export default function NotificationTemplatePreviewDialog({
  template,
  onClose,
}: Props) {
  const [rendered, setRendered] = useState<TemplatePreviewDto | null>(null);
  // Lỗi cú pháp Handlebars (400) hiện ngay trong dialog — toast sẽ trôi mất
  // trong khi admin đang cần sửa template.
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const preview = usePreviewTemplate();
  const testSend = useTestSendTemplate();

  const form = useForm<TemplateSampleDataFormValues>({
    resolver: zodResolver(templateSampleDataSchema),
    defaultValues: { sampleDataJson: "" },
  });

  // Reset state khi đổi template được xử lý bằng `key` ở phía page (remount
  // component) — không dùng effect setState, tránh cascading render.
  if (!template) return null;

  // BE chặn gửi thử kênh khác Email (SMS tốn tiền thật, push cần device token).
  const canTestSend = template.channel === "Email";
  const outOfQuota = remaining === 0;

  const onPreview = async (values: TemplateSampleDataFormValues) => {
    setPreviewError(null);
    try {
      const res = await preview.mutateAsync({
        id: template.id,
        payload: { sampleData: parseSampleData(values.sampleDataJson) },
      });
      setRendered(res.data ?? null);
    } catch (error) {
      setRendered(null);
      setPreviewError(
        error instanceof HttpError ? error.message : MESSAGES.unknownError,
      );
    }
  };

  const onTestSend = async () => {
    const values = form.getValues();
    const res = await testSend.mutateAsync({
      id: template.id,
      payload: { sampleData: parseSampleData(values.sampleDataJson) },
    });
    setRemaining(res.data?.remainingThisHour ?? null);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template.type} · {template.channel} · {template.locale} · v
            {template.version}
          </DialogTitle>
          <DialogDescription>
            Dựng thử với dữ liệu mẫu — không gửi đi đâu cả. Placeholder không có
            trong dữ liệu mẫu sẽ ra rỗng, đó là cách phát hiện template gọi sai
            tên biến.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onPreview)} className="space-y-4">
            <FormField
              control={form.control}
              name="sampleDataJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dữ liệu mẫu (JSON, tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      className="font-mono text-xs"
                      placeholder={
                        '{\n  "ticketCode": "TK-001",\n  "priority": "P1Critical"\n}'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={preview.isPending}>
                {preview.isPending ? "Đang dựng…" : "Xem trước"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canTestSend || outOfQuota || testSend.isPending}
                onClick={onTestSend}
                title={
                  !canTestSend
                    ? "Chỉ gửi thử được template kênh Email"
                    : outOfQuota
                      ? "Đã hết 5 lượt gửi thử trong giờ này"
                      : "Gửi tới email của chính bạn"
                }
              >
                <Send className="size-3.5" />
                {testSend.isPending ? "Đang gửi…" : "Gửi thử cho tôi"}
              </Button>
              {remaining !== null && (
                <span className="text-xs text-muted-foreground">
                  Còn {remaining} lượt trong giờ này
                </span>
              )}
            </div>
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
              <p className="text-xs text-muted-foreground mb-0.5">Tiêu đề</p>
              <p className="text-sm font-medium break-words">
                {rendered.title || (
                  <span className="text-muted-foreground italic">(rỗng)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Nội dung</p>
              <p className="text-sm whitespace-pre-wrap break-words">
                {rendered.body || (
                  <span className="text-muted-foreground italic">(rỗng)</span>
                )}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
