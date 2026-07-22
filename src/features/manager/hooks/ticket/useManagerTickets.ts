import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { managerTicketService } from "@/features/manager/services/ticket/ticket.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  AdminTicketListParams,
  AdminTicketQueueParams,
  TriagePayload,
  TriageRejectPayload,
  AssignPayload,
  ReassignPayload,
  RejectPayload,
  EscalatePayload,
  AddCommentPayload,
} from "@/shared/types/ticket/ticket.types";
import { MANAGER_MESSAGES } from "@/features/manager/constants/messages";

export const useAdminTicketList = (params?: AdminTicketListParams) =>
  useQuery({
    queryKey: QUERY_KEY.manager.tickets.list(params),
    queryFn: () =>
      managerTicketService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useAdminTicketQueue = (params?: AdminTicketQueueParams) =>
  useQuery({
    queryKey: QUERY_KEY.manager.tickets.queue(params),
    queryFn: () =>
      managerTicketService.getQueue(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useManagerTicketDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.manager.tickets.detail(id),
    queryFn: () => managerTicketService.getDetail(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 30_000,
  });

export const useTicketActivities = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.manager.tickets.activities(id),
    queryFn: () =>
      managerTicketService.getActivities(id).then((r) => r.data.data),
    enabled: !!id,
  });

// GET /api/tickets/{ticketId}/maintenance-logs (Manager/Admin).
export const useTicketMaintenanceLogs = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.tickets.maintenanceLogs(id),
    queryFn: () =>
      managerTicketService
        .getMaintenanceLogs(id)
        .then((r) => r.data.data ?? []),
    enabled: !!id,
    staleTime: 30_000,
  });

// GET /api/tickets/{ticketId}/comments — query riêng để realtime invalidate.
// staleTime cao + KHÔNG refetchInterval: comment mới đến qua SignalR push (S4).
export const useTicketComments = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.tickets.chats(id),
    queryFn: () =>
      managerTicketService
        .getComments(id)
        .then((r) => r.data.data?.items ?? []),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useTriageTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TriagePayload) =>
      managerTicketService.triage(id, payload),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.triaged);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.queue() });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useTriageRejectTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TriageRejectPayload) =>
      managerTicketService.triageReject(id, payload),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.rejectedAtTriage);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.queue() });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useAssignTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignPayload) =>
      managerTicketService.assign(id, payload),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.staffAssigned);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useReassignTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReassignPayload) =>
      managerTicketService.reassign(id, payload),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.staffReassigned);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useApproveTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comment?: string) => managerTicketService.approve(id, comment),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.resultApproved);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useRejectTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectPayload) =>
      managerTicketService.reject(id, payload),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.resultRejected);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useEscalateTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EscalatePayload) =>
      managerTicketService.escalate(id, payload),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.escalated);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useDeclareIncident = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (incidentDescription: string) =>
      managerTicketService.declareIncident(id, incidentDescription),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.markedIncident);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

/** Manager gộp ticket nghi trùng (id) vào ticket đích. */
export const useMergeTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetTicketId: string) =>
      managerTicketService.merge(id, { targetTicketId }),
    onSuccess: () => {
      toast.success("Đã gộp ticket");
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.queue() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

/** Manager kích hoạt AI kiểm tra lại (ticket Skipped/Pending). */
export const useReVerifyTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => managerTicketService.reVerify(id),
    onSuccess: () => {
      toast.success("Đã yêu cầu AI kiểm tra lại — chờ vài giây rồi làm mới.");
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useAddComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: AddCommentPayload;
    }) => managerTicketService.addComment(ticketId, payload),
    onSuccess: (_, { ticketId }) => {
      // Không toast success — gửi qua chat outbox, trạng thái hiển thị dưới bubble.
      qc.invalidateQueries({
        queryKey: QUERY_KEY.manager.tickets.detail(ticketId),
      });
      // Comment panel dùng query riêng (tickets.chats) — invalidate để
      // tác giả thấy ngay comment của mình (không chờ realtime broadcast).
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chats(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
