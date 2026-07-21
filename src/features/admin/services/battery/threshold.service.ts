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
} from "@/features/admin/types/battery/threshold.types";

export const thresholdService = {
  getList: (params?: ThresholdListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ThresholdConfigDto>>>(
      ENDPOINTS.THRESHOLDS.LIST,
      { params },
    ),
  getByType: (batteryTypeId: string, params?: ThresholdByTypeParams) =>
    axiosInstance.get<CommonResponse<ThresholdConfigDto>>(
      ENDPOINTS.THRESHOLDS.BY_TYPE(batteryTypeId),
      { params },
    ),
  upsert: (batteryTypeId: string, payload: UpsertThresholdPayload) =>
    axiosInstance.put<CommonResponse<ThresholdConfigDto>>(
      ENDPOINTS.THRESHOLDS.UPSERT(batteryTypeId),
      payload,
    ),
};
