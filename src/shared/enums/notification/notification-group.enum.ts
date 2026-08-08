// Sprint 6.4 — recipient groups and bulk sends.
// The numeric values track the backend enum exactly; the BE returns NUMBERS and the FE maps
// them to display labels itself.
// Uses an `as const` object + type alias — NOT TypeScript's `enum` (project convention).

/** How a group decides who its members are. */
export const NotificationGroupKindEnum = {
  /** Members listed explicitly; an admin adds and removes them by hand. */
  Static: 1,
  /**
   * Members are derived from account roles at send time. There are no member rows,
   * so the members screen is read-only.
   */
  Role: 2,
} as const;
export type NotificationGroupKindEnum =
  (typeof NotificationGroupKindEnum)[keyof typeof NotificationGroupKindEnum];

/** Where a send originated. */
export const NotificationBatchSourceEnum = {
  /** Generated automatically from a business event. */
  Event: 1,
  /** An admin pressed send in the UI. */
  Manual: 2,
} as const;
export type NotificationBatchSourceEnum =
  (typeof NotificationBatchSourceEnum)[keyof typeof NotificationBatchSourceEnum];

/** How far a send has got in fanning out to its recipients. */
export const NotificationBatchStatusEnum = {
  Pending: 1,
  FannedOut: 2,
  Failed: 3,
} as const;
export type NotificationBatchStatusEnum =
  (typeof NotificationBatchStatusEnum)[keyof typeof NotificationBatchStatusEnum];

/** What a send is aimed at. */
export const NotificationBatchTargetKindEnum = {
  Group: 1,
  User: 2,
} as const;
export type NotificationBatchTargetKindEnum =
  (typeof NotificationBatchTargetKindEnum)[keyof typeof NotificationBatchTargetKindEnum];
