import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { staffTicketService } from "../services/ticket.service";
import type { StaffTicketsParams } from "../types/staff-ticket.types";

export function useStaffTickets(params: StaffTicketsParams) {
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.list(params),
    queryFn: () => staffTicketService.getMyTickets(params).then((r) => r.data),
    staleTime: 30_000,
    select: (data) => data.data,
  });
}
