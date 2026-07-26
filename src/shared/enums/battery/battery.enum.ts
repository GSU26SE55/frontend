export const BatteryStatusEnum = {
  Active: 1,
  Inactive: 2,
  Decommissioned: 3,
} as const;
export type BatteryStatusEnum =
  (typeof BatteryStatusEnum)[keyof typeof BatteryStatusEnum];

// WarrantyStatusEnum — dùng chung admin/manager/staff (trước đây nhân bản mỗi feature).
export const WarrantyStatusEnum = {
  ACTIVE: 1,
  EXPIRED: 2,
  VOID: 3,
} as const;
export type WarrantyStatusEnum =
  (typeof WarrantyStatusEnum)[keyof typeof WarrantyStatusEnum];

// ChargingStateEnum — trạng thái sạc/xả (dùng cho realtime + sensor-stream). Dùng chung 3 role.
export const ChargingStateEnum = {
  IDLE: 1,
  CHARGING: 2,
  DISCHARGING: 3,
  FLOAT: 4,
  BYPASS: 5,
} as const;
export type ChargingStateEnum =
  (typeof ChargingStateEnum)[keyof typeof ChargingStateEnum];

// BatteryChemistryEnum — hóa học pin (dùng cho BatteryType). Đặt shared để tránh cross-feature import.
export const BatteryChemistryEnum = {
  LI_FE_PO4: 1,
  NMC: 2,
  NCA: 3,
  LCO: 4,
  OTHER: 99,
} as const;
export type BatteryChemistryEnum =
  (typeof BatteryChemistryEnum)[keyof typeof BatteryChemistryEnum];
