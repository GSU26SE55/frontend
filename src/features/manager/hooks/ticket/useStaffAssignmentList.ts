import { useQuery } from "@tanstack/react-query";
import { managerSiteService } from "@/features/manager/services/site/site.service";
import { KEY } from "@/shared/utils/queryKeys";
import type { TicketPriorityEnum } from "@/shared/types/ticket/ticket.types";

/**
 * Staff list for the assign dialog.
 * - Pass `ticketPriority` → the BE pre-filters Staff with a high enough tier for Primary Handler (GH-693).
 * - Omit it → all Staff (used for Supporters, no tier check).
 */
export const useStaffAssignmentList = (ticketPriority?: TicketPriorityEnum) => {
  return useQuery({
    queryKey: [...KEY.manager.tickets, "staff-list", ticketPriority ?? "all"],
    queryFn: () => managerSiteService.getStaffList(ticketPriority),
    staleTime: 5 * 60_000,
  });
};
