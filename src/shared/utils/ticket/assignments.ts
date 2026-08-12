// #697 — read the staff assignments on a ticket (replaces the old `ticket.assignedStaffId`).
// The BE already filters out soft-deleted records, so the FE does not filter again.

import { TicketAssignmentRoleEnum } from "@/shared/enums/ticket/ticket.enum";
import type { TicketAssignmentDTO } from "@/shared/types/ticket/ticket.types";

/** The staff member in charge — null when the ticket has not been assigned yet. */
export function getPrimaryHandler(
  assignments: TicketAssignmentDTO[] | undefined | null,
): TicketAssignmentDTO | null {
  return (
    assignments?.find(
      (a) => a.role === TicketAssignmentRoleEnum.PrimaryHandler,
    ) ?? null
  );
}

/** Supporting staff (collaborators in the chat) — not counted toward workload/KPIs. */
export function getSupporters(
  assignments: TicketAssignmentDTO[] | undefined | null,
): TicketAssignmentDTO[] {
  return (
    assignments?.filter((a) => a.role === TicketAssignmentRoleEnum.Supporter) ??
    []
  );
}

/**
 * Display name for one assignment row.
 * The BE already returns `staffName` (from the synced StaffAccount), so every role can use
 * it — no need to call `/api/staff`, which is open to Admin/Manager only. When the sync has
 * not caught up, it falls back to staffId so the row is at least identifiable.
 */
export function assignmentDisplayName(a: TicketAssignmentDTO): string {
  return a.staffName?.trim() || a.staffId;
}

/** Primary handler's name — null when the ticket has not been assigned yet. */
export function getPrimaryHandlerName(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string | null {
  const primary = getPrimaryHandler(assignments);
  return primary ? assignmentDisplayName(primary) : null;
}

/** Names of the supporting staff — an empty array when there are none. */
export function getSupporterNames(
  assignments: TicketAssignmentDTO[] | undefined | null,
): string[] {
  return getSupporters(assignments).map(assignmentDisplayName);
}
