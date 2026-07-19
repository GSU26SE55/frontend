import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useSentimentCheck() {
  return useMutation({
    mutationFn: ({ ticketId }: { ticketId: string }) =>
      ticketChatActionsService.sentimentCheck(ticketId).then((r) => r.data),
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

// C2 — export PDF: nhận blob rồi trigger tải file.
export function useExportChatPdf() {
  return useMutation({
    mutationFn: ({ ticketId }: { ticketId: string }) =>
      ticketChatActionsService
        .exportPdf(ticketId)
        .then((r) => ({ blob: r.data, ticketId })),
    onSuccess: ({ blob, ticketId }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${ticketId}-chats.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
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
