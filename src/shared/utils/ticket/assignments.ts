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

/**
 * Tên hiển thị của 1 dòng phân công.
 * BE trả sẵn `staffName` (từ StaffAccount đã sync) nên mọi role dùng được —
 * không cần gọi `/api/staff` vốn chỉ mở cho Admin/Manager. Chưa sync kịp thì
 * fallback về staffId để ít nhất còn định danh được.
 */
export function assignmentDisplayName(a: TicketAssignmentDTO): string {
  return a.staffName?.trim() || a.staffId;
}

/** Tên Primary Handler — null khi ticket chưa được gán. */
export function getPrimaryHandlerName(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string | null {
  const primary = getPrimaryHandler(assignments);
  return primary ? assignmentDisplayName(primary) : null;
}

/** Tên các Staff hỗ trợ — mảng rỗng khi không có ai. */
export function getSupporterNames(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string[] {
  return getSupporters(assignments).map(assignmentDisplayName);
}
