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
  AdminTicketListParams,
  AdminTicketQueueParams,
  TriagePayload,
  AssignPayload,
  ReassignPayload,
  RejectPayload,
  EscalatePayload,
  AddCommentPayload,
} from "@/shared/types/ticket.types";

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
  };
}

function toQueueParams(params?: AdminTicketQueueParams) {
  if (!params) return undefined;
  return {
    Priority: params.priority,
    Category: params.category,
    PageNumber: params.pageNumber,
    PageSize: params.pageSize,
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

  triage: (id: string, payload: TriagePayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.TRIAGE(id),
      payload,
    ),

  assign: (id: string, payload: AssignPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.ASSIGN(id),
      payload,
    ),

  reassign: (id: string, payload: ReassignPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.REASSIGN(id),
      payload,
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

  escalate: (id: string, payload: EscalatePayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.ESCALATE(id),
      payload,
    ),

  declareIncident: (id: string, incidentDescription: string) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.ADMIN.TICKETS.DECLARE_INCIDENT(id),
      { incidentDescription },
    ),

  addComment: (ticketId: string, payload: AddCommentPayload) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.TICKETS.COMMENTS(ticketId),
      payload,
    ),
};
