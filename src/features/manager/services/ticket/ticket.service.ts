import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  TicketDTO,
  TicketDetailDTO,
  TicketActivityDTO,
  TicketActionResponse,
  TicketCommentDTO,
  MaintenanceLogDTO,
  AdminTicketListParams,
  AdminTicketQueueParams,
  TriageRejectPayload,
  AssignPayload,
  ReassignPayload,
  RejectPayload,
  EscalationDecisionPayload,
  AddCommentPayload,
  MergeTicketPayload,
  ReprioritizePayload,
} from "@/shared/types/ticket/ticket.types";

function toListParams(params?: AdminTicketListParams) {
  if (!params) return undefined;
  return {
    Keyword: params.keyword,
    Status: params.status,
    Priority: params.priority,
    Category: params.category,
    BatteryAssetId: params.batteryAssetId,
    IsDescending: params.isDescending,
    PageNumber: params.pageNumber,
    PageSize: params.pageSize,
    SortBy: params.sortBy,
    SortDir: params.sortDir,
  };
}

function toQueueParams(params?: AdminTicketQueueParams) {
  if (!params) return undefined;
  return {
    Priority: params.priority,
    Category: params.category,
    PageNumber: params.pageNumber ?? 1,
    PageSize: params.pageSize ?? 25,
  };
}

export const managerTicketService = {
  getList: (params?: AdminTicketListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketDTO>>>(
      ENDPOINTS.ADMIN.TICKETS.LIST,
      { params: toListParams(params) },
    ),

  getQueue: (params?: AdminTicketQueueParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketDTO>>>(
      ENDPOINTS.ADMIN.TICKETS.QUEUE,
      { params: toQueueParams(params) },
    ),

  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<TicketDetailDTO>>(
      ENDPOINTS.TICKETS.DETAIL(id),
    ),

  getActivities: (id: string) =>
    axiosInstance.get<CommonResponse<TicketActivityDTO[]>>(
      ENDPOINTS.TICKETS.ACTIVITIES(id),
    ),

  getMaintenanceLogs: (ticketId: string) =>
    axiosInstance.get<CommonResponse<MaintenanceLogDTO[]>>(
      ENDPOINTS.TICKETS.MAINTENANCE_LOGS(ticketId),
    ),

  getComments: (ticketId: string) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketCommentDTO>>>(
      ENDPOINTS.TICKETS.CHATS(ticketId),
      { params: { page: 1, pageSize: 50 } },
    ),

  // GH-1176: triage (approval) removed; triageReject remains (Open→ClosedRejected).
  triageReject: (id: string, payload: TriageRejectPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.TRIAGE_REJECT(id),
      payload,
    ),

  assign: (id: string, payload: AssignPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.ASSIGN(id),
      {
        ...payload,
        scheduledStartAt: payload.scheduledStartAtUtc,
      },
    ),

  reassign: (id: string, payload: ReassignPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.REASSIGN(id),
      {
        ...payload,
        scheduledStartAt: payload.scheduledStartAtUtc,
      },
    ),

  approve: (id: string, comment?: string) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.APPROVE(id),
      null,
      { params: comment ? { comment } : undefined },
    ),

  reject: (id: string, payload: RejectPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.REJECT(id),
      payload,
    ),

  // GH-1176: force escalation removed; Manager approves/rejects Staff escalation requests
  // through the single BE decision endpoint (Approve bool distinguishes the two).
  escalationDecision: (id: string, payload: EscalationDecisionPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.ESCALATION_DECISION(id),
      payload,
    ),

  declareIncident: (id: string, incidentDescription: string) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.DECLARE_INCIDENT(id),
      { incidentDescription },
    ),

  addComment: (ticketId: string, payload: AddCommentPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.TICKETS.CHATS(ticketId),
      payload,
    ),

  // Merge the suspected-duplicate ticket (id) into the target ticket (targetTicketId).
  merge: (id: string, payload: MergeTicketPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.MERGE(id),
      payload,
    ),

  // Trigger an AI re-check (Skipped/Pending tickets).
  reVerify: (id: string) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.RE_VERIFY(id),
    ),

  // Change priority + reason. The BE recalculates the SLA (it does not reset it) — it can breach
  // inside the transaction if the new deadline has already passed. The FE does NOT compute deadlines.
  reprioritize: (id: string, payload: ReprioritizePayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.RE_PRIORITIZE(id),
      payload,
    ),
};
