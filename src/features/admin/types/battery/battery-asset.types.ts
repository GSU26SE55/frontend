// Re-export từ shared — nguồn thật ở shared/types/battery/battery-asset.types.ts.
// Giữ file này để import admin cũ (schema/form/table/service) không phải đổi path.
export {
  ChargingStateEnum,
  WarrantyStatusEnum,
  BatteryStatusEnum,
} from "@/shared/enums/battery/battery.enum";

export type {
  BatteryAssetDetailDto as BatteryAssetDto,
  BatteryAssetRealtimeDto,
  BatteryAssetListParams,
  CreateBatteryAssetPayload,
  UpdateBatteryAssetPayload,
  TransferOwnerPayload,
  CustomerDropdownItem,
} from "@/shared/types/battery/battery-asset.types";
