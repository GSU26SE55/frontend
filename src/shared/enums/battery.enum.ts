export const BatteryStatusEnum = {
  Active: 1,
  Inactive: 2,
  Decommissioned: 3,
} as const;
export type BatteryStatusEnum =
  (typeof BatteryStatusEnum)[keyof typeof BatteryStatusEnum];
