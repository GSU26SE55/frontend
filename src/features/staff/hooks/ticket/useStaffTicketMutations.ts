import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import { staffTicketService } from "@/features/staff/services/ticket/ticket.service";
import type {
  HoldTicketRequest,
  ResumeTicketRequest,
  ResolveTicketRequest,
  EscalateTicketRequest,
  AddCommentRequest,
  AddMaintenanceLogRequest,
  UpdateMaintenanceLogRequest,
} from "@/features/staff/types/ticket/staff-ticket.types";
import { STAFF_MESSAGES } from "@/features/staff/constants/messages";

function useTicketMutation<TData>(
  mutationFn: (data: TData) => Promise<unknown>,
  ticketId: string,
  successMessage: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.detail(ticketId),
      });
      queryClient.invalidateQueries({ queryKey: [KEY.staffTickets, "list"] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useHoldTicket(ticketId: string) {
  return useTicketMutation(
    (data: HoldTicketRequest) => staffTicketService.hold(ticketId, data),
    ticketId,
    "Ticket put on hold",
  );
}

// GH-1176: restricted to PendingContext=Held tickets; unrestricted start removed.
export function useResumeTicket(ticketId: string) {
  return useTicketMutation(
    (data: ResumeTicketRequest) => staffTicketService.resume(ticketId, data),
    ticketId,
    "Work resumed on the ticket",
  );
}

// GH-1176: renamed from useResolveTicket (InProgress→Completed).
export function useCompleteTicket(ticketId: string) {
  return useTicketMutation(
    (data: ResolveTicketRequest) => staffTicketService.complete(ticketId, data),
    ticketId,
    "Ticket marked as completed",
  );
}

export function useEscalateTicket(ticketId: string) {
  return useTicketMutation(
    (data: EscalateTicketRequest) =>
      staffTicketService.escalateRequest(ticketId, data),
    ticketId,
    "Escalation request sent",
  );
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentRequest) =>
      staffTicketService.addComment(ticketId, data),
    onSuccess: () => {
      // No success toast — the message goes through the chat outbox and its status shows under the bubble.
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chats(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useAddMaintenanceLog(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMaintenanceLogRequest) =>
      staffTicketService.addMaintenanceLog(ticketId, data),
    onSuccess: () => {
      toast.success(STAFF_MESSAGES.ticket.maintenanceLogAdded);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.detail(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useUpdateMaintenanceLog(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      logId,
      data,
    }: {
      logId: string;
      data: UpdateMaintenanceLogRequest;
    }) => staffTicketService.updateMaintenanceLog(ticketId, logId, data),
    onSuccess: () => {
      toast.success(STAFF_MESSAGES.ticket.maintenanceLogUpdated);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.detail(ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.myMaintenanceLogs(),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
