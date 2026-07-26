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

// BatteryAssetDetailDto — DTO đầy đủ 18 field của battery asset (GET /api/battery-assets/{id}).
// Dùng chung admin/manager/staff (trước đây nhân bản với tên BatteryAssetDto ở mỗi feature).
// Đặt tên khác bản BatteryAssetDto 10-field ở battery.types.ts (dùng cho danh sách site) để tránh đụng.
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

// Snapshot realtime (GET /api/battery-assets/{id}/realtime). Dùng chung 3 role.
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
  // siteName, status, installDate. Bỏ trống → BE default createdAt desc.
  sortBy?: string;
  sortDir?: string;
}

// ── Payload CRUD (chỉ Admin dùng; đặt shared để service read/write chung 1 nguồn type) ──
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
