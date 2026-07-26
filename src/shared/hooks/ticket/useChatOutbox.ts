import { useCallback, useEffect, useSyncExternalStore } from "react";
import * as outbox from "@/shared/lib/chatOutbox";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";

/**
 * Đọc + thao tác hàng đợi tin nhắn chờ gửi của 1 ticket.
 *
 * - `pending`: danh sách tin đang chờ (queued/sending/failed) — thread render
 *   thành bubble optimistic với dòng trạng thái ("Đang gửi…" / "Thử lại" đỏ).
 * - `enqueue`: composer gọi khi bấm gửi (không await BE).
 * - `retry`: bấm dòng "Thử lại" đỏ → gửi lại đúng tin đó.
 * - `discard`: bỏ hẳn 1 tin khỏi hàng đợi.
 *
 * Việc gọi BE do useChatOutboxWorker đảm nhiệm (tuần tự + backoff).
 */
export function useChatOutbox(ticketId: string) {
  // Đồng bộ với tab khác qua storage event — đăng ký 1 lần.
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
