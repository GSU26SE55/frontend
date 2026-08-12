// Cascade Risk DTOs — docs/api-battery.md §Group 12.
import {
  ElectricalTopologyEnum,
  CascadeRiskLevel,
} from "@/shared/enums/battery/cascade.enum";
export {
  ElectricalTopologyEnum,
  CascadeRiskLevel,
} from "@/shared/enums/battery/cascade.enum";

// The BE returns the string name in responses → union of the enum's keys.
export type ElectricalTopologyName = keyof typeof ElectricalTopologyEnum; // "Independent" | "SeriesString" | ...
export type CascadeRiskLevelName = keyof typeof CascadeRiskLevel; // "Low" | "Medium" | "High"

export interface CascadeRiskDto {
  batteryAssetId: string;
  serialNumber: string | null;
  siteId: string | null; // null if the asset is not assigned to a site
  cascadeRiskScore: number; // 0.0–1.0
  level: CascadeRiskLevelName;
  electricalTopology: ElectricalTopologyName;
  cascadeRiskUpdatedAt: string | null; // null if never computed
}

export interface SiteCascadeRiskSummaryDto {
  siteId: string;
  totalAssets: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  maxScore: number; // 0 if the site is empty
  highRiskAssets: CascadeRiskDto[]; // sorted by score desc, may be empty
}

// POST /topology — send an INT 1..4 (not the string name).
export interface SetTopologyPayload {
  electricalTopology: number;
}
