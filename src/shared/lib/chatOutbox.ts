import type {
  OutboxMessage,
  OutboxStatus,
} from "@/shared/types/chat/chat.types";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";

/**
 * Chat outbox — queue of messages waiting to send, persisted across reloads, per-ticket FIFO.
 *
 * This is a plain store (outside React): it's the single data source shared by
 * the composer (enqueue), the worker (sends sequentially), and the thread
 * (renders the "sending"/"failed" bubble). Wired into React via
 * useSyncExternalStore in useChatOutbox — so getSnapshot MUST return a stable
 * reference when nothing changed (cached per ticketId).
 *
 * Stored in localStorage (not a token) → doesn't violate the "cookie only" rule.
 */

const KEY_PREFIX = "chat-outbox:";
const SEQ_KEY = "chat-outbox:seq";

/** Total retry time before giving up and marking as "failed". */
export const OUTBOX_TOTAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
/** Backoff: delay for the nth attempt = min(2^n * BASE, MAX). */
export const OUTBOX_BACKOFF_BASE_MS = 1000;
export const OUTBOX_BACKOFF_MAX_MS = 30_000;

function storageKey(ticketId: string) {
  return `${KEY_PREFIX}${ticketId}`;
}

// Cache the parsed snapshot per ticketId so getSnapshot returns a stable reference.
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
    // localStorage full/unavailable — ignore, keep the in-memory copy in the cache.
  }
  snapshotCache.set(ticketId, messages);
  emit();
}

function emit() {
  listeners.forEach((l) => l());
}

/** Subscribes to any outbox change (across all tickets). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable snapshot of the outbox for 1 ticket (rebuilt only on mutation). */
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
    return Date.now(); // fallback when localStorage errors — only needs to be unique
  }
}

/** Adds a message to the end of the ticket's queue, returns the newly created message. */
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

/** Partially updates a message's fields by tempId. */
export function patch(
  ticketId: string,
  tempId: string,
  partial: Partial<
    Pick<OutboxMessage, "status" | "attempt" | "deadline" | "failReason">
  >,
) {
  const next = getSnapshot(ticketId).map((m) =>
    m.tempId === tempId ? { ...m, ...partial } : m,
  );
  writeRaw(ticketId, next);
}

/** Removes a message from the queue (sent successfully or discarded by the user). */
export function remove(ticketId: string, tempId: string) {
  const next = getSnapshot(ticketId).filter((m) => m.tempId !== tempId);
  writeRaw(ticketId, next);
}

/** Moves a "failed" message back to "queued" and extends the deadline so the worker retries it. */
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

/** Syncs when another tab writes to localStorage — refreshes the cache + notifies listeners. */
export function onStorageEvent(e: StorageEvent) {
  if (!e.key || !e.key.startsWith(KEY_PREFIX) || e.key === SEQ_KEY) return;
  const ticketId = e.key.slice(KEY_PREFIX.length);
  snapshotCache.delete(ticketId);
  getSnapshot(ticketId); // rebuild the cache from localStorage
  emit();
}

/** Computes the backoff delay for the next attempt based on the number of attempts so far. */
export function backoffDelay(attempt: number): number {
  return Math.min(OUTBOX_BACKOFF_BASE_MS * 2 ** attempt, OUTBOX_BACKOFF_MAX_MS);
}
