import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { managerTicketService } from "@/features/manager/services/ticket.service";
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
} from "@/shared/types/ticket.types";

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
    queryKey: QUERY_KEY.tickets.comments(id),
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
      toast.success("Triage ticket thành công");
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
      toast.success("Đã từ chối ticket ở bước Triage");
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
      toast.success("Gán Staff thành công");
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
      toast.success("Điều chuyển Staff thành công");
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
      toast.success("Phê duyệt kết quả thành công");
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
      toast.success("Từ chối kết quả — ticket quay về In Progress");
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
      toast.success("Ticket đã được chuyển cấp");
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
      toast.success("Ticket đã được đánh dấu là Incident");
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
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
      toast.success("Đã thêm bình luận");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.manager.tickets.detail(ticketId),
      });
      // Comment panel dùng query riêng (tickets.comments) — invalidate để
      // tác giả thấy ngay comment của mình (không chờ realtime broadcast).
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.comments(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
