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
} from "@/shared/types/ticket.types";
import type {
  StaffTicketsParams,
  StartTicketRequest,
  HoldTicketRequest,
  ResolveTicketRequest,
  EscalateTicketRequest,
  AddCommentRequest,
  AddMaintenanceLogRequest,
  UpdateMaintenanceLogRequest,
} from "../types/staff-ticket.types";

export const staffTicketService = {
  getMyTickets: (params: StaffTicketsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketDTO>>>(
      ENDPOINTS.STAFF_TICKETS.ME,
      {
        params: {
          Status: params.status,
          PageNumber: params.pageNumber,
          PageSize: params.pageSize,
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

  getComments: (ticketId: string, page = 1, pageSize = 10) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketCommentDTO>>>(
      ENDPOINTS.TICKETS.CHATS(ticketId),
      { params: { page, pageSize } },
    ),

  start: (id: string, data?: StartTicketRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.STAFF_TICKETS.START(id),
      data,
    ),

  hold: (id: string, data: HoldTicketRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.STAFF_TICKETS.HOLD(id),
      data,
    ),

  resume: (id: string) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.STAFF_TICKETS.RESUME(id),
    ),

  resolve: (id: string, data: ResolveTicketRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.STAFF_TICKETS.RESOLVE(id),
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
