import type { BatteryStatusEnum } from "./battery.types";

export const SiteStatusEnum = {
  Active: 1,
  UnderMaintenance: 2,
  Decommissioned: 3,
} as const;
export type SiteStatusEnum =
  (typeof SiteStatusEnum)[keyof typeof SiteStatusEnum];

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
