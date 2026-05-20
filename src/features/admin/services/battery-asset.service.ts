import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse, PaginationResponse } from '@/shared/types/api.types';
import type {
  BatteryAssetDto,
  BatteryAssetRealtimeDto,
  BatteryAssetListParams,
  CreateBatteryAssetPayload,
  UpdateBatteryAssetPayload,
  TransferOwnerPayload,
} from '@/features/admin/types/battery-asset.types';

export const batteryAssetService = {
  getList: (params?: BatteryAssetListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAssetDto>>>(
      ENDPOINTS.BATTERY_ASSETS.LIST, { params }
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetDto>>(ENDPOINTS.BATTERY_ASSETS.DETAIL(id)),
  getRealtime: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetRealtimeDto>>(
      ENDPOINTS.BATTERY_ASSETS.REALTIME(id)
    ),
  create: (payload: CreateBatteryAssetPayload) =>
    axiosInstance.post<CommonResponse<BatteryAssetDto>>(ENDPOINTS.BATTERY_ASSETS.CREATE, payload),
  update: (id: string, payload: UpdateBatteryAssetPayload) =>
    axiosInstance.put<CommonResponse<BatteryAssetDto>>(ENDPOINTS.BATTERY_ASSETS.UPDATE(id), payload),
  delete: (id: string) =>
    axiosInstance.delete<CommonResponse<null>>(ENDPOINTS.BATTERY_ASSETS.DELETE(id)),
  restore: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(ENDPOINTS.BATTERY_ASSETS.RESTORE(id)),
  transferOwner: (id: string, payload: TransferOwnerPayload) =>
    axiosInstance.put<CommonResponse<null>>(
      ENDPOINTS.BATTERY_ASSETS.TRANSFER_OWNER(id), payload
    ),
};
