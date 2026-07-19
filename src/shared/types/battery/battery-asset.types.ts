import type {
  BatteryStatusEnum,
  WarrantyStatusEnum,
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
