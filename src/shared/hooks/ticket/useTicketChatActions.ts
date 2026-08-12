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

// Edit/Delete/Mark-read for ticket chat — shared by staff & manager.
// Invalidates tickets.chats in parallel with realtime (useTicketCommentsRealtime already
// invalidates the same key on receiving ChatEdited/ChatDeleted) — avoids flashing stale data
// to the acting user themselves if the SignalR round-trip is slower than the mutation response.
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
 * Number of unread chats for the current user on a ticket — badge on the "Comments" tab.
 *
 * staleTime 0 + realtime: `useTicketCommentsRealtime` invalidates this key on
 * ChatAdded/Deleted, so the badge updates immediately without polling.
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
    // Once read → the badge must drop immediately, otherwise the user opens the tab but the count still shows stale.
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

// Not invalidated/cached by query key — the caller (TicketCommentThread) holds the translation
// result locally per chatId, letting the original/translated toggle skip a BE call
// (BE also caches by (chatId, targetLanguage) at the DB layer).
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

// Sends a voice message: uploads audio to FileStorage then POSTs metadata to /chats/voice
// (the service handles both steps). BE creates a chat placeholder + transcribes async → invalidate
// to show the new bubble right away (Pending state), the transcript updates later via realtime/refetch.
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

// Retries transcribing a voice chat that Failed (BE returns 202, sets status back to Pending).
// Invalidates so the badge/bubble reflects Pending right away; the transcript updates later.
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

// ── GH-133 Group C — AI chats + download attachment ────────────────────────
// C2 (AI). Returns the raw CommonResponse so the caller can distinguish isSuccess=false
// (Gemini 429 → BE returns isSuccess:false + message, HTTP still 200) from real suggestions.
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

// C3 — download attachment: 200 (opens the url) · 202 (still scanning) · 451 (infected).
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
