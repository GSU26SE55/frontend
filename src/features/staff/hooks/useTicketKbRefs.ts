import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ticketKbService,
  type AddTicketKbRefInput,
} from "../services/ticket-kb.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";

export function useTicketKbRefs(ticketId: string) {
  return useQuery({
    queryKey: QUERY_KEY.ticketKbRefs.list(ticketId),
    queryFn: () =>
      ticketKbService.list(ticketId).then((r) => r.data.data ?? []),
    enabled: !!ticketId,
  });
}

export function useAddTicketKbRef(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddTicketKbRefInput) =>
      ticketKbService.add(ticketId, payload),
    onSuccess: () => {
      toast.success("Đã gắn bài viết KB");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ticketKbRefs.list(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useRemoveTicketKbRef(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (refId: string) => ticketKbService.remove(ticketId, refId),
    onSuccess: () => {
      toast.success("Đã gỡ bài viết KB");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ticketKbRefs.list(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
