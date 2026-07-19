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
} from "@/shared/types/ambient/ambient.types";

export const ambientService = {
  getHistory: (params: AmbientHistoryParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AmbientReadingDto>>>(
      ENDPOINTS.AMBIENT.READINGS_HISTORY,
      { params },
    ),

  getLatest: (siteId: string) =>
    axiosInstance.get<CommonResponse<AmbientReadingDto>>(
      ENDPOINTS.AMBIENT.READINGS_LATEST,
      { params: { siteId } },
    ),

  getThresholdList: (params?: AmbientThresholdListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<AmbientThresholdConfigDto>>
    >(ENDPOINTS.AMBIENT.THRESHOLD_LIST, { params }),

  getThresholdBySite: (siteId: string) =>
    axiosInstance.get<CommonResponse<AmbientThresholdConfigDto>>(
      ENDPOINTS.AMBIENT.THRESHOLD_BY_SITE(siteId),
    ),

  upsertThreshold: (payload: AmbientThresholdUpsertPayload) =>
    axiosInstance.put<CommonResponse<AmbientThresholdConfigDto>>(
      ENDPOINTS.AMBIENT.THRESHOLD_UPSERT,
      payload,
    ),
};
