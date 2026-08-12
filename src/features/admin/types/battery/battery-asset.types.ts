// Re-exported from shared — the real source lives in shared/types/battery/battery-asset.types.ts.
// This file is kept so existing admin imports (schema/form/table/service) don't have to change paths.
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
