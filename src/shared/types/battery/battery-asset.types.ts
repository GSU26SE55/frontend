import type {
  BatteryStatusEnum,
  WarrantyStatusEnum,
  ChargingStateEnum,
} from "@/shared/enums/battery/battery.enum";
export {
  BatteryStatusEnum,
  WarrantyStatusEnum,
  ChargingStateEnum,
} from "@/shared/enums/battery/battery.enum";

// BatteryAssetDetailDto — the full 18-field battery asset DTO (GET /api/battery-assets/{id}).
// Shared by admin/manager/staff (previously duplicated as BatteryAssetDto in each feature).
// Named differently from the 10-field BatteryAssetDto in battery.types.ts (used for the site
// list) to avoid a clash.
export interface BatteryAssetDetailDto {
  id: string;
  serialNumber: string;
  batteryTypeId: string;
  batteryTypeName: string;
  siteId: string | null;
  siteName: string | null;
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

// Realtime snapshot (GET /api/battery-assets/{id}/realtime). Shared by all 3 roles.
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
  // siteName, status, installDate. Leave empty → the BE defaults to createdAt desc.
  sortBy?: string;
  sortDir?: string;
}

// ── CRUD payloads (Admin only; kept in shared so read/write services use one type source) ──
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

export interface CustomerDropdownItem {
  id: string;
  fullName: string;
  email: string;
}
