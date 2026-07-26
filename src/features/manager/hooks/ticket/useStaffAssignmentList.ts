import { useQuery } from "@tanstack/react-query";
import { managerSiteService } from "@/features/manager/services/site/site.service";
import { KEY } from "@/shared/utils/queryKeys";
import type { TicketPriorityEnum } from "@/shared/types/ticket/ticket.types";

/**
 * Danh sách Staff cho dialog gán.
 * - Truyền `ticketPriority` → BE lọc sẵn Staff đủ tier cho Primary Handler (GH-693).
 * - Không truyền → toàn bộ Staff (dùng cho Supporter, không check tier).
 */
export const useStaffAssignmentList = (ticketPriority?: TicketPriorityEnum) => {
  return useQuery({
    queryKey: [...KEY.manager.tickets, "staff-list", ticketPriority ?? "all"],
    queryFn: () => managerSiteService.getStaffList(ticketPriority),
    staleTime: 5 * 60_000,
  });
};
