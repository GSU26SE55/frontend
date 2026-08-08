import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminTicketService,
  type GetAdminTicketsParams,
} from "@/features/admin/services/ticket/ticket.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AddCommentPayload } from "@/shared/types/ticket/ticket.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

export function useAdminTickets(params?: GetAdminTicketsParams) {
  return useQuery({
    queryKey: QUERY_KEY.admin.tickets.list(params),
    queryFn: () => adminTicketService.getList(params),
    staleTime: 30_000,
    select: (res) => res.data,
  });
}

export function useAdminTicketDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.detail(id),
    queryFn: () => adminTicketService.getDetail(id),
    staleTime: 30_000,
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useAdminTicketActivities(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.activities(id),
    queryFn: () => adminTicketService.getActivities(id),
    select: (res) => res.data ?? [],
    enabled: !!id,
  });
}

// GET /api/tickets/{ticketId}/maintenance-logs (Manager/Admin).
export function useAdminTicketMaintenanceLogs(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.maintenanceLogs(id),
    queryFn: () => adminTicketService.getMaintenanceLogs(id),
    select: (res) => res.data ?? [],
    enabled: !!id,
    staleTime: 30_000,
  });
}

// GET /api/tickets/{ticketId}/chats — shares the endpoint with staff/manager.
export function useAdminTicketComments(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.tickets.chats(id),
    queryFn: () => adminTicketService.getComments(id),
    select: (res) => res.data?.items ?? [],
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useAdminAddComment(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCommentPayload) =>
      adminTicketService.addComment(ticketId, payload),
    onSuccess: () => {
      toast.success(ADMIN_MESSAGES.ticket.commentAdded);
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useDeclareIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      incidentDescription,
    }: {
      id: string;
      incidentDescription: string;
    }) => adminTicketService.declareIncident(id, incidentDescription),
    onSuccess: (_, { id }) => {
      toast.success(ADMIN_MESSAGES.ticket.markedIncident);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.detail(id) });
      queryClient.invalidateQueries({ queryKey: KEY.admin.tickets });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

/** Manager merges a suspected-duplicate ticket (id) into the target ticket (targetTicketId). */
export function useMergeTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      targetTicketId,
    }: {
      id: string;
      targetTicketId: string;
    }) => adminTicketService.merge(id, { targetTicketId }),
    onSuccess: (_, { id, targetTicketId }) => {
      toast.success("Ticket merged");
      // The merged ticket + target ticket + list/queue all change state.
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.detail(id) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.tickets.detail(targetTicketId),
      });
      queryClient.invalidateQueries({ queryKey: KEY.admin.tickets });
      queryClient.invalidateQueries({ queryKey: KEY.manager.tickets });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
