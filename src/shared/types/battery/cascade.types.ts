// Cascade Risk DTOs — docs/api-battery.md §Nhóm 12.
import {
  ElectricalTopologyEnum,
  CascadeRiskLevel,
} from "@/shared/enums/battery/cascade.enum";
export {
  ElectricalTopologyEnum,
  CascadeRiskLevel,
} from "@/shared/enums/battery/cascade.enum";

// BE trả string-name trong response → union các key của enum.
export type ElectricalTopologyName = keyof typeof ElectricalTopologyEnum; // "Independent" | "SeriesString" | ...
export type CascadeRiskLevelName = keyof typeof CascadeRiskLevel; // "Low" | "Medium" | "High"

export interface CascadeRiskDto {
  batteryAssetId: string;
  serialNumber: string | null;
  siteId: string | null; // null nếu asset chưa gán site
  cascadeRiskScore: number; // 0.0–1.0
  level: CascadeRiskLevelName;
  electricalTopology: ElectricalTopologyName;
  cascadeRiskUpdatedAt: string | null; // null nếu chưa từng tính
}

export interface SiteCascadeRiskSummaryDto {
  siteId: string;
  totalAssets: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  maxScore: number; // 0 nếu site rỗng
  highRiskAssets: CascadeRiskDto[]; // sort score desc, có thể rỗng
}

// POST /topology — gửi INT 1..4 (không phải string name).
export interface SetTopologyPayload {
  electricalTopology: number;
}
