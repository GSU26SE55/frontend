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
} from "@/shared/types/ticket.types";
import type {
  StaffTicketsParams,
  HoldTicketRequest,
  ResolveTicketRequest,
  EscalateTicketRequest,
  AddCommentRequest,
  AddMaintenanceLogRequest,
} from "../types/staff-ticket.types";

export const staffTicketService = {
  getMyTickets: (params: StaffTicketsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<TicketDTO>>>(
      ENDPOINTS.STAFF_TICKETS.ME,
      { params },
    ),

  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<TicketDetailDTO>>(
      ENDPOINTS.TICKETS.DETAIL(id),
    ),

  getActivities: (id: string) =>
    axiosInstance.get<CommonResponse<TicketActivityDTO[]>>(
      ENDPOINTS.TICKETS.ACTIVITIES(id),
    ),

  start: (id: string) =>
    axiosInstance.post<TicketActionResponse>(ENDPOINTS.STAFF_TICKETS.START(id)),

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
      ENDPOINTS.TICKETS.COMMENTS(ticketId),
      data,
    ),

  addMaintenanceLog: (ticketId: string, data: AddMaintenanceLogRequest) =>
    axiosInstance.post<TicketActionResponse>(
      ENDPOINTS.TICKETS.MAINTENANCE_LOGS(ticketId),
      data,
    ),
};
