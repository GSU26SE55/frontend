import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatOutbox } from "@/shared/hooks/ticket/useChatOutbox";
import {
  useChatOutboxWorker,
  type ChatSendFn,
} from "@/shared/hooks/ticket/useChatOutboxWorker";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/**
 * Combines outbox + worker + invalidation for a ticket — the page only needs one line.
 *
 * The feature injects `send` (its own addComment service) to avoid cross-feature imports.
 * Returns `pending` (passed down to TicketCommentThread to render optimistic bubbles) and
 * `retry`/`discard` (tapping the red "Retry" line / discarding a message). The worker is
 * always mounted here.
 */
export function useChatSender(ticketId: string, send: ChatSendFn) {
  const qc = useQueryClient();
  const { pending, enqueue, retry, discard } = useChatOutbox(ticketId);

  // Awaited by the outbox worker: it holds the optimistic bubble on screen until the refetched
  // thread contains the real message, so the two never both disappear for a moment.
  const onSent = useCallback(
    () => qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) }),
    [qc, ticketId],
  );

  useChatOutboxWorker({ ticketId, pending, send, onSent });

  return { pending, enqueue, retry, discard };
}
