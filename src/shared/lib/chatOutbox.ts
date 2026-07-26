import type {
  OutboxMessage,
  OutboxStatus,
} from "@/shared/types/chat/chat.types";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";

/**
 * Chat outbox — hàng đợi tin nhắn chờ gửi, bền qua reload, per-ticket FIFO.
 *
 * Đây là store thuần (ngoài React): dùng chung 1 nguồn dữ liệu cho composer
 * (enqueue), worker (gửi tuần tự) và thread (render bubble "đang gửi"/"lỗi").
 * Kết nối vào React qua useSyncExternalStore ở useChatOutbox — vì vậy
 * getSnapshot PHẢI trả reference ổn định khi không đổi (cache theo ticketId).
 *
 * Lưu ở localStorage (không phải token) → không vi phạm rule "cookie only".
 */

const KEY_PREFIX = "chat-outbox:";
const SEQ_KEY = "chat-outbox:seq";

/** Tổng thời gian retry trước khi bỏ cuộc và đánh dấu "failed". */
export const OUTBOX_TOTAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 phút
/** Backoff: delay lần thử thứ n = min(2^n * BASE, MAX). */
export const OUTBOX_BACKOFF_BASE_MS = 1000;
export const OUTBOX_BACKOFF_MAX_MS = 30_000;

function storageKey(ticketId: string) {
  return `${KEY_PREFIX}${ticketId}`;
}

// Cache snapshot đã parse theo ticketId để getSnapshot trả reference ổn định.
const snapshotCache = new Map<string, OutboxMessage[]>();
const EMPTY: OutboxMessage[] = [];

const listeners = new Set<() => void>();

function readRaw(ticketId: string): OutboxMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(ticketId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as OutboxMessage[];
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeRaw(ticketId: string, messages: OutboxMessage[]) {
  try {
    if (messages.length === 0) {
      localStorage.removeItem(storageKey(ticketId));
    } else {
      localStorage.setItem(storageKey(ticketId), JSON.stringify(messages));
    }
  } catch {
    // localStorage đầy/không khả dụng — bỏ qua, giữ bản in-memory ở cache.
  }
  snapshotCache.set(ticketId, messages);
  emit();
}

function emit() {
  listeners.forEach((l) => l());
}

/** Đăng ký lắng nghe mọi thay đổi outbox (mọi ticket). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Snapshot ổn định của outbox cho 1 ticket (rebuild chỉ khi có mutation). */
export function getSnapshot(ticketId: string): OutboxMessage[] {
  const cached = snapshotCache.get(ticketId);
  if (cached) return cached;
  const fresh = readRaw(ticketId);
  snapshotCache.set(ticketId, fresh);
  return fresh;
}

function nextSeq(): number {
  try {
    const seq = Number(localStorage.getItem(SEQ_KEY) ?? "0") + 1;
    localStorage.setItem(SEQ_KEY, String(seq));
    return seq;
  } catch {
    return Date.now(); // fallback khi localStorage lỗi — chỉ cần duy nhất
  }
}

/** Thêm 1 tin vào cuối hàng đợi ticket, trả về message vừa tạo. */
export function enqueue(
  ticketId: string,
  payload: AddCommentPayload,
  now: number,
): OutboxMessage {
  const msg: OutboxMessage = {
    tempId: `temp-${ticketId}-${nextSeq()}`,
    ticketId,
    payload,
    status: "queued",
    attempt: 0,
    createdAt: now,
    deadline: now + OUTBOX_TOTAL_TIMEOUT_MS,
  };
  writeRaw(ticketId, [...getSnapshot(ticketId), msg]);
  return msg;
}

/** Cập nhật một phần trường của 1 tin theo tempId. */
export function patch(
  ticketId: string,
  tempId: string,
  partial: Partial<Pick<OutboxMessage, "status" | "attempt" | "deadline">>,
) {
  const next = getSnapshot(ticketId).map((m) =>
    m.tempId === tempId ? { ...m, ...partial } : m,
  );
  writeRaw(ticketId, next);
}

/** Xóa 1 tin khỏi hàng đợi (gửi thành công hoặc user bỏ). */
export function remove(ticketId: string, tempId: string) {
  const next = getSnapshot(ticketId).filter((m) => m.tempId !== tempId);
  writeRaw(ticketId, next);
}

/** Đưa 1 tin "failed" về "queued" và gia hạn deadline để worker gửi lại. */
export function requeue(ticketId: string, tempId: string, now: number) {
  const next = getSnapshot(ticketId).map((m) =>
    m.tempId === tempId
      ? {
          ...m,
          status: "queued" as OutboxStatus,
          attempt: 0,
          deadline: now + OUTBOX_TOTAL_TIMEOUT_MS,
        }
      : m,
  );
  writeRaw(ticketId, next);
}

/** Đồng bộ khi tab khác ghi localStorage — làm mới cache + báo listener. */
export function onStorageEvent(e: StorageEvent) {
  if (!e.key || !e.key.startsWith(KEY_PREFIX) || e.key === SEQ_KEY) return;
  const ticketId = e.key.slice(KEY_PREFIX.length);
  snapshotCache.delete(ticketId);
  getSnapshot(ticketId); // rebuild cache từ localStorage
  emit();
}

/** Tính delay backoff cho lần thử tiếp theo dựa trên số lần đã thử. */
export function backoffDelay(attempt: number): number {
  return Math.min(OUTBOX_BACKOFF_BASE_MS * 2 ** attempt, OUTBOX_BACKOFF_MAX_MS);
}
