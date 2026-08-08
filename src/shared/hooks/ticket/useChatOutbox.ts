import { useCallback, useEffect, useSyncExternalStore } from "react";
import * as outbox from "@/shared/lib/chatOutbox";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";

/**
 * Reads + operates on the pending message queue for a ticket's outbox.
 *
 * - `pending`: list of messages waiting (queued/sending/failed) — the thread renders these
 *   as optimistic bubbles with a status line ("Sending…" / red "Retry").
 * - `enqueue`: called by the composer on send (doesn't await BE).
 * - `retry`: tapping the red "Retry" line → resends that exact message.
 * - `discard`: drops a message from the queue entirely.
 *
 * The actual BE call is handled by useChatOutboxWorker (sequential + backoff).
 */
export function useChatOutbox(ticketId: string) {
  // Syncs with other tabs via the storage event — registered once.
  useEffect(() => {
    window.addEventListener("storage", outbox.onStorageEvent);
    return () => window.removeEventListener("storage", outbox.onStorageEvent);
  }, []);

  const pending = useSyncExternalStore(
    outbox.subscribe,
    () => outbox.getSnapshot(ticketId),
    () => outbox.getSnapshot(ticketId),
  );

  const enqueue = useCallback(
    (payload: AddCommentPayload) =>
      outbox.enqueue(ticketId, payload, Date.now()),
    [ticketId],
  );

  const retry = useCallback(
    (tempId: string) => outbox.requeue(ticketId, tempId, Date.now()),
    [ticketId],
  );

  const discard = useCallback(
    (tempId: string) => outbox.remove(ticketId, tempId),
    [ticketId],
  );

  return { pending, enqueue, retry, discard };
}
