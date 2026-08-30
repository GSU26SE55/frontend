import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  SlaNonWorkingPeriodDto,
  SlaNonWorkingPeriodParams,
  SlaNonWorkingPeriodPayload,
} from "@/shared/types/sla/sla-calendar.types";

// SlaCalendarController — every route is [Authorize(Roles = "Manager,Admin")].
export const slaCalendarService = {
  getList: (params?: SlaNonWorkingPeriodParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<SlaNonWorkingPeriodDto>>
    >(ENDPOINTS.SLA_CALENDAR.NON_WORKING_PERIODS, { params }),

  create: (payload: SlaNonWorkingPeriodPayload) =>
    axiosInstance.post<CommonResponse<SlaNonWorkingPeriodDto>>(
      ENDPOINTS.SLA_CALENDAR.NON_WORKING_PERIODS,
      payload,
    ),

  update: (id: string, payload: SlaNonWorkingPeriodPayload) =>
    axiosInstance.put<CommonResponse<SlaNonWorkingPeriodDto>>(
      ENDPOINTS.SLA_CALENDAR.NON_WORKING_PERIOD(id),
      payload,
    ),

  remove: (id: string) =>
    axiosInstance.delete<CommonResponse<SlaNonWorkingPeriodDto>>(
      ENDPOINTS.SLA_CALENDAR.NON_WORKING_PERIOD(id),
    ),
};
