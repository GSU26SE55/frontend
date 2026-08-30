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
 * Statuses where sending a message is blocked. MUST match ChatClosedStateHelper on the BE,
 * which rejects the request outright; this list only decides whether the composer is shown.
 *
 * Open: the ticket has not been triaged, so nobody is assigned yet — a message sent then has
 * no specific recipient, raises no notification for the right person and quietly goes
 * unanswered. Closed/ClosedRejected: finished, the thread is history.
 *
 * Pending stays open on purpose: the ticket is already assigned with a schedule, and both
 * sides need to talk before the visit.
 */
const CHAT_DISABLED_STATUSES = new Set<string>([
  TicketStatusEnum.Open,
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
]);

/**
 * Chat is read-only before the ticket is assigned and after it closes — no new messages, no
 * editing or deleting existing ones. Taken by status alone because the detail pages have the
 * status in hand before the full TicketDTO settles.
 */
export function isTicketChatLocked(
  status: TicketStatusEnum | undefined | null,
): boolean {
  // Unknown status = not locked. The detail pages call this before the ticket has loaded, and
  // locking on the way in would flip the composer from disabled to enabled on every visit.
  if (!status) return false;
  return CHAT_DISABLED_STATUSES.has(status);
}

/** Why the composer is hidden — "not yet" and "no longer" read very differently to the user. */
export function ticketChatLockedNotice(
  status: TicketStatusEnum | undefined | null,
): string {
  return status === TicketStatusEnum.Open
    ? "Chat opens once the ticket has been assigned."
    : TICKET_CHAT_LOCKED_NOTICE;
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
