import type { BatteryStatusEnum } from "@/shared/enums/battery.enum";
export { BatteryStatusEnum } from "@/shared/enums/battery.enum";
export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeName: string;
  batteryGroupName?: string;
  customerId: string;
  customerName: string;
  installDate: string;
  status: BatteryStatusEnum;
  location?: string;
  lastSensorReadingAt?: string;
  createdAt: string;
}
