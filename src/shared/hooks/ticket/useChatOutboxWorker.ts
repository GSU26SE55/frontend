import { useEffect, useRef } from "react";
import { AxiosError } from "axios";
import * as outbox from "@/shared/lib/chatOutbox";
import type { OutboxMessage } from "@/shared/types/chat/chat.types";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";

/** Calls the real BE — injected by the feature (manager/staff service) to avoid cross-feature imports. */
export type ChatSendFn = (
  ticketId: string,
  payload: AddCommentPayload,
) => Promise<unknown>;

interface Options {
  ticketId: string;
  pending: OutboxMessage[];
  send: ChatSendFn;
  /** Called after a message sends successfully — used to invalidate the chats query. */
  onSent: () => void;
}

// GH-866 — BE returns the error code inside `message` (ChatAddCommandHandler.Fail), there's no
// separate errorCode field.
const CHAT_SPAM_CHECK_IN_PROGRESS = "CHAT_SPAM_CHECK_IN_PROGRESS";
const CHAT_DUPLICATE_MESSAGE_LIMIT = "CHAT_DUPLICATE_MESSAGE_LIMIT";

// BE error code → display text. These codes make retry pointless, so state the reason plainly.
function failReasonOf(error: unknown): string | undefined {
  if (!(error instanceof AxiosError)) return undefined;
  if (error.response?.data?.message === CHAT_DUPLICATE_MESSAGE_LIMIT) {
    return "You've sent this message too many times";
  }
  return undefined;
}

// 4xx errors (except 408/429) are caused by the payload → don't retry, fail immediately so the user can fix/discard.
function isRetriable(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status === undefined) return true; // network/timeout → retry
    if (status === 408 || status === 429) return true;
    // 409 CHAT_SPAM_CHECK_IN_PROGRESS: the user's spam check is running concurrently —
    // a temporary state, back off then resend. Other 409s still fail immediately.
    if (
      status === 409 &&
      error.response?.data?.message === CHAT_SPAM_CHECK_IN_PROGRESS
    ) {
      return true;
    }
    return status >= 500;
  }
  return true;
}

/**
 * Worker that sends the outbox sequentially for a ticket (mounted once in TicketDetailPage).
 *
 * Each pass only processes the first message still "queued" (FIFO — preserves typing order):
 *   - past deadline → "failed" (stops, waits for the user to hit retry)
 *   - retriable error → increments attempt, reschedules with backoff (2s→4s→…→30s)
 *   - client error → "failed" immediately
 *   - success → removed from the outbox + onSent()
 *
 * When `pending` changes (via enqueue/retry/patch), the effect reruns → triggers the next pass.
 */
export function useChatOutboxWorker({
  ticketId,
  pending,
  send,
  onSent,
}: Options) {
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keeps the latest ref so the timeout callback doesn't use a stale closure.
  const sendRef = useRef(send);
  const onSentRef = useRef(onSent);
  useEffect(() => {
    sendRef.current = send;
    onSentRef.current = onSent;
  });

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const tick = async () => {
      if (busyRef.current) return;
      const snapshot = outbox.getSnapshot(ticketId);
      const next = snapshot.find((m) => m.status === "queued");
      if (!next) return;

      if (Date.now() > next.deadline) {
        outbox.patch(ticketId, next.tempId, { status: "failed" });
        return; // effect reruns → processes the next message
      }

      busyRef.current = true;
      outbox.patch(ticketId, next.tempId, { status: "sending" });
      try {
        await sendRef.current(next.ticketId, next.payload);
        outbox.remove(ticketId, next.tempId);
        onSentRef.current();
      } catch (error) {
        const attempt = next.attempt + 1;
        if (!isRetriable(error) || Date.now() > next.deadline) {
          outbox.patch(ticketId, next.tempId, {
            status: "failed",
            attempt,
            failReason: failReasonOf(error),
          });
        } else {
          // Revert to "queued" and schedule a retry after the backoff.
          outbox.patch(ticketId, next.tempId, { status: "queued", attempt });
          clearTimer();
          timerRef.current = setTimeout(() => {
            busyRef.current = false;
            void tick();
          }, outbox.backoffDelay(attempt));
          return; // stay busy until the timer fires again
        }
      } finally {
        // For the success/failed/deadline branches: release so the next message can be processed.
        if (!timerRef.current) busyRef.current = false;
      }
      void tick();
    };

    void tick();
    return clearTimer;
    // pending is a dependency: every enqueue/retry/patch re-triggers the send loop.
  }, [ticketId, pending]);
}
