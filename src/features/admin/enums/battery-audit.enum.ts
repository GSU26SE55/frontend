// Action code cho audit log Pin & Cảnh báo (battery-specific) — docs/api-battery.md §Audit (2774, 2790).
// Dùng làm option cho filter `action` (dropdown closed-set, KHÔNG free-text — BE exact-match case-sensitive).

export const BatteryAuditActionCode = {
  BatteryCreated: "BatteryCreated",
  BatteryUpdated: "BatteryUpdated",
  BatteryDeleted: "BatteryDeleted",
  AssignedToCustomer: "AssignedToCustomer",
  UnassignedFromCustomer: "UnassignedFromCustomer",
  ThresholdConfigChanged: "ThresholdConfigChanged",
  SensorReadingEdited: "SensorReadingEdited",
  StatusChanged: "StatusChanged",
  MaintenanceLogged: "MaintenanceLogged",
  CalibrationApplied: "CalibrationApplied",
} as const;
export type BatteryAuditActionCode =
  (typeof BatteryAuditActionCode)[keyof typeof BatteryAuditActionCode];

export const AlertAuditActionCode = {
  AlertAcknowledged: "AlertAcknowledged",
  AlertSuppressed: "AlertSuppressed",
  AlertRuleChanged: "AlertRuleChanged",
  AlertSeverityOverridden: "AlertSeverityOverridden",
  AlertManuallyResolved: "AlertManuallyResolved",
} as const;
export type AlertAuditActionCode =
  (typeof AlertAuditActionCode)[keyof typeof AlertAuditActionCode];
