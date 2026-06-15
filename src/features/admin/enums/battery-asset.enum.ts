export const WarrantyStatusEnum = {
  ACTIVE: 1,
  EXPIRED: 2,
  VOID: 3,
} as const;
export type WarrantyStatusEnum =
  (typeof WarrantyStatusEnum)[keyof typeof WarrantyStatusEnum];

export const ChargingStateEnum = {
  IDLE: 1,
  CHARGING: 2,
  DISCHARGING: 3,
  FLOAT: 4,
  BYPASS: 5,
} as const;
export type ChargingStateEnum =
  (typeof ChargingStateEnum)[keyof typeof ChargingStateEnum];

export const BatteryChemistryEnum = {
  LI_FE_PO4: 1,
  NMC: 2,
  NCA: 3,
  LCO: 4,
  OTHER: 99,
} as const;
export type BatteryChemistryEnum =
  (typeof BatteryChemistryEnum)[keyof typeof BatteryChemistryEnum];
