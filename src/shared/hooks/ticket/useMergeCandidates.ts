import { useMemo } from "react";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import {
  TicketStatusEnum,
  TicketOriginEnum,
} from "@/shared/enums/ticket/ticket.enum";

// Ticket already closed out → can't merge into it (only merge into a ticket still being worked).
const CLOSED_STATUSES: TicketStatusEnum[] = [
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
  TicketStatusEnum.ClosedPendingRate,
  TicketStatusEnum.Resolved,
];

/**
 * Preference when both source and target are New: the AI/system-generated ticket becomes
 * the TARGET (kept), the Customer-submitted ticket becomes the SOURCE (merged away) — the
 * auto ticket already carries sensor/alert data, so keeping it loses less context.
 */
const AUTO_ORIGINS: TicketOriginEnum[] = [
  TicketOriginEnum.AutoFromAlert,
  TicketOriginEnum.System,
];

/**
 * Candidate TARGET tickets to merge into. The source ticket is always the one currently open
 * (already gated to `status === New` on the detail page), so this only filters the target side:
 *
 * - Different from the source ticket, not already merged, not closed out.
 * - Does NOT accept another New ticket as target, UNLESS it's AI/system-generated: two tickets
 *   that are both untriaged have no "primary" one to keep, whereas an auto ticket is preferred
 *   per the rule above.
 *
 * Order: the ticket AI flagged as a likely duplicate first, then the other auto-origin tickets.
 */
export function useMergeCandidates(
  tickets: TicketDTO[] | undefined,
  sourceTicketId: string,
  suggestedTargetId?: string | null,
): TicketDTO[] {
  return useMemo(() => {
    const all = (tickets ?? []).filter((t) => {
      if (t.id === sourceTicketId) return false;
      if (t.mergedIntoTicketId) return false;
      if (CLOSED_STATUSES.includes(t.status)) return false;
      // A target still in New is only valid when it's an auto ticket — see the doc comment above.
      if (t.status === TicketStatusEnum.New) {
        return AUTO_ORIGINS.includes(t.origin);
      }
      return true;
    });
    return [...all].sort((a, b) => {
      if (a.id === suggestedTargetId) return -1;
      if (b.id === suggestedTargetId) return 1;
      const aAuto = AUTO_ORIGINS.includes(a.origin) ? 0 : 1;
      const bAuto = AUTO_ORIGINS.includes(b.origin) ? 0 : 1;
      return aAuto - bAuto;
    });
  }, [tickets, sourceTicketId, suggestedTargetId]);
}
