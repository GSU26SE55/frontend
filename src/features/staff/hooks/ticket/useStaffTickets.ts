import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { staffTicketService } from "@/features/staff/services/ticket/ticket.service";
import type { StaffTicketsParams } from "@/features/staff/types/ticket/staff-ticket.types";

export function useStaffTickets(params: StaffTicketsParams) {
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.list(params),
    queryFn: () => staffTicketService.getMyTickets(params).then((r) => r.data),
    staleTime: 30_000,
    select: (data) => data.data,
  });
}
