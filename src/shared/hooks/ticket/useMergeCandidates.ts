import { useMemo } from "react";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import {
  TicketStatusEnum,
  TicketOriginEnum,
} from "@/shared/enums/ticket/ticket.enum";

// Ticket đã kết thúc → không cho gộp vào (chỉ gộp vào ticket còn xử lý được).
const CLOSED_STATUSES: TicketStatusEnum[] = [
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
  TicketStatusEnum.ClosedPendingRate,
  TicketStatusEnum.Resolved,
];

/**
 * Ưu tiên khi cả nguồn lẫn đích cùng New: ticket do AI/hệ thống sinh làm ĐÍCH
 * (giữ lại), ticket Customer gửi làm NGUỒN (gộp đi) — ticket auto gắn sẵn dữ liệu
 * cảm biến/alert nên giữ nó mất ít ngữ cảnh hơn.
 */
const AUTO_ORIGINS: TicketOriginEnum[] = [
  TicketOriginEnum.AutoFromAlert,
  TicketOriginEnum.System,
];

/**
 * Ứng viên ticket ĐÍCH để gộp vào. Ticket nguồn luôn là ticket đang mở (đã gate
 * `status === New` ở trang chi tiết), nên ở đây chỉ lọc phía đích:
 *
 * - Khác ticket nguồn, chưa bị gộp, chưa kết thúc.
 * - KHÔNG nhận ticket New khác làm đích, TRỪ KHI nó do AI/hệ thống sinh: hai ticket
 *   cùng chưa triage thì không có cái nào "chính" để giữ lại, riêng ticket auto thì
 *   ưu tiên giữ theo quy tắc trên.
 *
 * Thứ tự: ticket AI nghi trùng lên đầu, rồi tới các ticket auto-origin.
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
      // Đích còn New chỉ hợp lệ khi là ticket auto — xem doc-comment trên.
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
