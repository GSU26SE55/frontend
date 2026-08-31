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
  // OPTIONAL — không phải endpoint nào cũng trả. `GET /sites/{id}/assets` chiếu sang
  // `BatteryAssetDto` mà không set ba trường này, nên khai `number` bắt buộc chỉ làm tsc im
  // lặng rồi để runtime nổ ở `.toFixed()`. Chỗ hiển thị phải tự lo trường hợp thiếu.
  activeAlertCount?: number;
  cascadeRiskScore?: number;
  cascadeRiskLevel?: CascadeRiskLevelName;
  createdAt: string;
}

/** {@link BatteryAssetDto} as the BE sends it — cascadeRiskLevel not yet normalised. */
export interface RawBatteryAssetDto extends Omit<
  BatteryAssetDto,
  "cascadeRiskLevel"
> {
  cascadeRiskLevel: RawEnum<CascadeRiskLevelName>;
}
