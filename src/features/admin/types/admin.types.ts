import type {
  AccountStatusEnum,
  RefreshTokenStatus,
} from "@/shared/types/account.types";

export const RoleStatusEnum = {
  Active: 1,
  Inactive: 2,
  Deprecated: 3,
} as const;
export type RoleStatusEnum =
  (typeof RoleStatusEnum)[keyof typeof RoleStatusEnum];

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

export const AuditActionEnum = {
  LoginSuccess: 1,
  LoginFailedWrongPassword: 2,
  LoginFailedAccountLocked: 3,
  LoginFailedAccountSuspended: 4,
  LoginFailedAccountBanned: 5,
  LoginFailedAccountInactive: 6,
  LoginFailedNotVerified: 7,
  AccountAutoLocked: 8,
  Logout: 9,
  GoogleLoginSuccess: 10,
  GoogleLoginFailed: 11,
  TokenRefreshed: 12,
  TokenReuseDetected: 13,
  PasswordChanged: 20,
  PasswordReset: 21,
  OtpVerifySuccess: 22,
  OtpVerifyFailed: 23,
  EmailChangeRequested: 24,
  EmailChangeConfirmed: 25,
  PhoneVerified: 26,
  TwoFactorEnabled: 40,
  TwoFactorDisabled: 41,
  GoogleLinked: 50,
  GoogleUnlinked: 51,
  AccountRegistered: 60,
  AccountCreatedByAdmin: 61,
  AccountUpdated: 62,
  AccountStatusChanged: 63,
  AccountUnlocked: 64,
  AccountDeactivated: 65,
  AccountDeleted: 66,
  AccountInviteSent: 67,
  AccountInviteAccepted: 68,
  SessionRevoked: 80,
  AllSessionsRevoked: 81,
  AdminForceLogout: 82,
  SessionLimitExceededOldestRevoked: 83,
  RoleAssigned: 90,
  RoleRevoked: 91,
  RoleTemporaryAssigned: 92,
  RoleCreated: 93,
  RoleUpdated: 94,
  RoleStatusChanged: 95,
  RoleDeleted: 96,
  PermissionGranted: 97,
  PermissionRevoked: 98,
} as const;
export type AuditActionEnum =
  (typeof AuditActionEnum)[keyof typeof AuditActionEnum];

// ── DTOs ──

export interface RoleDto {
  id: string;
  name: string;
  normalizedName: string;
  description?: string;
  status: RoleStatusEnum;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  description?: string;
  isSystemPermission: boolean;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  issuedAt: string;
  expiredAt: string;
  status: RefreshTokenStatus;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  revokedAt?: string;
  revokedReason?: string;
  isCurrent: boolean;
}

export interface LoginAttemptDto {
  id: string;
  accountId?: string;
  attemptedEmail: string;
  result: LoginAttemptResult;
  resultName: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  note?: string;
  createdAt: string;
}

export interface AuditLogDto {
  id: string;
  action: AuditActionEnum;
  actionName: string;
  targetAccountId?: string;
  targetEmail?: string;
  actorAccountId?: string;
  isSuccess: boolean;
  reason?: string;
  metadataJson?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  correlationId?: string;
  createdAt: string;
}

// ── Nhóm 5 Payloads ──

export interface GetAccountsParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  status?: AccountStatusEnum;
  roleId?: string;
  emailConfirmed?: boolean;
}

export interface CreateAccountPayload {
  email: string;
  fullName: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  roleId: string;
}

export interface InviteAccountPayload {
  email: string;
  fullName: string;
  phoneNumber?: string;
  roleId: string;
}

export interface UpdateAccountPayload {
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface ChangeAccountStatusPayload {
  status: AccountStatusEnum;
  reason?: string;
}

export interface ChangeAccountRolePayload {
  roleId: string;
}

export interface AdminRevokeAllSessionsPayload {
  reason?: string;
}

export interface GetLoginHistoryParams {
  pageNumber?: number;
  pageSize?: number;
  result?: LoginAttemptResult;
  onlyFailed?: boolean;
  fromUtc?: string;
  toUtc?: string;
}

export interface GetAccountSessionsParams {
  activeOnly?: boolean;
}

// ── Nhóm 6 Payloads ──

export interface UpdateStaffProfilePayload {
  employeeCode?: string;
  department?: string;
  maxConcurrentTickets: number;
  isAvailable: boolean;
  notes?: string;
}

export interface AddSkillPayload {
  skillCode: string;
  skillLevel: number;
  certifiedUntil?: string;
}

// ── Nhóm 7 Payloads ──

export interface GetRolesParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  status?: RoleStatusEnum;
  isSystemRole?: boolean;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export type UpdateRolePayload = CreateRolePayload;

export interface ChangeRoleStatusPayload {
  status: RoleStatusEnum;
}

// ── Nhóm 8 Payloads ──

export interface SetPermissionsPayload {
  permissionIds: string[];
  allowSystemRole?: boolean;
}

// ── Nhóm 9 Params ──

export interface GetAuditLogsParams {
  pageNumber?: number;
  pageSize?: number;
  action?: AuditActionEnum;
  targetAccountId?: string;
  actorAccountId?: string;
  isSuccess?: boolean;
  fromUtc?: string;
  toUtc?: string;
}
