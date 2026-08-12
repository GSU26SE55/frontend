import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ticketChatService } from "@/features/admin/services/ticket/ticket-chat.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  ChatOverrideEditPayload,
  ChatOverrideDeletePayload,
} from "@/features/admin/schemas/ticket/chat-override.schema";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

// GH-133 C4 — Admin edits/deletes chat on a Closed ticket. Used in a form dialog:
// do NOT put onError here — the dialog does its own try/catch + handleErrorApi({error, setError})
// (maps EntityError down to the field, HttpError → toast). Adding onError would double-toast.
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
      toast.success(ADMIN_MESSAGES.ticket.commentEdited);
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
      toast.success(ADMIN_MESSAGES.ticket.commentDeleted);
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
  });
}
