// #697 — đọc phân công Staff trên ticket (thay cho `ticket.assignedStaffId` cũ).
// BE đã lọc bản ghi soft-deleted nên không cần filter thêm ở FE.

import { TicketAssignmentRoleEnum } from "@/shared/enums/ticket/ticket.enum";
import type { TicketAssignmentDTO } from "@/shared/types/ticket/ticket.types";

/** Staff chịu trách nhiệm chính — null khi ticket chưa được gán. */
export function getPrimaryHandler(
  assignments: TicketAssignmentDTO[] | undefined | null,
): TicketAssignmentDTO | null {
  return (
    assignments?.find(
      (a) => a.role === TicketAssignmentRoleEnum.PrimaryHandler,
    ) ?? null
  );
}

/** Staff hỗ trợ (Collaborator trong chat) — không tính vào workload/KPI. */
export function getSupporters(
  assignments: TicketAssignmentDTO[] | undefined | null,
): TicketAssignmentDTO[] {
  return (
    assignments?.filter((a) => a.role === TicketAssignmentRoleEnum.Supporter) ??
    []
  );
}
