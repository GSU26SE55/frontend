import type { SiteStatusEnum } from "@/shared/enums/site/site.enum";
import type { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
export { SiteStatusEnum } from "@/shared/enums/site/site.enum";

// Lightweight option for the site selector used in shared components
// (ambient/incidents). SiteDto is assignable to SiteOption.
export interface SiteOption {
  id: string;
  name: string;
}

export interface SiteDto {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  installDate: string;
  status: SiteStatusEnum;
  contactPersonName?: string;
  contactPersonPhone?: string;
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
  sortBy?: string;
  sortDir?: string;
}

export interface SiteAssetsFilterParams {
  pageNumber?: number;
  pageSize?: number;
  status?: BatteryStatusEnum;
}

export interface SiteCreatePayload {
  name: string;
  customerId: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  installDate: string;
  status?: SiteStatusEnum;
  contactPersonName?: string;
  contactPersonPhone?: string;
}

export type SiteUpdatePayload = SiteCreatePayload;
