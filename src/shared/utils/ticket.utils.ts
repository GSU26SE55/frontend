import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";

// GH-1176: terminal statuses in the canonical 8-status lifecycle.
const TERMINAL_STATUSES = new Set<string>([
  TicketStatusEnum.Completed,
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
]);

/** Ticket is still "open" — it has not reached the end of its lifecycle. */
export function isOpenTicket(t: TicketDTO): boolean {
  return !TERMINAL_STATUSES.has(t.status);
}

/**
 * Chat is locked once the ticket reaches a terminal status: the work is finished, so the
 * thread becomes read-only — no new messages, no editing or deleting existing ones.
 * Same status set as isOpenTicket, taken by status alone because the detail pages have the
 * status in hand before the full TicketDTO settles.
 */
export function isTicketChatLocked(
  status: TicketStatusEnum | undefined | null,
): boolean {
  return !!status && TERMINAL_STATUSES.has(status);
}

export const TICKET_CHAT_LOCKED_NOTICE =
  "This ticket is closed — the conversation is read-only. No new messages can be sent.";

/**
 * "8h 24m" / "45m" / "2h" — a maintenance log's recorded duration.
 *
 * Raw minutes make the reader divide by 60 to find out that "504 min" is more than eight
 * hours. Whole hours drop the minute part ("2h", not "2h 0m").
 */
export function formatLogDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
