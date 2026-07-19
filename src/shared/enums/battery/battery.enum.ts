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
