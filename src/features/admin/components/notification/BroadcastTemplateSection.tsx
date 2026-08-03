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
  /** Giá trị biến admin đang điền. Khoá là tên biến. */
  vars: Record<string, string>;
  onVarChange: (name: string, value: string) => void;
}

/**
 * Phần "dùng mẫu" của form gửi hàng loạt: ô điền biến + xem trước nội dung **theo từng kênh**.
 *
 * <b>Vì sao xem trước phải tách theo kênh:</b> mẫu được khoá theo cặp (Loại × Kênh) và bản SMS bị
 * nén ngắn lại vì tính tiền theo đoạn — cùng một lần gửi 3 kênh cho ra 3 nội dung khác nhau. Một ô
 * xem trước duy nhất sẽ nói dối về 2 trong 3 kênh. Đây cũng chính là lý do phải render lúc gửi chứ
 * không "đổ chữ sẵn vào ô soạn".
 *
 * <b>Ô điền biến lấy từ đâu:</b> từ chính mẫu của các kênh đang chọn (xem <c>fieldNames</c>), không
 * phải từ toàn bộ khoá payload mà loại đó có thể có. Biến chung (Title/Body/UserId…) do hệ thống tự
 * điền nên không bao giờ xuất hiện — hiện ra chỉ gây rối.
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

  // Bỏ ô trống khỏi payload: gửi chuỗi rỗng hay bỏ hẳn khoá đều cho ra chỗ trống lúc render, nhưng
  // bỏ hẳn thì phần "biến chưa có giá trị" ở dưới nói đúng sự thật.
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
   * Danh sách ô cần điền = **biến mà mẫu của các kênh đang chọn thật sự gọi tới**, chứ không phải
   * toàn bộ khoá payload mà loại đó có thể có.
   *
   * Hai thứ này khác nhau đáng kể. Ví dụ loại "Thông báo hệ thống" khai 5 khoá
   * (`digest`, `count`, `from`, `to`, `notificationIds`) nhưng đó là của **bản tin gom** do máy sinh
   * — người gửi tay không bao giờ điền, mà mẫu của nó cũng chỉ chuyển tiếp nguyên văn. Bày cả 5 ô
   * ra chỉ khiến người dùng tưởng mình phải điền gì đó.
   *
   * `missingVariables` từ xem trước chính là "biến mẫu gọi mà chưa có giá trị". Hợp nó với các ô đã
   * điền để ô không biến mất ngay khi vừa gõ xong.
   */
  const fieldNames = useMemo(() => {
    const filled = Object.keys(vars).filter((k) => vars[k]?.trim().length > 0);

    if (!preview) {
      // Chưa có xem trước (lần render đầu) — tạm dùng danh mục để khung không nhảy.
      return groups?.find((g) => g.type === type)?.payload ?? [];
    }

    const needed = new Set<string>(filled);
    for (const row of preview) row.missingVariables.forEach((v) => needed.add(v));
    return [...needed].sort((a, b) => a.localeCompare(b));
  }, [preview, vars, groups, type]);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Nội dung sẽ được dựng từ <b>mẫu thông báo</b> của loại đang chọn. Mỗi
          kênh có mẫu riêng nên nội dung từng kênh có thể khác nhau — bản SMS
          được nén ngắn lại. Tiêu đề và nội dung bạn gõ ở dưới trở thành{" "}
          <b>bản dự phòng</b> cho kênh không có mẫu.
        </p>
      </div>

      {fieldNames.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium">Điền biến của mẫu</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {fieldNames.map((name) => (
              <label key={name} className="space-y-1">
                <span className="font-mono text-xs text-muted-foreground">
                  {`{{${name}}}`}
                </span>
                <Input
                  value={vars[name] ?? ""}
                  onChange={(e) => onVarChange(name, e.target.value)}
                  placeholder="để trống ⇒ hiện ra rỗng"
                />
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Mẫu của loại này không cần biến nào — nội dung dựng sẵn, hoặc chỉ
            dùng các biến chung do hệ thống tự điền.
          </span>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium">
          Xem trước theo từng kênh{" "}
          {isFetching && (
            <span className="font-normal text-muted-foreground">
              — đang dựng…
            </span>
          )}
        </p>

        {!preview || preview.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Chọn kênh gửi để xem trước.
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
                      Không có mẫu — dùng chữ bạn gõ
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
                      Chưa có giá trị:{" "}
                      {row.missingVariables.map((v, i) => (
                        <span key={v}>
                          {i > 0 && ", "}
                          <code className="font-mono">{`{{${v}}}`}</code>
                        </span>
                      ))}{" "}
                      — chỗ đó sẽ hiện ra rỗng.
                    </span>
                  </p>
                )}

                {row.renderError && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Mẫu hỏng cú pháp — kênh này sẽ gửi bằng chữ bạn gõ.
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
