import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  EnvironmentalIncidentDto,
  IncidentListParams,
  ResolveIncidentPayload,
  FalseAlarmIncidentPayload,
} from "@/shared/types/environmental.types";

export const environmentalIncidentService = {
  getList: (params?: IncidentListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<EnvironmentalIncidentDto>>
    >(ENDPOINTS.ENVIRONMENTAL_INCIDENTS.LIST, { params }),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.DETAIL(id),
    ),

  getActiveBySite: (siteId: string) =>
    axiosInstance.get<CommonResponse<EnvironmentalIncidentDto[]>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.ACTIVE_BY_SITE(siteId),
    ),

  acknowledge: (id: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.ACKNOWLEDGE(id),
    ),

  resolve: (id: string, data: ResolveIncidentPayload) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.RESOLVE(id),
      data,
    ),

  markFalseAlarm: (id: string, data: FalseAlarmIncidentPayload) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.FALSE_ALARM(id),
      data,
    ),
};
