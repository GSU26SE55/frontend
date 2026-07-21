import type { ChargingStateEnum } from "@/features/admin/enums/battery-asset.enum";
import type { WarrantyStatusEnum } from "@/shared/enums/battery/battery.enum";
import type { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
export { ChargingStateEnum } from "@/features/admin/enums/battery-asset.enum";
export {
  WarrantyStatusEnum,
  BatteryStatusEnum,
} from "@/shared/enums/battery/battery.enum";

// BatteryAssetDto (18 field) dùng chung — nguồn thật ở shared (BatteryAssetDetailDto).
export type { BatteryAssetDetailDto as BatteryAssetDto } from "@/shared/types/battery/battery-asset.types";

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
  chargingState: ChargingStateEnum | null;
  activeAlerts: number;
}

export interface CreateBatteryAssetPayload {
  serialNumber: string;
  batteryTypeId: string;
  customerId: string;
  siteId?: string;
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
  siteId?: string;
  status?: BatteryStatusEnum;
  includeDeleted?: boolean;
  // Server-side sort — whitelist: serialNumber, batteryTypeName, customerName,
  // siteName, status, installDate. Bỏ trống → BE default createdAt desc.
  sortBy?: string;
  sortDir?: string;
}

export interface CustomerDropdownItem {
  id: string;
  fullName: string;
  email: string;
}
