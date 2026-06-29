import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { staffTicketService } from "../services/ticket.service";

export function useStaffTicketComments(ticketId: string) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.chats(ticketId),
    queryFn: () =>
      staffTicketService
        .getComments(ticketId)
        .then((r) => r.data.data?.items ?? []),
    enabled: !!ticketId,
    staleTime: 60_000,
  });
}

export function useStaffTicketDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.staffTickets.detail(id),
    queryFn: () => staffTicketService.getDetail(id).then((r) => r.data),
    staleTime: 30_000,
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useStaffTicketActivities(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.activities(id),
    queryFn: () => staffTicketService.getActivities(id).then((r) => r.data),
    staleTime: 30_000,
    select: (data) => data.data ?? [],
    enabled: !!id,
  });
}
