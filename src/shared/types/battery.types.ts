export const BatteryStatusEnum = {
  Active: 1,
  Inactive: 2,
  Decommissioned: 3,
} as const;
export type BatteryStatusEnum =
  (typeof BatteryStatusEnum)[keyof typeof BatteryStatusEnum];

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
