import { useMemo } from "react";
import { AlertTriangle, Check, Plus } from "lucide-react";
import { useTemplateVariables } from "@/features/admin/hooks/notification/useNotificationTemplates";
import { getVariableDoc } from "@/features/admin/constants/templateVariableDocs";
import type { NotificationTypeEnum } from "@/shared/enums/notification/notification.enum";

interface Props {
  /** The notification type being composed — decides which set of variables is valid. */
  type: NotificationTypeEnum;
  /** Variables the author has typed, taken from the content currently being entered. */
  typedNames: string[];
  /** Chèn `{{name}}` vào đúng vị trí con trỏ trong ô đang chọn. */
  onInsert: (name: string) => void;
  /** Ô đang là đích chèn — quyết định chip bấm vào sẽ rơi vào Tiêu đề hay Nội dung. */
  target: "titleTemplate" | "bodyTemplate";
  onTargetChange: (target: "titleTemplate" | "bodyTemplate") => void;
}

/**
 * The palette of valid variables for a notification type, plus a warning for mistyped variables —
 * shown **as you type**.
 *
 * Why it's needed: when a template references a variable that doesn't exist, Handlebars renders an
 * **empty string rather than reporting an error**. Before 08/03/2026 authors had to guess key names,
 * and a wrong guess produced no signal — this project's template set ran for months with
 * `{{ticketCode}}` while the consumer wrote the key `code`, and `{{serialNumber}}` while the consumer
 * wrote `assetSerialNumber`. The backend now returns 400 on save, but catching it here means the
 * author doesn't have to hit save to find out they mistyped.
 *
 * 17/08/2026 — each chip now leads with a **plain-language name** ("Mã ticket hiển thị") instead of
 * the raw key, with `{{code}}` demoted to a caption underneath. The keys alone were unreadable: an
 * author looking at `{{code}}` `{{ticketId}}` `{{customerId}}` `{{screen}}` had no way to tell which
 * one is the ticket number the customer actually recognises and which is an internal GUID. The
 * descriptions come from a FE-side dictionary (`templateVariableDocs.ts`) because the BE endpoint
 * only returns key names.
 */
export default function TemplateVariablePalette({
  type,
  typedNames,
  onInsert,
  target,
  onTargetChange,
}: Props) {
  const { data: groups, isLoading } = useTemplateVariables();

  const group = useMemo(
    () => groups?.find((g) => g.type === type),
    [groups, type],
  );

  // Case-insensitive matching — the backend model is built with OrdinalIgnoreCase, so both
  // {{Code}} and {{code}} resolve.
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

  // Which variables are already in the content — the chip shows a check instead of a plus so the
  // author can see at a glance what's left to add.
  const usedLower = useMemo(
    () => new Set(typedNames.map((n) => n.toLowerCase())),
    [typedNames],
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Đang tải danh sách biến…
        </p>
      </div>
    );
  }

  // Couldn't fetch the catalog (network loss, 403) — silently skip rather than blocking the author
  // from saving. The backend is still the final gate, so skipping here won't let a broken template into the DB.
  if (!group) return null;

  const renderChips = (names: string[]) => (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {names.map((name) => {
        const doc = getVariableDoc(name);
        const used = usedLower.has(name.toLowerCase());
        return (
          <button
            key={name}
            type="button"
            onClick={() => onInsert(name)}
            title={doc ? `${doc.label} — ví dụ: ${doc.sample}` : `Chèn ${name}`}
            className={
              "group flex items-start gap-2 rounded-md border px-2 py-1.5 text-left transition-colors " +
              (used
                ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                : "border-border bg-background hover:bg-accent")
            }
          >
            {/* Dấu tick chỉ là chỉ báo "đã có trong nội dung" — bấm vẫn luôn là chèn thêm, vì
                một biến hoàn toàn có thể xuất hiện hợp lệ ở cả tiêu đề lẫn nội dung. */}
            {used ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            ) : (
              <Plus className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">
                {doc?.label ?? name}
                {doc?.internal && (
                  <span
                    className="ml-1 rounded bg-muted px-1 text-[10px] font-normal text-muted-foreground"
                    title="Mã nội bộ — người nhận đọc không hiểu, cân nhắc trước khi đưa vào nội dung"
                  >
                    nội bộ
                  </span>
                )}
              </span>
              {doc && (
                <span className="block truncate text-[10px] text-muted-foreground">
                  Ví dụ: {doc.sample}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      {/* Nút chọn ô đích. Trước đây chip chèn vào "ô vừa focus", nhưng sau khi bấm chip thì focus
          đã rời khỏi ô — người dùng không có cách nào biết biến sắp rơi vào đâu, và thực tế đã
          chèn nhầm sang ô kia. Nay đích hiện rõ ràng và giữ nguyên cho tới khi đổi. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Chèn vào:</span>
        <div className="inline-flex rounded-md border border-border bg-background p-0.5">
          {(
            [
              ["titleTemplate", "Tiêu đề"],
              ["bodyTemplate", "Nội dung"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onTargetChange(value)}
              className={
                "rounded px-2.5 py-1 text-xs transition-colors " +
                (target === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Bấm một mục bên dưới để chèn vào vị trí con trỏ. Chỉ những mục này mới
        có giá trị lúc gửi thật — thứ khác sẽ hiện ra trống.
      </p>

      {group.payload.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium">
            Dữ liệu của loại thông báo này
          </p>
          {renderChips(group.payload)}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Loại thông báo này không kèm dữ liệu riêng — chỉ dùng được các biến
          chung bên dưới.
        </p>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium">
          Biến chung{" "}
          <span className="font-normal text-muted-foreground">
            (loại nào cũng dùng được)
          </span>
        </p>
        {renderChips(group.builtin)}
      </div>

      {unknown.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">
            {/* Tên biến sai vẫn phải in ra nguyên văn — đây là thứ duy nhất giúp người soạn tìm
                đúng chỗ để sửa trong nội dung. */}
            Biến không hợp lệ: {unknown.join(", ")}. Biến này sẽ hiện ra trống
            lúc gửi thật, và server sẽ từ chối lưu.
          </p>
        </div>
      )}
    </div>
  );
}
