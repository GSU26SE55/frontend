export const BatteryStatusEnum = {
  Active: 1,
  Inactive: 2,
  Decommissioned: 3,
} as const;
export type BatteryStatusEnum =
  (typeof BatteryStatusEnum)[keyof typeof BatteryStatusEnum];

export const WarrantyStatusEnum = {
  Active: 1,
  Expired: 2,
  Void: 3,
} as const;
export type WarrantyStatusEnum =
  (typeof WarrantyStatusEnum)[keyof typeof WarrantyStatusEnum];

export const ChargingStateEnum = {
  Idle: 1,
  Charging: 2,
  Discharging: 3,
  Fault: 4,
} as const;
export type ChargingStateEnum =
  (typeof ChargingStateEnum)[keyof typeof ChargingStateEnum];

export { BatteryChemistryEnum } from "@/features/admin/types/battery-type.types";
export type { BatteryTypeDto } from "@/features/admin/types/battery-type.types";

export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeId: string;
  batteryTypeName: string;
  siteId: string | null;
  siteName: string | null;
  batteryGroupId: string | null;
  batteryGroupName: string | null;
  customerId: string;
  customerName: string;
  installDate: string;
  warrantyEndDate: string | null;
  warrantyStatus: WarrantyStatusEnum;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: BatteryStatusEnum;
  notes: string | null;
  lastSensorReadingAt: string | null;
  createdAt: string;
}

export interface BatteryAssetRealtimeDto {
  assetId: string;
  serialNumber: string;
  status: BatteryStatusEnum;
  time: string | null;
  voltage: number | null;
  current: number | null;
  temperature: number | null;
  socPercent: number | null;
  cycleCount: number | null;
  sohPercent: number | null;
  chargingState: ChargingStateEnum;
  activeAlerts: number;
}

export interface CreateBatteryAssetPayload {
  serialNumber: string;
  batteryTypeId: string;
  customerId: string;
  siteId?: string;
  batteryGroupId?: string;
  installDate: string;
  warrantyEndDate?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface UpdateBatteryAssetPayload extends CreateBatteryAssetPayload {
  warrantyStatus?: WarrantyStatusEnum;
  status?: BatteryStatusEnum;
}

export interface TransferOwnerPayload {
  newCustomerId: string;
  reason?: string;
}

export interface BatteryAssetListParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  customerId?: string;
  batteryTypeId?: string;
  status?: BatteryStatusEnum;
  includeDeleted?: boolean;
}

export interface CustomerDropdownItem {
  id: string;
  fullName: string;
  email: string;
}
