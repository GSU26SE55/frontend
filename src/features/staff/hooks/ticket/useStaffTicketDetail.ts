import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { staffTicketService } from "@/features/staff/services/ticket/ticket.service";

/**
 * GET /chats also AUTO-MARKS every message it returns as read on the BE, so this must only run
 * once the user has actually opened the Chat tab — `enabled` is not just an optimisation here.
 * Fetching it alongside the rest of the ticket detail marked a thread as read that nobody had
 * looked at, and the sender saw a false "seen".
 */
export function useStaffTicketComments(ticketId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.chats(ticketId),
    queryFn: () =>
      staffTicketService
        .getComments(ticketId)
        .then((r) => r.data.data?.items ?? []),
    enabled: !!ticketId && enabled,
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
