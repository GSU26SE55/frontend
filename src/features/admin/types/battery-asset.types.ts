import type {
  WarrantyStatusEnum,
  ChargingStateEnum,
} from "@/features/admin/enums/battery-asset.enum";
import type { BatteryStatusEnum } from "@/shared/enums/battery.enum";
export {
  WarrantyStatusEnum,
  ChargingStateEnum,
  BatteryChemistryEnum,
} from "@/features/admin/enums/battery-asset.enum";
export { BatteryStatusEnum } from "@/shared/enums/battery.enum";
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
