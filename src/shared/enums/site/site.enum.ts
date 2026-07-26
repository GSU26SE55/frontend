export const SiteStatusEnum = {
  Active: 1,
  UnderMaintenance: 2,
  Decommissioned: 3,
} as const;
export type SiteStatusEnum =
  (typeof SiteStatusEnum)[keyof typeof SiteStatusEnum];
