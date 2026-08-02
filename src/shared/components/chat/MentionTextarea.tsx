import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { MentionInput } from "@/shared/schemas/ticket/ticket-comment.schema";

// Người có thể tag — build từ participant active của ticket (GET .../participants).
export interface MentionCandidate {
  userId: string;
  displayName: string;
  role?: string;
  /** Xem được chat nội bộ. false + đang soạn chat nội bộ → cảnh báo trong dropdown. */
  canViewInternal?: boolean;
}

// Regex bắt token @đang-gõ ngay trước con trỏ: "@" + ký tự tên (không xuống dòng, cho phép khoảng trắng đơn giữa từ).
// Ví dụ "... @Nguyen Va" → group(1) = "Nguyen Va".
const MENTION_TOKEN = /(?:^|\s)@([\p{L}\p{N}_ ]{0,30})$/u;

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

type TextareaProps = ComponentProps<typeof Textarea>;

interface Props extends Omit<TextareaProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  candidates: MentionCandidate[];
  /** Đang soạn chat nội bộ — bật cảnh báo với người không xem được internal. */
  isInternal?: boolean;
  /** Báo lên form danh sách người đã được tag (để gửi field `mentions`). */
  onMentionsChange?: (mentions: MentionInput[]) => void;
}

/**
 * Textarea có @-mention: gõ "@" → hiện dropdown lọc theo tên. Chọn 1 người →
 * chèn "@Tên " vào text và ghi nhận {userId, displayName} để gửi kèm BE.
 * BE nhận mention qua field `mentions` (KHÔNG parse "@" từ text), nên FE phải
 * gom danh sách người được chọn tách khỏi body.
 */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, Props>(
  function MentionTextarea(
    {
      value,
      onChange,
      candidates,
      isInternal = false,
      onMentionsChange,
      className,
      ...rest
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    // Người đã được tag trong tin đang soạn (dedup theo userId).
    const [picked, setPicked] = useState<MentionInput[]>([]);
    // Token "@..." đang gõ; null = không mở dropdown.
    const [query, setQuery] = useState<string | null>(null);
    const [highlight, setHighlight] = useState(0);

    const matches =
      query === null
        ? []
        : candidates
            .filter((c) =>
              c.displayName.toLowerCase().includes(query.toLowerCase()),
            )
            .slice(0, 6);

    const open = query !== null && matches.length > 0;

    const syncPicked = (next: MentionInput[]) => {
      setPicked(next);
      onMentionsChange?.(next);
    };

    const handleChange = (text: string) => {
      onChange(text);
      const caret = innerRef.current?.selectionStart ?? text.length;
      const before = text.slice(0, caret);
      const m = before.match(MENTION_TOKEN);
      setQuery(m ? m[1] : null);
      setHighlight(0);

      // Nếu 1 người đã tag bị xóa tên khỏi body thì bỏ khỏi danh sách gửi.
      if (picked.length > 0) {
        const stillThere = picked.filter((p) =>
          text.includes(`@${p.displayName}`),
        );
        if (stillThere.length !== picked.length) syncPicked(stillThere);
      }
    };

    const choose = (c: MentionCandidate) => {
      const el = innerRef.current;
      const caret = el?.selectionStart ?? value.length;
      const before = value.slice(0, caret);
      const after = value.slice(caret);
      // Thay token "@query" đang gõ bằng "@Tên " hoàn chỉnh.
      const replaced = before.replace(MENTION_TOKEN, (whole, _q, offset) => {
        const lead = whole.startsWith("@") ? "" : whole[0]; // giữ khoảng trắng dẫn nếu có
        void offset;
        return `${lead}@${c.displayName} `;
      });
      const next = replaced + after;
      onChange(next);
      setQuery(null);

      if (!picked.some((p) => p.userId === c.userId)) {
        syncPicked([
          ...picked,
          { userId: c.userId, displayName: c.displayName },
        ]);
      }

      requestAnimationFrame(() => {
        el?.focus();
        const pos = replaced.length;
        el?.setSelectionRange(pos, pos);
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        choose(matches[highlight]);
      } else if (e.key === "Escape") {
        setQuery(null);
      }
    };

    return (
      <div className="relative flex-1">
        {open && (
          <ul
            role="listbox"
            aria-label="Gợi ý người để tag"
            className="absolute bottom-full z-50 mb-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
          >
            {matches.map((c, i) => (
              <li key={c.userId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(c);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    i === highlight
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {initials(c.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{c.displayName}</span>
                  {/* BE không chặn mention người không xem được chat nội bộ —
                      cảnh báo để người soạn tự cân nhắc. */}
                  {isInternal && c.canViewInternal === false && (
                    <span
                      className="shrink-0 text-[10px] text-amber-600 dark:text-amber-400"
                      title="Người này không xem được chat nội bộ"
                    >
                      không xem được
                    </span>
                  )}
                  {c.role && (
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      {c.role}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Textarea
          ref={(el) => {
            innerRef.current = el;
          }}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={className}
          {...rest}
        />
      </div>
    );
  },
);
