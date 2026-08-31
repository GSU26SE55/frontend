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
import type { TicketSourceFilterEnum } from "@/shared/enums/ticket/ticket.enum";
import { CHAT_PAGE_SIZE } from "@/shared/constants/pagination";

export interface GetAdminTicketsParams {
  keyword?: string;
  status?: TicketStatusEnum;
  priority?: TicketPriorityEnum;
  category?: TicketCategoryEnum;
  /** BE query param `Sla` — Paused | Warning | Breached. Independent of `status`. */
  sla?: SlaFilterEnum;
  /**
   * BE query param `Source` — nguồn tạo ticket. Không map 1-1 với `origin`:
   * Environmental và PeriodicMaintenance đều là Origin = System.
   */
  source?: TicketSourceFilterEnum;
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
    Source: params.source,
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

  getRelated: (id: string) =>
    axiosInstance.get<CommonResponse<TicketDTO[]>>(
      ENDPOINTS.TICKETS.RELATED(id),
    ),

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

  // pageSize is explicit: the BE defaults to 10, so a busy ticket silently lost every message
  // past the tenth — the thread just ended early with no indication anything was missing.
  getComments: (id: string, page = 1, pageSize = CHAT_PAGE_SIZE) =>
    axiosInstance
      .get<
        CommonResponse<PaginationResponse<TicketCommentDTO>>
      >(ENDPOINTS.TICKETS.CHATS(id), { params: { page, pageSize } })
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
