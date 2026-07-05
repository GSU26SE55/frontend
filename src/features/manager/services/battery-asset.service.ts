import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { BatteryAssetDto } from "@/features/manager/types/battery-asset.types";

// Chỉ đọc — Manager không quản lý CRUD battery asset, chỉ xem thông tin
// gắn với ticket. GET /api/battery-assets/{id} cho phép Admin,Manager,Staff,Customer.
export const batteryAssetService = {
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetDto>>(
      ENDPOINTS.BATTERY_ASSETS.DETAIL(id),
    ),
};
