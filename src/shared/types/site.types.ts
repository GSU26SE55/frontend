export { SiteStatusEnum } from "./site.enums";

import type { BatteryStatusEnum } from "./battery.enums";
import type { SiteStatusEnum } from "./site.enums";

export interface SiteDto {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  capacityKw?: number;
  installDate: string;
  status: SiteStatusEnum;
  contactPersonName?: string;
  contactPersonPhone?: string;
  batteryGroupCount: number;
  batteryAssetCount: number;
  activeBatteryAssetCount: number;
  createdAt: string;
}

export interface SiteDashboardDto {
  siteId: string;
  name: string;
  customerId: string;
  totalAssets: number;
  activeAssets: number;
  assetsWithActiveAlerts: number;
  totalCapacityKw?: number;
  lastAlertAt?: string;
  healthScore: number;
}

export interface SiteFilterParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  customerId?: string;
  status?: SiteStatusEnum;
  includeDeleted?: boolean;
}

export interface SiteAssetsFilterParams {
  pageNumber?: number;
  pageSize?: number;
  batteryGroupId?: string;
  status?: BatteryStatusEnum;
}

export interface SiteCreatePayload {
  name: string;
  customerId: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  capacityKw?: number | null;
  installDate: string;
  status?: SiteStatusEnum;
  contactPersonName?: string;
  contactPersonPhone?: string;
}

export type SiteUpdatePayload = SiteCreatePayload;
