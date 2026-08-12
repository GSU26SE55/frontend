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
