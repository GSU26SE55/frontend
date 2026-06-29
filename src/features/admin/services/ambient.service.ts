import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  AmbientReadingDto,
  AmbientThresholdConfigDto,
  AmbientHistoryParams,
  AmbientThresholdListParams,
  AmbientThresholdUpsertPayload,
} from "@/shared/types/ambient.types";

export const ambientService = {
  getHistory: (params?: AmbientHistoryParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AmbientReadingDto>>>(
      ENDPOINTS.AMBIENT.READINGS_HISTORY,
      { params },
    ),

  getLatest: (siteId?: string) =>
    axiosInstance.get<CommonResponse<AmbientReadingDto[]>>(
      ENDPOINTS.AMBIENT.READINGS_LATEST,
      { params: siteId ? { siteId } : undefined },
    ),

  getThresholds: (params?: AmbientThresholdListParams) =>
    axiosInstance.get<CommonResponse<AmbientThresholdConfigDto[]>>(
      ENDPOINTS.AMBIENT.THRESHOLD_LIST,
      { params },
    ),

  getThresholdBySite: (siteId: string) =>
    axiosInstance.get<CommonResponse<AmbientThresholdConfigDto>>(
      ENDPOINTS.AMBIENT.THRESHOLD_BY_SITE(siteId),
    ),

  upsertThreshold: (data: AmbientThresholdUpsertPayload) =>
    axiosInstance.post<CommonResponse<AmbientThresholdConfigDto>>(
      ENDPOINTS.AMBIENT.THRESHOLD_UPSERT,
      data,
    ),
};
