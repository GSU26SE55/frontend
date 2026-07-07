import type { WarrantyStatusEnum } from "@/features/manager/enums/battery-asset.enum";
import type { BatteryStatusEnum } from "@/shared/enums/battery.enum";
export { WarrantyStatusEnum } from "@/features/manager/enums/battery-asset.enum";
export { BatteryStatusEnum } from "@/shared/enums/battery.enum";

// Cùng BatteryService DTO (GET /api/battery-assets/{id}) mà admin đã type —
// nhân bản tối thiểu vì manager không được import features/admin/*.
export interface BatteryAssetDto {
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
