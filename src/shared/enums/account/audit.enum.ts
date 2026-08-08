// Audit — Severity & ActionCategory are shared CROSS-SERVICE (api-audit.md §67/§76).
// The BE serializes them as string names → string-valued enums. Compare by exact,
// case-sensitive match.

// LoginAttemptResult — shared by admin (audit) + auth (login history).
// Promoted to shared so the two features don't import from each other.
export const LoginAttemptResult = {
  Success: 1,
  WrongPassword: 2,
  AccountNotFound: 3,
  AccountLocked: 4,
  AccountSuspended: 5,
  AccountBanned: 6,
  AccountInactive: 7,
  AccountNotVerified: 8,
} as const;
export type LoginAttemptResult =
  (typeof LoginAttemptResult)[keyof typeof LoginAttemptResult];

export const AuditSeverity = {
  Info: "Info",
  Warning: "Warning",
  Critical: "Critical",
  Security: "Security",
} as const;
export type AuditSeverity = (typeof AuditSeverity)[keyof typeof AuditSeverity];

// 9 fixed cross-service categories (api-audit.md §76).
export const AuditActionCategory = {
  Authentication: "Authentication",
  Authorization: "Authorization",
  AccountManagement: "AccountManagement",
  DataModification: "DataModification",
  DataAccess: "DataAccess",
  Configuration: "Configuration",
  Security: "Security",
  Communication: "Communication",
  System: "System",
} as const;
export type AuditActionCategory =
  (typeof AuditActionCategory)[keyof typeof AuditActionCategory];
