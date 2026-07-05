export const WarrantyStatusEnum = {
  ACTIVE: 1,
  EXPIRED: 2,
  VOID: 3,
} as const;
export type WarrantyStatusEnum =
  (typeof WarrantyStatusEnum)[keyof typeof WarrantyStatusEnum];
