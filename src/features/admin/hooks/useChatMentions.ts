import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatMentionService } from "@/features/admin/services/chat-mention.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { ChatMentionParams } from "@/shared/types/chat-mention.types";

export const useMyChatMentions = (params?: ChatMentionParams) =>
  useQuery({
    queryKey: QUERY_KEY.chatMentions.me(params),
    queryFn: () =>
      chatMentionService.getMy(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useAcknowledgeMention = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatMentionService.acknowledge(id),
    onSuccess: () => {
      toast.success("Đã đánh dấu đã đọc mention");
      qc.invalidateQueries({ queryKey: [KEY.chatMentions] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
