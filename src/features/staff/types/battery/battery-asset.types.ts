export {
  WarrantyStatusEnum,
  BatteryStatusEnum,
} from "@/shared/enums/battery/battery.enum";

// BatteryAssetDto (18 fields) is shared — the real source lives in shared (BatteryAssetDetailDto).
export type { BatteryAssetDetailDto as BatteryAssetDto } from "@/shared/types/battery/battery-asset.types";
