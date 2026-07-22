import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  BatteryAssetDetailDto,
  BatteryAssetRealtimeDto,
  BatteryAssetListParams,
} from "@/shared/types/battery/battery-asset.types";

// Read-only battery asset — dùng chung admin/manager/staff.
// getList: Admin,Manager (Staff bị BE chặn → staff không gọi getList).
// getById/getRealtime: Admin,Manager,Staff,Customer.
export const batteryAssetService = {
  getList: (params?: BatteryAssetListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<BatteryAssetDetailDto>>
    >(ENDPOINTS.BATTERY_ASSETS.LIST, { params }),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetDetailDto>>(
      ENDPOINTS.BATTERY_ASSETS.DETAIL(id),
    ),
  getRealtime: (id: string) =>
    axiosInstance.get<CommonResponse<BatteryAssetRealtimeDto>>(
      ENDPOINTS.BATTERY_ASSETS.REALTIME(id),
    ),
};
