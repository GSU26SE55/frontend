export const WarrantyStatusEnum = {
  Active: 1,
  Expired: 2,
  Void: 3,
} as const;
export type WarrantyStatusEnum =
  (typeof WarrantyStatusEnum)[keyof typeof WarrantyStatusEnum];

export const ChargingStateEnum = {
  Idle: 1,
  Charging: 2,
  Discharging: 3,
  Fault: 4,
} as const;
export type ChargingStateEnum =
  (typeof ChargingStateEnum)[keyof typeof ChargingStateEnum];
