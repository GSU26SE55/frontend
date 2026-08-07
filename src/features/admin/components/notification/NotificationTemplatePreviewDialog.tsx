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
  // Lỗi cú pháp Handlebars (400) hiện ngay trong dialog — toast sẽ trôi mất
  // trong khi admin đang cần sửa template.
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  // Kết quả gửi thử hiện NGAY TRONG dialog, không chỉ bằng toast: điều admin cần biết nhất là thư
  // đi tới địa chỉ NÀO (tài khoản seed thường mang email placeholder kiểu admin@yourdomain.com —
  // thư gửi thành công nhưng không ai nhận được). Toast trôi mất sau vài giây, đúng lúc người dùng
  // còn đang đợi thư nên bỏ lỡ.
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Mặc định là form: bộ biến của mẫu đã biết trước nên không có lý do bắt gõ JSON tay.
  // JSON thô giữ lại làm lối thoát cho mẫu tương lai dùng block helper (cần giá trị đúng kiểu
  // bool/số) — bộ mẫu hiện tại không có mẫu nào như vậy.
  const [mode, setMode] = useState<InputMode>("form");
  const [vars, setVars] = useState<Record<string, string>>({});

  const preview = usePreviewTemplate();
  const testSend = useTestSendTemplate();

  const form = useForm<TemplateSampleDataFormValues>({
    resolver: zodResolver(templateSampleDataSchema),
    defaultValues: { sampleDataJson: "" },
  });

  // Biến lấy từ CẢ tiêu đề lẫn thân — thân mới là chỗ chứa phần lớn biến, mà bảng lại không hiện.
  const placeholders = useMemo(
    () =>
      template
        ? extractPlaceholders(template.titleTemplate, template.bodyTemplate)
        : [],
    [template],
  );

  // Reset state khi đổi template được xử lý bằng `key` ở phía page (remount
  // component) — không dùng effect setState, tránh cascading render.
  if (!template) return null;

  // BE chặn gửi thử kênh khác Email (SMS tốn tiền thật, push cần device token).
  // 02/08/2026: channel là SỐ, không còn là chuỗi "Email" — so bằng enum.
  const canTestSend = template.channel === NotificationChannelEnum.Email;
  const outOfQuota = remaining === 0;

  const jsonText = form.getValues().sampleDataJson?.trim() ?? "";

  /**
   * Gom dữ liệu mẫu theo chế độ đang mở.
   * Ô để trống ⇒ BỎ QUA (không gửi khoá đó) — giữ đúng ngữ nghĩa cũ của JSON rỗng: placeholder
   * không có giá trị sẽ render ra rỗng, đó là cách phát hiện mẫu gọi sai tên biến.
   */
  const buildSampleData = (): Record<string, unknown> | undefined => {
    if (mode === "json") return parseSampleData(jsonText);

    const entries = placeholders
      .map((name) => [name, vars[name] ?? ""] as const)
      .filter(([, value]) => value !== "");

    // Object.fromEntries thay vì gán khoá động vào object literal: khoá tên "__proto__" sẽ ghi đè
    // prototype nếu gán trực tiếp.
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  };

  /** JSON hỏng ⇒ chặn, để nút Gửi thử không âm thầm gửi đi với dữ liệu rỗng. */
  const hasBrokenJson = () =>
    mode === "json" &&
    jsonText !== "" &&
    parseSampleData(jsonText) === undefined;

  const switchMode = (next: InputMode) => {
    if (next === mode) return;

    if (next === "json") {
      // Nạp sẵn JSON từ giá trị đang có trong form để không phải gõ lại.
      const data = buildSampleData();
      form.setValue(
        "sampleDataJson",
        data ? JSON.stringify(data, null, 2) : "",
      );
    } else {
      // JSON hỏng thì giữ nguyên form, không ghi đè bằng dữ liệu không parse được.
      const parsed = parseSampleData(jsonText);
      if (parsed) {
        setVars((prev) => ({
          ...prev,
          ...Object.fromEntries(
            placeholders.map((name) => [name, toInputValue(parsed[name])]),
          ),
        }));
      }
      // Dọn ô JSON: nó vẫn nằm trong form state kể cả khi không hiển thị, để lại chuỗi hỏng thì
      // zodResolver sẽ chặn submit bằng một lỗi mà người dùng không nhìn thấy ở chế độ form.
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

  // Chỉ chế độ JSON mới chạy validate của zod. Ở chế độ form, ô JSON bị ẩn nên một lỗi validate
  // trên nó sẽ chặn submit mà không hiện ra ở đâu cả.
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
      setPreviewError("Dữ liệu mẫu không phải JSON hợp lệ.");
      return;
    }
    setPreviewError(null);
    const res = await testSend.mutateAsync({
      id: template.id,
      payload: { sampleData: buildSampleData() },
    });
    setRemaining(res.data?.remainingThisHour ?? null);
    // BE trả message dạng "Đã gửi thử tới {email}." — giữ lại để hiện cố định trong dialog.
    setSentTo(res.message ?? "Đã gửi thử.");
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
            Dựng thử với dữ liệu mẫu — không gửi đi đâu cả. Ô để trống sẽ render
            ra rỗng, đó là cách phát hiện mẫu gọi sai tên biến.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Dữ liệu mẫu</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => switchMode(mode === "form" ? "json" : "form")}
              >
                {mode === "form" ? "Nhập JSON thô" : "Quay lại dạng form"}
              </Button>
            </div>

            {mode === "form" ? (
              placeholders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Mẫu này không có biến nào — bấm “Xem trước” để dựng thử luôn.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {placeholders.map((name) => (
                    <div key={name} className="space-y-1.5">
                      {/* Nhãn để nguyên dạng {{tên}} — admin thấy đúng biến mà mẫu đang gọi. */}
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
                        placeholder="(để trống)"
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

            {/* Lý do nút bị khoá phải đọc được mà không cần hover: thuộc tính `title` KHÔNG hiện
                tooltip trên phần tử disabled (hành vi chuẩn của HTML — phần tử disabled không nhận
                sự kiện chuột), nên trước đây nút xám mà không nói vì sao. */}
            {!canTestSend ? (
              <p className="text-xs text-muted-foreground">
                Chỉ gửi thử được mẫu kênh Email — mẫu này thuộc kênh{" "}
                {notificationChannelLabel(template.channel)}.
              </p>
            ) : outOfQuota ? (
              <p className="text-xs text-muted-foreground">
                Đã dùng hết 5 lượt gửi thử trong giờ này. Thử lại vào giờ sau.
              </p>
            ) : null}

            {sentTo && (
              <div className="text-xs rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                  {sentTo}
                </p>
                {/* Gửi được ≠ nhận được. Nói rõ chỗ cần kiểm tra khi chờ mãi không thấy thư —
                    nguyên nhân hay gặp nhất là tài khoản đang mang email mặc định lúc seed. */}
                <p className="mt-1 text-muted-foreground">
                  Thư gửi tới địa chỉ email của tài khoản bạn đang đăng nhập.
                  Không thấy thư? Kiểm tra hộp thư rác, và đối chiếu địa chỉ ở
                  trên có đúng hòm thư bạn đang mở không.
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
