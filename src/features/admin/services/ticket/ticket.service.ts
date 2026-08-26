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
  MaintenanceLogDTO,
  TicketCommentDTO,
  AddCommentPayload,
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
  SlaFilterEnum,
  MergeTicketPayload,
} from "@/shared/types/ticket/ticket.types";

export interface GetAdminTicketsParams {
  keyword?: string;
  status?: TicketStatusEnum;
  priority?: TicketPriorityEnum;
  category?: TicketCategoryEnum;
  /** BE query param `Sla` — Paused | Warning | Breached. Independent of `status`. */
  sla?: SlaFilterEnum;
  isDescending?: boolean;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}

function toQueryParams(params?: GetAdminTicketsParams) {
  if (!params) return undefined;
  return {
    Keyword: params.keyword,
    Status: params.status,
    Priority: params.priority,
    Category: params.category,
    Sla: params.sla,
    IsDescending: params.isDescending,
    SortBy: params.sortBy,
    SortDir: params.sortDir,
    PageNumber: params.pageNumber,
    PageSize: params.pageSize,
  };
}

export const adminTicketService = {
  getList: (params?: GetAdminTicketsParams) =>
    axiosInstance
      .get<
        CommonResponse<PaginationResponse<TicketDTO>>
      >(ENDPOINTS.ADMIN.TICKETS.LIST, { params: toQueryParams(params) })
      .then((r) => r.data),

  getDetail: (id: string) =>
    axiosInstance
      .get<CommonResponse<TicketDetailDTO>>(ENDPOINTS.TICKETS.DETAIL(id))
      .then((r) => r.data),

  getActivities: (id: string) =>
    axiosInstance
      .get<
        CommonResponse<TicketActivityDTO[]>
      >(ENDPOINTS.TICKETS.ACTIVITIES(id))
      .then((r) => r.data),

  getMaintenanceLogs: (id: string) =>
    axiosInstance
      .get<
        CommonResponse<MaintenanceLogDTO[]>
      >(ENDPOINTS.TICKETS.MAINTENANCE_LOGS(id))
      .then((r) => r.data),

  declareIncident: (id: string, incidentDescription: string) =>
    axiosInstance
      .post<TicketActionResponse>(
        ENDPOINTS.ADMIN.TICKETS.DECLARE_INCIDENT(id),
        {
          incidentDescription,
        },
      )
      .then((r) => r.data),

  getComments: (id: string) =>
    axiosInstance
      .get<
        CommonResponse<PaginationResponse<TicketCommentDTO>>
      >(ENDPOINTS.TICKETS.CHATS(id))
      .then((r) => r.data),

  addComment: (id: string, payload: AddCommentPayload) =>
    axiosInstance
      .post<TicketActionResponse>(ENDPOINTS.TICKETS.CHATS(id), payload)
      .then((r) => r.data),

  // Manager merges a suspected duplicate ticket (id) into the target ticket (targetTicketId).
  merge: (id: string, payload: MergeTicketPayload) =>
    axiosInstance
      .post<TicketActionResponse>(ENDPOINTS.ADMIN.TICKETS.MERGE(id), payload)
      .then((r) => r.data),
};
