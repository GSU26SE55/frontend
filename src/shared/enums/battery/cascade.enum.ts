// Cascade Risk — used by ≥ 2 features (admin + manager) → lives in shared.
// Docs: docs/api-battery.md §Group 12 (Sprint 7 B4).
// ⚠️ The BE serializes the enum as a STRING NAME in responses ("SeriesString", "High"),
//    but POST topology takes an INT ({ electricalTopology: 2 }). The numeric values are for
//    the POST body + building selects; DTO fields use the string-name union
//    (keyof typeof Enum) — see cascade.types.ts.

export const ElectricalTopologyEnum = {
  Independent: 1,
  SeriesString: 2,
  ParallelBank: 3,
  SeriesParallel: 4,
} as const;
export type ElectricalTopologyEnum =
  (typeof ElectricalTopologyEnum)[keyof typeof ElectricalTopologyEnum];

export const CascadeRiskLevel = {
  Low: 1,
  Medium: 2,
  High: 3,
} as const;
export type CascadeRiskLevel =
  (typeof CascadeRiskLevel)[keyof typeof CascadeRiskLevel];
