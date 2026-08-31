import type { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import type {
  CascadeRiskLevelName,
  RawEnum,
} from "@/shared/types/battery/cascade.types";
export { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeName: string;
  customerId: string;
  customerName: string;
  installDate: string;
  status: BatteryStatusEnum;
  location?: string;
  lastSensorReadingAt?: string;
  activeAlertCount: number;
  cascadeRiskScore: number;
  cascadeRiskLevel: CascadeRiskLevelName;
  createdAt: string;
}

/** {@link BatteryAssetDto} as the BE sends it — cascadeRiskLevel not yet normalised. */
export interface RawBatteryAssetDto extends Omit<
  BatteryAssetDto,
  "cascadeRiskLevel"
> {
  cascadeRiskLevel: RawEnum<CascadeRiskLevelName>;
}
