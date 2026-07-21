import { useEffect, useRef } from "react";
import { AxiosError } from "axios";
import * as outbox from "@/shared/lib/chatOutbox";
import type { OutboxMessage } from "@/shared/types/chat/chat.types";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";

/** Gọi BE thật — feature tự inject (manager/staff service) để không cross-feature. */
export type ChatSendFn = (
  ticketId: string,
  payload: AddCommentPayload,
) => Promise<unknown>;

interface Options {
  ticketId: string;
  pending: OutboxMessage[];
  send: ChatSendFn;
  /** Gọi sau khi 1 tin gửi thành công — dùng để invalidate query chats. */
  onSent: () => void;
}

// Lỗi 4xx (trừ 408/429) là do payload → không retry, fail luôn để user sửa/bỏ.
function isRetriable(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status === undefined) return true; // network/timeout → retry
    if (status === 408 || status === 429) return true;
    return status >= 500;
  }
  return true;
}

/**
 * Worker gửi outbox tuần tự cho 1 ticket (mount 1 lần ở TicketDetailPage).
 *
 * Mỗi lượt chỉ xử lý tin đầu hàng còn "queued" (FIFO — giữ đúng thứ tự gõ):
 *   - quá deadline → "failed" (dừng, chờ user bấm thử lại)
 *   - lỗi retriable → tăng attempt, hẹn lại theo backoff (2s→4s→…→30s)
 *   - lỗi client → "failed" ngay
 *   - thành công → xóa khỏi outbox + onSent()
 *
 * `pending` đổi (do enqueue/retry/patch) sẽ chạy lại effect → kích lượt kế.
 */
export function useChatOutboxWorker({
  ticketId,
  pending,
  send,
  onSent,
}: Options) {
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Giữ ref mới nhất để timeout callback không dùng closure cũ.
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
        return; // effect chạy lại → xử lý tin kế
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
          outbox.patch(ticketId, next.tempId, { status: "failed", attempt });
        } else {
          // Trả về "queued" và hẹn thử lại sau backoff.
          outbox.patch(ticketId, next.tempId, { status: "queued", attempt });
          clearTimer();
          timerRef.current = setTimeout(() => {
            busyRef.current = false;
            void tick();
          }, outbox.backoffDelay(attempt));
          return; // giữ busy tới khi timer chạy lại
        }
      } finally {
        // Với nhánh thành công/failed/deadline: giải phóng để xử lý tin kế.
        if (!timerRef.current) busyRef.current = false;
      }
      void tick();
    };

    void tick();
    return clearTimer;
    // pending là dependency: mọi enqueue/retry/patch đều re-trigger vòng gửi.
  }, [ticketId, pending]);
}
