export const BatteryStatusEnum = {
  Active: 1,
  Inactive: 2,
  Decommissioned: 3,
} as const;
export type BatteryStatusEnum =
  (typeof BatteryStatusEnum)[keyof typeof BatteryStatusEnum];

// WarrantyStatusEnum — shared by admin/manager/staff (previously duplicated per feature).
export const WarrantyStatusEnum = {
  ACTIVE: 1,
  EXPIRED: 2,
  VOID: 3,
} as const;
export type WarrantyStatusEnum =
  (typeof WarrantyStatusEnum)[keyof typeof WarrantyStatusEnum];

// ChargingStateEnum — charge/discharge state (used by realtime + sensor-stream).
// Shared by all 3 roles.
export const ChargingStateEnum = {
  IDLE: 1,
  CHARGING: 2,
  DISCHARGING: 3,
  FLOAT: 4,
  BYPASS: 5,
} as const;
export type ChargingStateEnum =
  (typeof ChargingStateEnum)[keyof typeof ChargingStateEnum];

// BatteryChemistryEnum — battery chemistry (used by BatteryType). Kept in shared to
// avoid a cross-feature import.
export const BatteryChemistryEnum = {
  LI_FE_PO4: 1,
  NMC: 2,
  NCA: 3,
  LCO: 4,
  OTHER: 99,
} as const;
export type BatteryChemistryEnum =
  (typeof BatteryChemistryEnum)[keyof typeof BatteryChemistryEnum];
