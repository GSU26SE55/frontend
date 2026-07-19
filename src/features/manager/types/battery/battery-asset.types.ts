export {
  WarrantyStatusEnum,
  BatteryStatusEnum,
} from "@/shared/enums/battery/battery.enum";

// BatteryAssetDto (18 field) dùng chung — nguồn thật ở shared (BatteryAssetDetailDto).
export type { BatteryAssetDetailDto as BatteryAssetDto } from "@/shared/types/battery/battery-asset.types";
