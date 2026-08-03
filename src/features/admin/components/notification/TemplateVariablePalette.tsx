import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useTemplateVariables } from "@/features/admin/hooks/notification/useNotificationTemplates";
import type { NotificationTypeEnum } from "@/shared/enums/notification/notification.enum";

interface Props {
  /** Loại thông báo đang soạn — quyết định bộ biến nào hợp lệ. */
  type: NotificationTypeEnum;
  /** Các biến người soạn đã gõ, lấy từ nội dung đang nhập. */
  typedNames: string[];
  /** Chèn `{{tên}}` vào ô đang soạn. */
  onInsert: (name: string) => void;
}

/**
 * Bảng biến hợp lệ cho một loại thông báo, kèm cảnh báo biến gõ sai — hiện **ngay lúc gõ**.
 *
 * Vì sao cần: template gọi biến không tồn tại thì Handlebars render ra **chuỗi rỗng chứ không báo
 * lỗi**. Trước 03/08/2026 người soạn phải tự đoán tên khoá, và đoán sai thì không có gì báo — bộ
 * template của dự án từng chạy nhiều tháng với `{{ticketCode}}` trong khi consumer ghi khoá `code`,
 * `{{serialNumber}}` trong khi consumer ghi `assetSerialNumber`. Backend nay trả 400 khi lưu, nhưng
 * chặn được ở đây thì người soạn không phải bấm lưu mới biết mình gõ sai.
 */
export default function TemplateVariablePalette({
  type,
  typedNames,
  onInsert,
}: Props) {
  const { data: groups, isLoading } = useTemplateVariables();

  const group = useMemo(
    () => groups?.find((g) => g.type === type),
    [groups, type],
  );

  // So khớp không phân biệt hoa thường — model bên backend dựng bằng OrdinalIgnoreCase, nên
  // {{Code}} và {{code}} đều tra được.
  const allowedLower = useMemo(() => {
    if (!group) return null;
    return new Set(
      [...group.payload, ...group.builtin].map((v) => v.toLowerCase()),
    );
  }, [group]);

  const unknown = useMemo(() => {
    if (!allowedLower) return [];
    return typedNames.filter((n) => !allowedLower.has(n.toLowerCase()));
  }, [typedNames, allowedLower]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Đang tải danh sách biến…</p>
      </div>
    );
  }

  // Không lấy được danh mục (mất mạng, 403) — im lặng bỏ qua còn hơn chặn người soạn lưu bài.
  // Backend vẫn là chốt chặn cuối, nên bỏ qua ở đây không làm lọt template hỏng vào DB.
  if (!group) return null;

  const chip =
    "font-mono text-xs rounded border px-1.5 py-0.5 transition-colors " +
    "border-border bg-background hover:bg-accent hover:text-accent-foreground";

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        Bấm để chèn biến vào ô đang soạn. Chỉ những biến dưới đây mới có giá trị
        lúc gửi thật — biến khác sẽ hiện ra rỗng.
      </p>

      {group.payload.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium">Dữ liệu của loại này</p>
          <div className="flex flex-wrap gap-1.5">
            {group.payload.map((name) => (
              <button
                key={name}
                type="button"
                className={chip}
                onClick={() => onInsert(name)}
              >
                {`{{${name}}}`}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Loại thông báo này không kèm dữ liệu riêng — chỉ dùng được các biến
          chung bên dưới.
        </p>
      )}

      <div>
        <p className="mb-1 text-xs font-medium">
          Biến chung{" "}
          <span className="font-normal text-muted-foreground">
            (loại nào cũng có)
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {group.builtin.map((name) => (
            <button
              key={name}
              type="button"
              className={chip}
              onClick={() => onInsert(name)}
            >
              {`{{${name}}}`}
            </button>
          ))}
        </div>
      </div>

      {unknown.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">
            Biến không tồn tại:{" "}
            {unknown.map((n, i) => (
              <span key={n}>
                {i > 0 && ", "}
                <code className="font-mono">{`{{${n}}}`}</code>
              </span>
            ))}
            . Chỗ này sẽ hiện ra rỗng khi gửi thật, và máy chủ sẽ từ chối lưu.
          </p>
        </div>
      )}
    </div>
  );
}
