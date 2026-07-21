import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatOutbox } from "@/shared/hooks/ticket/useChatOutbox";
import {
  useChatOutboxWorker,
  type ChatSendFn,
} from "@/shared/hooks/ticket/useChatOutboxWorker";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/**
 * Gộp outbox + worker + invalidate cho 1 ticket — page chỉ cần gọi 1 dòng.
 *
 * Feature inject `send` (service addComment của mình) để không cross-feature.
 * Trả `pending` (truyền xuống TicketCommentThread render bubble optimistic) và
 * `retry`/`discard` (bấm dòng "Thử lại" đỏ / bỏ tin). Mount worker luôn ở đây.
 */
export function useChatSender(ticketId: string, send: ChatSendFn) {
  const qc = useQueryClient();
  const { pending, enqueue, retry, discard } = useChatOutbox(ticketId);

  const onSent = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
  }, [qc, ticketId]);

  useChatOutboxWorker({ ticketId, pending, send, onSent });

  return { pending, enqueue, retry, discard };
}
