import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ticketChatActionsService } from "@/shared/services/ticket-chat-actions.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  UpdateChatPayload,
  ChatMarkReadPayload,
} from "@/shared/types/chat.types";

// Edit/Delete/Mark-read cho ticket chat — dùng chung staff & manager.
// Invalidate tickets.chats song song với realtime (useTicketCommentsRealtime đã
// invalidate cùng key khi nhận ChatEdited/ChatDeleted) — tránh flash dữ liệu cũ
// cho chính người thao tác nếu round-trip SignalR chậm hơn response mutation.
export function useUpdateTicketChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      payload,
    }: {
      ticketId: string;
      chatId: string;
      payload: UpdateChatPayload;
    }) => ticketChatActionsService.update(ticketId, chatId, payload),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useDeleteTicketChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      reason,
    }: {
      ticketId: string;
      chatId: string;
      reason?: string;
    }) => ticketChatActionsService.remove(ticketId, chatId, reason),
    onSuccess: (_, { ticketId }) => {
      toast.success("Đã xóa bình luận");
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useMarkTicketChatsRead() {
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: ChatMarkReadPayload;
    }) => ticketChatActionsService.markRead(ticketId, payload),
    onError: (error) => handleErrorApi({ error }),
  });
}

// Không invalidate/cache theo query key — kết quả dịch được caller (TicketCommentThread)
// giữ cục bộ theo từng chatId để cho phép toggle gốc/dịch không cần gọi lại BE
// (BE cũng đã cache theo (chatId, targetLanguage) ở tầng DB).
export function useTranslateTicketChat() {
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      targetLanguage,
    }: {
      ticketId: string;
      chatId: string;
      targetLanguage: string;
    }) =>
      ticketChatActionsService
        .translate(ticketId, chatId, targetLanguage)
        .then((r) => r.data.data),
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useTranscribeVoiceChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      audioFile,
    }: {
      ticketId: string;
      audioFile: File;
    }) => ticketChatActionsService.transcribeVoice(ticketId, audioFile),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
