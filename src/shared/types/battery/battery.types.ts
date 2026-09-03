import type { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import type {
  CascadeRiskLevelName,
  ElectricalTopologyName,
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
  // `GET /sites/{id}/assets` sets these (see GetSiteAssetsQueryHandler), but other endpoints
  // that reuse this DTO may not — keep them optional and let call sites guard for the missing
  // case rather than trust `number`/`.toFixed()` blindly.
  activeAlertCount?: number;
  cascadeRiskScore?: number;
  cascadeRiskLevel?: CascadeRiskLevelName;
  electricalTopology?: ElectricalTopologyName;
  createdAt: string;
}

/** {@link BatteryAssetDto} as the BE sends it — enum fields not yet normalised. */
export interface RawBatteryAssetDto extends Omit<
  BatteryAssetDto,
  "cascadeRiskLevel" | "electricalTopology"
> {
  cascadeRiskLevel: RawEnum<CascadeRiskLevelName>;
  electricalTopology?: RawEnum<ElectricalTopologyName>;
}
