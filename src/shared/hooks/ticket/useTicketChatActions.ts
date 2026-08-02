import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ticketChatActionsService } from "@/shared/services/ticket/ticket-chat-actions.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  UpdateChatPayload,
  ChatMarkReadPayload,
  ChatSuggestPayload,
} from "@/shared/types/chat/chat.types";
import { MESSAGES } from "@/shared/constants/messages";

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
      toast.success(MESSAGES.chat.commentDeleted);
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

/**
 * Số chat chưa đọc của chính user trong 1 ticket — badge tab "Bình luận".
 *
 * staleTime 0 + realtime: `useTicketCommentsRealtime` invalidate key này khi có
 * ChatAdded/Deleted nên badge tăng/giảm ngay, không cần polling.
 */
export function useTicketChatUnreadCount(ticketId: string) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
    queryFn: () =>
      ticketChatActionsService
        .getUnreadCount(ticketId)
        .then((r) => r.data.data ?? 0),
    enabled: !!ticketId,
    staleTime: 0,
  });
}

export function useMarkTicketChatsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: ChatMarkReadPayload;
    }) => ticketChatActionsService.markRead(ticketId, payload),
    // Đọc xong → badge phải tụt ngay, nếu không user mở tab mà số vẫn treo.
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
      });
    },
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

// Gửi tin nhắn thoại: upload audio lên FileStorage rồi POST metadata xuống /chats/voice
// (service lo cả 2 bước). BE tạo chat placeholder + transcribe async → invalidate để thấy
// bubble mới ngay (trạng thái Pending), transcript tự cập nhật sau qua realtime/refetch.
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

// Retry transcribe chat thoại đã Failed (BE trả 202, đưa status về Pending).
// Invalidate để badge/bubble phản ánh Pending ngay; transcript cập nhật sau.
export function useRetryVoiceChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, chatId }: { ticketId: string; chatId: string }) =>
      ticketChatActionsService.retryVoice(ticketId, chatId),
    onSuccess: (_, { ticketId }) => {
      toast.success(MESSAGES.chat.voiceRetryQueued);
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

// ── GH-133 Nhóm C — AI chats + download attachment ─────────────────────────
// C2 (AI). Trả nguyên CommonResponse để caller phân biệt isSuccess=false
// (Gemini 429 → BE trả isSuccess:false + message, HTTP vẫn 200) với suggestions thật.
export function useSuggestChat() {
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: ChatSuggestPayload;
    }) =>
      ticketChatActionsService.suggest(ticketId, payload).then((r) => r.data),
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useSummarizeChat() {
  return useMutation({
    mutationFn: ({ ticketId }: { ticketId: string }) =>
      ticketChatActionsService.summarize(ticketId).then((r) => r.data),
    onError: (error) => handleErrorApi({ error }),
  });
}

// C3 — download attachment: 200 (mở url) · 202 (đang scan) · 451 (nhiễm virus).
export function useDownloadChatAttachment() {
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      attachmentId,
    }: {
      ticketId: string;
      chatId: string;
      attachmentId: string;
    }) =>
      ticketChatActionsService.downloadAttachment(
        ticketId,
        chatId,
        attachmentId,
      ),
    onSuccess: (res) => {
      if (res.status === 202) {
        toast.info(MESSAGES.chat.fileScanning);
        return;
      }
      const url = res.data?.data;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 451) {
        toast.error(MESSAGES.chat.fileInfected);
        return;
      }
      handleErrorApi({ error });
    },
  });
}
