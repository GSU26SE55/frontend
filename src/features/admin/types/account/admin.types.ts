import type { RoleStatusEnum } from "@/features/admin/enums/role.enum";
import type {
  LoginAttemptResult,
  AuditActionEnum,
} from "@/features/admin/enums/audit.enum";
import type { AccountStatusEnum } from "@/shared/enums/account/account.enum";
import type { StaffProfileDto } from "@/shared/types/account/account.types";
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

// PermissionDto dùng chung — nguồn thật ở shared.
export type { PermissionDto } from "@/shared/types/account/permission.types";

// SessionDto dùng chung — nguồn thật ở shared.
export type { SessionDto } from "@/shared/types/account/session.types";

// LoginAttemptDto dùng chung — nguồn thật ở shared.
export type { LoginAttemptDto } from "@/shared/types/ticket/login-attempt.types";

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
  sortBy?: string;
  sortDir?: string;
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

// #AUTH-47: POST /api/admin/accounts/{primaryId}/merge — body { secondaryAccountId, reason }
export interface MergeAccountPayload {
  secondaryAccountId: string;
  reason: string;
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

// = Pick<StaffProfileDto, ...> — cùng field, không viết lại.
export type UpdateStaffProfilePayload = Pick<
  StaffProfileDto,
  | "employeeCode"
  | "department"
  | "maxConcurrentTickets"
  | "isAvailable"
  | "skillTier"
  | "notes"
>;

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

// GET /api/admin/audit-logs/by-account/{accountId} — chỉ nhận 4 query param này
export interface GetAuditLogsByAccountParams {
  pageNumber?: number;
  pageSize?: number;
  action?: AuditActionEnum;
  isSuccess?: boolean;
}
