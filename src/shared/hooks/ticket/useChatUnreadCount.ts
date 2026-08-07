import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { chatInboxService } from "@/shared/services/ticket/chat-inbox.service";

/**
 * Tổng tin nhắn chưa đọc trên mọi ticket — dùng cho badge ở layout/dashboard.
 *
 * BE đếm theo bản ghi chat nên tin có @mention ĐÃ nằm trong số này. KHÔNG cộng thêm
 * danh sách mention vào, sẽ đếm 2 lần cùng một tin.
 */
export function useChatUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEY.myChats.unreadCount(),
    queryFn: async () => {
      const res = await chatInboxService.getMyUnreadCount();
      return res.data.data ?? 0;
    },
    refetchInterval: 60_000, // badge cần tươi nhưng không cần realtime
  });
}
