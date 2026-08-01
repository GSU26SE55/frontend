import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatMentionService } from "@/shared/services/ticket/chat-mention.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import type { MyMentionsParams } from "@/shared/types/chat/mention.types";

// GET /api/chats/mentions/me — danh sách mention của user hiện tại (mọi ticket).
export const useMyMentions = (params?: MyMentionsParams) =>
  useQuery({
    queryKey: QUERY_KEY.chatMentions.me(params),
    queryFn: () =>
      chatMentionService.getMyMentions(params).then((r) => r.data.data),
    staleTime: 60_000,
  });

// PATCH /api/chats/mentions/{id}/acknowledge — đánh dấu đã đọc 1 mention.
export const useAcknowledgeMention = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatMentionService.acknowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.chatMentions] });
    },
  });
};
