import type { RoleStatusEnum } from "@/features/admin/enums/role.enum";
import type {
  LoginAttemptResult,
  AuditActionEnum,
} from "@/features/admin/enums/audit.enum";
import type {
  AccountStatusEnum,
  RefreshTokenStatus,
} from "@/shared/enums/account.enum";
export {
  RoleStatusEnum,
  RoleTypeFilter,
} from "@/features/admin/enums/role.enum";
export {
  LoginAttemptResult,
  AuditActionEnum,
} from "@/features/admin/enums/audit.enum";
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
