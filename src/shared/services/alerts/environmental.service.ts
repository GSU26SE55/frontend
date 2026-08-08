import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  EnvironmentalIncidentDto,
  IncidentListParams,
  ManualIncidentPayload,
  ResolveIncidentPayload,
  FalseAlarmIncidentPayload,
} from "@/shared/types/alerts/environmental.types";

export const environmentalService = {
  getList: (params?: IncidentListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<EnvironmentalIncidentDto>>
    >(ENDPOINTS.ENVIRONMENTAL_INCIDENTS.LIST, { params }),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.DETAIL(id),
    ),

  getActiveBySite: (siteId: string) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<EnvironmentalIncidentDto>>
    >(ENDPOINTS.ENVIRONMENTAL_INCIDENTS.ACTIVE_BY_SITE(siteId)),

  // Dedup: an active incident (Open/Acknowledged) already exists with the same
  // SiteId+IncidentType → BE returns 200 with the OLD incident, no new event is fired.
  reportManual: (payload: ManualIncidentPayload) =>
    axiosInstance.post<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.MANUAL,
      payload,
    ),

  acknowledge: (id: string) =>
    axiosInstance.post<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.ACKNOWLEDGE(id),
    ),

  resolve: (id: string, payload: ResolveIncidentPayload) =>
    axiosInstance.post<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.RESOLVE(id),
      payload,
    ),

  falseAlarm: (id: string, payload: FalseAlarmIncidentPayload) =>
    axiosInstance.post<CommonResponse<EnvironmentalIncidentDto>>(
      ENDPOINTS.ENVIRONMENTAL_INCIDENTS.FALSE_ALARM(id),
      payload,
    ),
};
