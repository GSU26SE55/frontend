import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { managerTicketService } from "@/features/manager/services/ticket/ticket.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  AdminTicketListParams,
  AdminTicketQueueParams,
  TriageRejectPayload,
  AssignPayload,
  ReassignPayload,
  RejectPayload,
  EscalationDecisionPayload,
  AddCommentPayload,
  ReprioritizePayload,
} from "@/shared/types/ticket/ticket.types";
import { TicketStatusEnum } from "@/shared/types/ticket/ticket.types";
import { KEY } from "@/shared/utils/queryKeys";
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
    staleTime: 15_000,
    refetchInterval: 30_000,
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

// GET /api/tickets/{ticketId}/comments — a separate query so realtime can invalidate it.
// High staleTime + NO refetchInterval: new comments arrive via SignalR push (S4).
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

// GH-1176: useTriageTicket removed (triage approval removed).
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
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.queue() });
      // #697 — Primary → PrimaryAssignee, Supporter → Collaborator in chat.
      qc.invalidateQueries({ queryKey: QUERY_KEY.ticketParticipants.list(id) });
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
      // #697 — old Primary → PreviousAssignee + Supporter, new Primary → PrimaryAssignee.
      qc.invalidateQueries({ queryKey: QUERY_KEY.ticketParticipants.list(id) });
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ticketParticipants.history(id),
      });
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

// GH-1176: force escalation removed; Manager approves/rejects Staff escalation requests
// through the single BE decision endpoint (Approve bool distinguishes the two).
export const useEscalateApproveTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<EscalationDecisionPayload, "approve">) =>
      managerTicketService.escalationDecision(id, {
        ...payload,
        approve: true,
      }),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.escalated);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useEscalateRejectTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<EscalationDecisionPayload, "approve">) =>
      managerTicketService.escalationDecision(id, {
        ...payload,
        approve: false,
      }),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.ticket.escalationRejected);
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

/**
 * Change a ticket's priority (Manager). The BE recalculates the SLA — the FE only refetches.
 *
 * The BE has a side effect: if the new priority exceeds the tier of the Staff handling it, the
 * ticket is auto-escalated and the primary handler is demoted. Detect this via
 * `data.status === Escalated` (do NOT use `warnings` — the re-prioritize handler doesn't set that
 * field); when it happens, participants must be invalidated too because the assignee changed.
 */
export const useReprioritizeTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReprioritizePayload) =>
      managerTicketService.reprioritize(id, payload).then((r) => r.data),
    onSuccess: (res) => {
      // GH-1176: auto-escalation now moves to ReAssign, not legacy Escalated status.
      const autoEscalated = res.data?.status === TicketStatusEnum.ReAssign;
      toast.success(
        autoEscalated
          ? MANAGER_MESSAGES.ticket.reprioritizedWithEscalation
          : MANAGER_MESSAGES.ticket.reprioritized,
      );
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({
        queryKey: QUERY_KEY.manager.tickets.activities(id),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
      if (autoEscalated) {
        qc.invalidateQueries({ queryKey: [KEY.ticketParticipants] });
      }
    },
    // Do NOT call handleErrorApi here — this is a form mutation, so errors must go through
    // try-catch + setError in the dialog for EntityError to map down to the inputs. The hook only
    // handles refetching: a 409 means the ticket state changed elsewhere, so don't auto-retry.
    onError: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
    },
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

/** Manager merges the suspected-duplicate ticket (id) into the target ticket. */
export const useMergeTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetTicketId: string) =>
      managerTicketService.merge(id, { targetTicketId }),
    onSuccess: () => {
      toast.success("Ticket merged");
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.list() });
      qc.invalidateQueries({ queryKey: QUERY_KEY.manager.tickets.queue() });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

/** Manager triggers an AI re-check (Skipped/Pending tickets). */
export const useReVerifyTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => managerTicketService.reVerify(id),
    onSuccess: () => {
      toast.success(
        "AI re-check requested — wait a few seconds, then refresh.",
      );
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
      // No success toast — it's sent through the chat outbox, and the status shows under the bubble.
      qc.invalidateQueries({
        queryKey: QUERY_KEY.manager.tickets.detail(ticketId),
      });
      // The comment panel uses its own query (tickets.chats) — invalidate it so the
      // author sees their own comment right away (without waiting for the realtime broadcast).
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chats(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
