import { CHAT_PAGE_SIZE } from "@/shared/constants/pagination";
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
  TicketCommentDTO,
  TicketActionResponse,
  StaffMaintenanceLogGroupDTO,
} from "@/shared/types/ticket/ticket.types";
import type {
  StaffTicketsParams,
  HoldTicketRequest,
  ResumeTicketRequest,
  ResolveTicketRequest,
  EscalateTicketRequest,
  AddCommentRequest,
  AddMaintenanceLogRequest,
  UpdateMaintenanceLogRequest,
} from "@/features/staff/types/ticket/staff-ticket.types";

export const staffTicketService = {
  getMyTickets: (params: StaffTicketsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketDTO>>>(
      ENDPOINTS.STAFF_TICKETS.ME,
      {
        params: {
          Status: params.status,
          PageNumber: params.pageNumber,
          PageSize: params.pageSize,
          SlaOpen: params.slaOpen,
          SortBy: params.sortBy,
        },
      },
    ),

  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<TicketDetailDTO>>(
      ENDPOINTS.TICKETS.DETAIL(id),
    ),

  getActivities: (id: string) =>
    axiosInstance.get<CommonResponse<TicketActivityDTO[]>>(
      ENDPOINTS.TICKETS.ACTIVITIES(id),
    ),

  // pageSize default was 10, so a busy ticket silently lost every message past the tenth.
  getComments: (ticketId: string, page = 1, pageSize = CHAT_PAGE_SIZE) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketCommentDTO>>>(
      ENDPOINTS.TICKETS.CHATS(ticketId),
      { params: { page, pageSize } },
    ),

  hold: (id: string, data: HoldTicketRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.STAFF_TICKETS.HOLD(id),
      data,
    ),

  // GH-1176: resume is restricted to PendingContext=Held tickets (early resume by Primary Staff).
  resume: (id: string, data: ResumeTicketRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.STAFF_TICKETS.RESUME(id),
      data,
    ),

  // GH-1176: renamed from resolve (InProgress→Completed).
  complete: (id: string, data: ResolveTicketRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.STAFF_TICKETS.COMPLETE(id),
      data,
    ),

  escalateRequest: (id: string, data: EscalateTicketRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.STAFF_TICKETS.ESCALATE_REQUEST(id),
      data,
    ),

  addComment: (ticketId: string, data: AddCommentRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.TICKETS.CHATS(ticketId),
      data,
    ),

  addMaintenanceLog: (ticketId: string, data: AddMaintenanceLogRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.TICKETS.MAINTENANCE_LOGS(ticketId),
      data,
    ),

  getMyMaintenanceLogs: () =>
    axiosInstance.get<CommonResponse<StaffMaintenanceLogGroupDTO[]>>(
      ENDPOINTS.STAFF_TICKETS.MAINTENANCE_LOGS_ME,
    ),

  updateMaintenanceLog: (
    ticketId: string,
    logId: string,
    data: UpdateMaintenanceLogRequest,
  ) =>
    axiosInstance.patch<TicketActionResponse>(
      ENDPOINTS.TICKETS.MAINTENANCE_LOG_UPDATE(ticketId, logId),
      data,
    ),
};
