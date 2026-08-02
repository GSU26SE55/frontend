import { useQuery } from "@tanstack/react-query";
import { chatMentionService } from "@/shared/services/ticket/chat-mention.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { MyMentionsParams } from "@/shared/types/chat/mention.types";

// GET /api/chats/mentions/me — danh sách mention của user hiện tại (mọi ticket).
export const useMyMentions = (params?: MyMentionsParams) =>
  useQuery({
    queryKey: QUERY_KEY.chatMentions.me(params),
    queryFn: () =>
      chatMentionService.getMyMentions(params).then((r) => r.data.data),
    staleTime: 60_000,
  });
