import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { chatInboxService } from "@/shared/services/ticket/chat-inbox.service";

/**
 * Total unread messages across all tickets — used for the badge in the layout/dashboard.
 *
 * BE counts by chat record, so messages with an @mention are ALREADY included in this count.
 * Do NOT add the mentions list on top — that would double-count the same message.
 */
export function useChatUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEY.myChats.unreadCount(),
    queryFn: async () => {
      const res = await chatInboxService.getMyUnreadCount();
      return res.data.data ?? 0;
    },
    refetchInterval: 60_000, // badge needs to stay fresh but doesn't need to be realtime
  });
}
