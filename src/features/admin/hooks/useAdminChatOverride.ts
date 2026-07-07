import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ticketChatService } from "@/features/admin/services/ticket-chat.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  ChatOverrideEditPayload,
  ChatOverrideDeletePayload,
} from "@/features/admin/schemas/chat-override.schema";

// GH-133 C4 — Admin sửa/xóa chat trên ticket đã Closed. Dùng trong form dialog:
// KHÔNG đặt onError ở đây — dialog tự try/catch + handleErrorApi({error, setError})
// (map EntityError xuống field, HttpError → toast). Đặt onError sẽ gây double-toast.
export function useOverrideEditChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      payload,
    }: {
      ticketId: string;
      chatId: string;
      payload: ChatOverrideEditPayload;
    }) => ticketChatService.overrideEdit(ticketId, chatId, payload),
    onSuccess: (_, { ticketId }) => {
      toast.success("Đã sửa bình luận (override)");
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
  });
}

export function useOverrideDeleteChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      payload,
    }: {
      ticketId: string;
      chatId: string;
      payload: ChatOverrideDeletePayload;
    }) => ticketChatService.overrideDelete(ticketId, chatId, payload),
    onSuccess: (_, { ticketId }) => {
      toast.success("Đã xóa bình luận (override)");
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
  });
}
