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
