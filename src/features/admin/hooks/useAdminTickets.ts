import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminTicketService,
  type GetAdminTicketsParams,
} from "../services/ticket.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";

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

export function useDeclareIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminTicketService.declareIncident(id),
    onSuccess: (_, id) => {
      toast.success("Đã đánh dấu là Incident");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.tickets.detail(id) });
      queryClient.invalidateQueries({ queryKey: KEY.admin.tickets });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
