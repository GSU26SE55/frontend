// Audit — Severity & ActionCategory dùng chung CROSS-SERVICE (api-audit.md §67/§76).
// BE serialize dạng string name → enum string-valued. Đối chiếu exact-match, phân biệt hoa-thường.

// LoginAttemptResult — dùng chung admin (audit) + auth (login history).
// Nâng lên shared để 2 feature không import chéo nhau.
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

// 9 category cố định cross-service (api-audit.md §76).
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
