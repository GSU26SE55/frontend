// Cascade Risk — dùng ≥ 2 feature (admin + manager) → đặt ở shared.
// Docs: docs/api-battery.md §Nhóm 12 (Sprint 7 B4).
// ⚠️ BE serialize enum dạng STRING NAME trong response ("SeriesString", "High"),
//    nhưng POST topology nhận INT ({ electricalTopology: 2 }). Value số dùng để gửi POST + build select;
//    DTO field dùng string-name union (keyof typeof Enum) — xem cascade.types.ts.

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
