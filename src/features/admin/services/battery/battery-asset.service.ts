import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  BatteryAssetDto,
  CreateBatteryAssetPayload,
  UpdateBatteryAssetPayload,
  TransferOwnerPayload,
} from "@/features/admin/types/battery/battery-asset.types";
import { batteryAssetService as sharedBatteryAssetService } from "@/shared/services/battery/battery-asset.service";

// Read (getList/getById/getRealtime) is shared; admin adds CRUD (Admin-only).
export const batteryAssetService = {
  ...sharedBatteryAssetService,
  create: (payload: CreateBatteryAssetPayload) =>
    axiosInstance.post<CommonResponse<BatteryAssetDto>>(
      ENDPOINTS.BATTERY_ASSETS.CREATE,
      payload,
    ),
  update: (id: string, payload: UpdateBatteryAssetPayload) =>
    axiosInstance.put<CommonResponse<BatteryAssetDto>>(
      ENDPOINTS.BATTERY_ASSETS.UPDATE(id),
      payload,
    ),
  delete: (id: string) =>
    axiosInstance.delete<CommonResponse<null>>(
      ENDPOINTS.BATTERY_ASSETS.DELETE(id),
    ),
  restore: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(
      ENDPOINTS.BATTERY_ASSETS.RESTORE(id),
    ),
  transferOwner: (id: string, payload: TransferOwnerPayload) =>
    axiosInstance.put<CommonResponse<null>>(
      ENDPOINTS.BATTERY_ASSETS.TRANSFER_OWNER(id),
      payload,
    ),
};
