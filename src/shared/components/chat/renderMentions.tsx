import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Bắt token "@Tên" trong text đã gửi. Từ đầu tiên sau "@" luôn thuộc tên; các từ
// TIẾP THEO chỉ được gộp nếu bắt đầu bằng CHỮ HOA (tên riêng, vd "Tri Tran",
// "Staff Tier3 Senior"). Nhờ vậy "@Tri Tran con cc" chỉ tô "@Tri Tran" — "con cc"
// viết thường bị loại. FE không có danh sách tên chính xác trong body (BE không
// trả mentions kèm comment), nên đây là heuristic đáng tin nhất.
const MENTION_RE = /@[\p{L}\p{N}_]+(?: \p{Lu}[\p{L}\p{N}_]*){0,4}/gu;

/**
 * Render body comment, tô màu phần "@Tên" khác với text còn lại.
 *
 * `isOwn` = tin của chính mình (bong bóng nền primary) → dùng màu sáng để nổi
 * trên nền tối; ngược lại dùng màu primary trên nền muted.
 */
export function renderTextWithMentions(text: string, isOwn = false): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MENTION_RE.lastIndex = 0;
  while ((match = MENTION_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={lastIndex}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }
    parts.push(
      <span
        key={match.index}
        className={cn(
          "font-semibold",
          isOwn ? "text-amber-200" : "text-amber-600 dark:text-amber-400",
        )}
      >
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<Fragment key={lastIndex}>{text.slice(lastIndex)}</Fragment>);
  }

  return parts;
}
