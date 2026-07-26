import { useTicketChatUnreadCount } from "@/shared/hooks/ticket/useTicketChatActions";

interface Props {
  ticketId: string;
}

/**
 * Badge đỏ số chat chưa đọc trên tab "Bình luận" (kiểu Messenger).
 * Ẩn khi = 0, và ẩn cả khi chính tab đó đang mở.
 *
 * Vì sao ẩn lúc tab active: tin mới về qua SignalR sẽ invalidate unread count
 * TRƯỚC khi `TicketCommentThread` kịp mark-read, nên badge nháy lên 1 rồi tụt —
 * user đang đọc ngay tin đó mà vẫn thấy "chưa đọc". `group-data-[state=active]`
 * đọc trực tiếp state của TabsTrigger cha (Radix) nên không cần plumb state
 * active từ từng trang xuống.
 */
export default function ChatUnreadBadge({ ticketId }: Props) {
  const { data: unreadCount = 0 } = useTicketChatUnreadCount(ticketId);

  if (unreadCount <= 0) return null;

  return (
    <span
      aria-label={`${unreadCount} bình luận chưa đọc`}
      // min-w = h để 1 chữ số ra hình tròn, số dài hơn tự giãn thành viên thuốc.
      // tabular-nums giữ bề rộng ổn định khi số nhảy, tránh tab bị giật.
      className="ml-1.5 h-[15px] min-w-[15px] px-1 inline-flex items-center justify-center rounded-full text-white text-[10px] font-semibold leading-none tabular-nums group-data-[state=active]:hidden"
      style={{ backgroundColor: "var(--p1)" }}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
