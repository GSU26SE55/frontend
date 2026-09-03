// Cascade Risk DTOs — docs/api-battery.md §Group 12.
import {
  ElectricalTopologyEnum,
  CascadeRiskLevel,
} from "@/shared/enums/battery/cascade.enum";
export {
  ElectricalTopologyEnum,
  CascadeRiskLevel,
} from "@/shared/enums/battery/cascade.enum";

// The name unions the UI works with. The BE is NOT consistent about which form it sends for
// these two fields — cascade risk comes back as the numeric enum value — so responses are
// normalised to the name in cascade.service before any component sees them.
export type ElectricalTopologyName = keyof typeof ElectricalTopologyEnum; // "Independent" | "SeriesString" | ...
export type CascadeRiskLevelName = keyof typeof CascadeRiskLevel; // "Low" | "Medium" | "High"

/**
 * Shape as it arrives on the wire, before {@link normalizeCascadeRisk}: each enum field is
 * either the numeric value or the string name, depending on the endpoint.
 */
export type RawEnum<TName extends string> = TName | number;

export interface CascadeRiskDto {
  batteryAssetId: string;
  serialNumber: string | null;
  siteId: string | null; // null if the asset is not assigned to a site
  cascadeRiskScore: number; // 0.0–1.0
  level: CascadeRiskLevelName;
  electricalTopology: ElectricalTopologyName;
  cascadeRiskUpdatedAt: string | null; // null if never computed
  /**
   * Human-readable reasons behind the score (e.g. "ParallelBank wiring adds +0.60") — computed
   * live per request by the BE, NOT stored, so it can lag the stored score by a few seconds
   * right after an alert opens/closes and before the next 5-minute recompute. Display-only —
   * never used to decide anything. Empty when no rule contributed (Low, Independent, no alerts).
   */
  riskFactors: string[];
}

/** {@link CascadeRiskDto} exactly as the BE sends it — enums may still be numeric. */
export interface RawCascadeRiskDto extends Omit<
  CascadeRiskDto,
  "level" | "electricalTopology"
> {
  level: RawEnum<CascadeRiskLevelName>;
  electricalTopology: RawEnum<ElectricalTopologyName>;
}

export interface SiteCascadeRiskSummaryDto {
  siteId: string;
  totalAssets: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  maxScore: number; // 0 if the site is empty
  highRiskAssets: CascadeRiskDto[]; // sorted by score desc, may be empty
  // Counted across EVERY asset in the site (not the paginated battery list) — safe to sum
  // straight into a breakdown chart without worrying which page the table is on.
  independentCount: number;
  seriesStringCount: number;
  parallelBankCount: number;
  seriesParallelCount: number;
}

/** {@link SiteCascadeRiskSummaryDto} as the BE sends it — nested assets not yet normalised. */
export interface RawSiteCascadeRiskSummaryDto extends Omit<
  SiteCascadeRiskSummaryDto,
  "highRiskAssets"
> {
  highRiskAssets: RawCascadeRiskDto[];
}

// POST /topology — send an INT 1..4 (not the string name).
export interface SetTopologyPayload {
  electricalTopology: number;
}
