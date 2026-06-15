export const RoleStatusEnum = {
  Active: 1,
  Inactive: 2,
  Deprecated: 3,
} as const;
export type RoleStatusEnum =
  (typeof RoleStatusEnum)[keyof typeof RoleStatusEnum];

export const RoleTypeFilter = {
  All: "all",
  System: "system",
  Custom: "custom",
} as const;
export type RoleTypeFilter =
  (typeof RoleTypeFilter)[keyof typeof RoleTypeFilter];
