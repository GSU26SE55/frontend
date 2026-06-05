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
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket.types";

export interface GetAdminTicketsParams {
  keyword?: string;
  status?: TicketStatusEnum;
  priority?: TicketPriorityEnum;
  category?: TicketCategoryEnum;
  isDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const adminTicketService = {
  getList: (params?: GetAdminTicketsParams) =>
    axiosInstance
      .get<
        CommonResponse<PaginationResponse<TicketDTO>>
      >(ENDPOINTS.ADMIN.TICKETS.LIST, { params })
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

  declareIncident: (id: string) =>
    axiosInstance
      .post<TicketActionResponse>(ENDPOINTS.ADMIN.TICKETS.DECLARE_INCIDENT(id))
      .then((r) => r.data),
};
