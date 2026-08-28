import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  ThresholdConfigDto,
  ThresholdListParams,
  ThresholdByTypeParams,
  UpsertThresholdPayload,
} from "@/shared/types/battery/threshold.types";

// getByType (read) is used by Admin/Manager to color telemetry against thresholds (BE blocks Staff).
// getList/upsert is Admin only — kept in the same service.
export const thresholdService = {
  getList: (params?: ThresholdListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ThresholdConfigDto>>>(
      ENDPOINTS.THRESHOLDS.LIST,
      { params },
    ),
  // data is null when the battery type has no threshold configured yet — BE returns
  // 200 for that (a successful query with an empty result), not 404.
  getByType: (batteryTypeId: string, params?: ThresholdByTypeParams) =>
    axiosInstance.get<CommonResponse<ThresholdConfigDto | null>>(
      ENDPOINTS.THRESHOLDS.BY_TYPE(batteryTypeId),
      { params },
    ),
  upsert: (batteryTypeId: string, payload: UpsertThresholdPayload) =>
    axiosInstance.put<CommonResponse<ThresholdConfigDto>>(
      ENDPOINTS.THRESHOLDS.UPSERT(batteryTypeId),
      payload,
    ),
};
