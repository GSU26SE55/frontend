import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";

const TERMINAL_STATUSES = new Set<string>([
  TicketStatusEnum.Resolved,
  TicketStatusEnum.ClosedPendingRate,
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
]);

/** Ticket is still "open" — it has not reached the end of its lifecycle. */
export function isOpenTicket(t: TicketDTO): boolean {
  return !TERMINAL_STATUSES.has(t.status);
}
