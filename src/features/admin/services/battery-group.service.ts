import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  BatteryGroupDto,
  BatteryGroupListParams,
  CreateBatteryGroupPayload,
  UpdateBatteryGroupPayload,
} from "@/features/admin/types/battery-group.types";

export const batteryGroupService = {
  getList: (params?: BatteryGroupListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryGroupDto>>>(
      ENDPOINTS.BATTERY_GROUPS.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryGroupDto>>(
      ENDPOINTS.BATTERY_GROUPS.DETAIL(id),
    ),
  create: (payload: CreateBatteryGroupPayload) =>
    axiosInstance.post<CommonResponse<BatteryGroupDto>>(
      ENDPOINTS.BATTERY_GROUPS.CREATE,
      payload,
    ),
  update: (id: string, payload: UpdateBatteryGroupPayload) =>
    axiosInstance.put<CommonResponse<BatteryGroupDto>>(
      ENDPOINTS.BATTERY_GROUPS.UPDATE(id),
      payload,
    ),
  delete: (id: string) =>
    axiosInstance.delete<CommonResponse<null>>(
      ENDPOINTS.BATTERY_GROUPS.DELETE(id),
    ),
  restore: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(
      ENDPOINTS.BATTERY_GROUPS.RESTORE(id),
    ),
};
