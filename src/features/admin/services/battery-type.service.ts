import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse, PaginationResponse } from '@/shared/types/api.types';
import type {
  BatteryTypeDto,
  BatteryTypeListParams,
  CreateBatteryTypePayload,
  UpdateBatteryTypePayload,
} from '@/features/admin/types/battery-type.types';

export const batteryTypeService = {
  getList: (params?: BatteryTypeListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryTypeDto>>>(
      ENDPOINTS.BATTERY_TYPES.LIST, { params }
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryTypeDto>>(ENDPOINTS.BATTERY_TYPES.DETAIL(id)),
  create: (payload: CreateBatteryTypePayload) =>
    axiosInstance.post<CommonResponse<BatteryTypeDto>>(ENDPOINTS.BATTERY_TYPES.CREATE, payload),
  update: (id: string, payload: UpdateBatteryTypePayload) =>
    axiosInstance.put<CommonResponse<BatteryTypeDto>>(ENDPOINTS.BATTERY_TYPES.UPDATE(id), payload),
  delete: (id: string) =>
    axiosInstance.delete<CommonResponse<null>>(ENDPOINTS.BATTERY_TYPES.DELETE(id)),
  restore: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(ENDPOINTS.BATTERY_TYPES.RESTORE(id)),
};
