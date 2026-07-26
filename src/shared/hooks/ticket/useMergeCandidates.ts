import { useMemo } from "react";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";

// Ticket đã kết thúc → không cho gộp vào (chỉ gộp vào ticket còn xử lý được).
const CLOSED_STATUSES: TicketStatusEnum[] = [
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
  TicketStatusEnum.ClosedPendingRate,
  TicketStatusEnum.Resolved,
];

/**
 * Ứng viên ticket đích để gộp vào: mọi ticket khác ticket nguồn, còn xử lý được,
 * chưa bị gộp. Ticket AI nghi trùng được đưa lên đầu danh sách.
 */
export function useMergeCandidates(
  tickets: TicketDTO[] | undefined,
  sourceTicketId: string,
  suggestedTargetId?: string | null,
): TicketDTO[] {
  return useMemo(() => {
    const all = (tickets ?? []).filter(
      (t) =>
        t.id !== sourceTicketId &&
        !t.mergedIntoTicketId &&
        !CLOSED_STATUSES.includes(t.status),
    );
    return [...all].sort((a, b) => {
      if (a.id === suggestedTargetId) return -1;
      if (b.id === suggestedTargetId) return 1;
      return 0;
    });
  }, [tickets, sourceTicketId, suggestedTargetId]);
}
