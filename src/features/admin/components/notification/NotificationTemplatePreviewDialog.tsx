import { useMemo, useState } from "react";
import { Send, Wand2 } from "lucide-react";
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

  // 17/08/2026 — chế độ "nhập JSON thô" đã bị gỡ. Nó tồn tại như lối thoát cho template dùng block
  // helper (cần bool/number đúng kiểu), nhưng không template nào trong 82 cái đang dùng, còn người
  // vận hành thì phải nhìn thấy một ô JSON không liên quan gì tới việc họ đang làm.
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
   * Gom dữ liệu mẫu từ các ô đang nhập.
   * Ô để trống ⇒ BỎ QUA (không gửi khoá đó) — biến không có giá trị sẽ render ra trống, đó chính là
   * cách phát hiện template đang gọi sai tên biến.
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
            Xem thử nội dung với dữ liệu mẫu — không gửi đi đâu cả. Ô để trống
            sẽ hiện ra trống, đó là cách phát hiện mẫu đang gọi sai tên biến.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Dữ liệu mẫu</span>
              {/* Điền tay từng ô chỉ để đọc thử một câu là chỗ mất công nhất ở màn này — phần lớn
                  người dùng chỉ muốn xem câu chữ đọc có xuôi không. */}
              {placeholders.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={fillSampleValues}
                >
                  <Wand2 className="size-3.5" />
                  Điền mẫu
                </Button>
              )}
            </div>

            {placeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Mẫu này không dùng biến nào — bấm "Xem thử" để hiển thị ngay.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {placeholders.map((name) => {
                  // Nhãn là tên tiếng Việt — tên biến thô không hiện ra nữa, người dùng nghiệp
                  // vụ không cần biết template gọi khoá gì.
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
                        // Giá trị mẫu làm placeholder cũng là một dạng tài liệu: người dùng thấy
                        // ngay biến này mang giá trị kiểu gì lúc gửi thật.
                        placeholder={doc ? `VD: ${doc.sample}` : "(để trống)"}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={preview.isPending}>
                {preview.isPending ? "Đang dựng…" : "Xem thử"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canTestSend || outOfQuota || testSend.isPending}
                onClick={onTestSend}
                title={
                  !canTestSend
                    ? "Chỉ mẫu kênh Email mới gửi thử được"
                    : outOfQuota
                      ? "Đã dùng hết 5 lượt gửi thử trong giờ này"
                      : "Gửi vào email của chính bạn"
                }
              >
                <Send className="size-3.5" />
                {testSend.isPending ? "Đang gửi…" : "Gửi thử cho tôi"}
              </Button>
              {remaining !== null && (
                <span className="text-xs text-muted-foreground">
                  Còn {remaining} lượt gửi trong giờ này
                </span>
              )}
            </div>

            {/* The reason a button is disabled must be readable without hovering: the `title`
                attribute does NOT show a tooltip on disabled elements (standard HTML behavior —
                disabled elements don't receive mouse events), so previously the button just went
                gray without saying why. */}
            {!canTestSend ? (
              <p className="text-xs text-muted-foreground">
                Chỉ mẫu kênh Email mới gửi thử được — mẫu này thuộc kênh{" "}
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
                {/* Sent ≠ received. Spell out where to check when the email never shows up —
                    the most common cause is the account still carrying the default seed email. */}
                <p className="mt-1 text-muted-foreground">
                  Email được gửi tới địa chỉ của tài khoản bạn đang đăng nhập.
                  Không thấy? Kiểm tra hộp thư rác, và đối chiếu địa chỉ ở trên
                  với hòm thư bạn đang mở.
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
            <div className="space-y-3 border border-border rounded-xl p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Tiêu đề</p>
                <p className="text-sm font-medium break-words">
                  {rendered.title || (
                    <span className="text-muted-foreground italic">
                      (trống)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Nội dung</p>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {rendered.body || (
                    <span className="text-muted-foreground italic">
                      (trống)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
