export { BatteryStatusEnum } from "./battery.enums";

import type { BatteryStatusEnum } from "./battery.enums";

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
