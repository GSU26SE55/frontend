# Plan — GH-30: Admin Account Management — Nhóm 5, 6, 7, 8, 9

## Metadata
- **Status:** SHIPPED | **Role:** FE | **Ngày:** 2026-05-20
- **Issue:** #30 — https://github.com/GSU26SE55/frontend/issues/30
- **Sprint:** Sprint 1 (due: 2026-05-30)

## Mục tiêu

Implement **data layer** (types, endpoints, services, hooks) cho 5 nhóm Admin API:
Nhóm 5 (accounts), 6 (staff profiles), 7 (roles), 8 (permissions), 9 (audit logs).
UI pages tách thành issue riêng per feature. Router giữ placeholder hiện tại.

## Scope

**Trong scope:**
- `shared/types/account.types.ts` — AccountDto, AccountProfileDto, StaffProfileDto (shape confirmed), StaffSkillDto, AccountStatusEnum, RefreshTokenStatus
- `shared/types/api.types.ts` — fix `totalCount → totalItems` cho đúng contract API
- `features/admin/types/admin.types.ts` — RoleDto, PermissionDto, AuditLogDto, SessionDto, LoginAttemptDto, StaffAssignmentProfileDto giữ ở shared (cross-feature: admin + issue #28), RoleStatusEnum, AuditActionEnum (đọc đủ 40+ values từ api-auth.md), LoginAttemptResult + tất cả request payloads
- `shared/utils/endpoints.ts` — add ADMIN section
- `shared/utils/queryKeys.ts` — add KEY.admin (gồm staff) + QUERY_KEY.admin factories
- 5 service files + 5 hook files

**Ngoài scope:**
- UI pages, components, forms, dialogs
- AppLayout / Sidebar — issue riêng
- Admin routing mới — giữ nguyên placeholder `/admin/*`

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/types/api.types.ts` | modify | Fix `totalCount` → `totalItems` |
| `src/shared/types/account.types.ts` | create | AccountDto, AccountProfileDto, StaffProfileDto (shape confirmed), StaffSkillDto, StaffAssignmentProfileDto, AccountStatusEnum, RefreshTokenStatus |
| `src/features/admin/types/admin.types.ts` | create | RoleDto, PermissionDto, AuditLogDto, SessionDto, LoginAttemptDto, RoleStatusEnum, AuditActionEnum (40+ values từ api-auth.md), LoginAttemptResult + tất cả payloads |
| `src/shared/utils/endpoints.ts` | modify | Add ADMIN.ACCOUNTS / STAFF / ROLES / PERMISSIONS / AUDIT_LOGS |
| `src/shared/utils/queryKeys.ts` | modify | Add KEY.admin (incl. staff) + QUERY_KEY.admin factories |
| `src/features/admin/services/admin-accounts.service.ts` | create | 11 functions Nhóm 5 |
| `src/features/admin/services/admin-staff.service.ts` | create | 3 functions Nhóm 6 |
| `src/features/admin/services/admin-roles.service.ts` | create | 6 functions Nhóm 7 |
| `src/features/admin/services/admin-permissions.service.ts` | create | 3 functions Nhóm 8 |
| `src/features/admin/services/admin-audit-logs.service.ts` | create | 1 function Nhóm 9 |
| `src/features/admin/hooks/useAdminAccounts.ts` | create | 11 hooks Nhóm 5 |
| `src/features/admin/hooks/useAdminStaff.ts` | create | 3 mutation hooks Nhóm 6 |
| `src/features/admin/hooks/useAdminRoles.ts` | create | 6 hooks Nhóm 7 |
| `src/features/admin/hooks/useAdminPermissions.ts` | create | 3 hooks Nhóm 8 |
| `src/features/admin/hooks/useAdminAuditLogs.ts` | create | 1 query hook Nhóm 9 |

## Types

### `shared/types/account.types.ts`

```ts
export enum AccountStatusEnum {
  PendingVerification = 0,
  Active = 1,
  Locked = 2,
  Inactive = 3,
  Suspended = 4,
  Banned = 5,
}

export enum RefreshTokenStatus {
  Active = 1, Used = 2, Revoked = 3, Expired = 4, Compromised = 5,
}

export interface AccountProfileDto {
  accountId: string;
  avatarFileId?: string;
  externalAvatarUrl?: string;
  avatarSource: number;
  address?: string;
  birthDate?: string;
  timeZone?: string;
}

export interface StaffSkillDto {
  skillCode: string;
  skillLevel: number;
  certifiedUntil?: string;
}

export interface StaffProfileDto {
  accountId: string;
  employeeCode?: string;   // nullable theo API doc
  department?: string;     // nullable theo API doc
  maxConcurrentTickets: number;
  isAvailable: boolean;
  notes?: string;          // nullable theo API doc
  skills: StaffSkillDto[];
}

export interface AccountDto {
  id: string;
  email: string;
  phoneNumber?: string;
  fullName: string;
  /** @deprecated legacy direct URL — KHÔNG dùng để render, dùng displayAvatarUrl */
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  twoFactorEnabled: boolean;
  status: AccountStatusEnum;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  roleId: string;           // 1 role duy nhất — quan hệ 1-N (không phải roles: string[])
  role: string;             // PascalCase từ BE — FE .toUpperCase() khi cần so sánh
  roleAssignedAt?: string;
  roleAssignedBy?: string;  // null nếu gán lúc tạo account
  profile?: AccountProfileDto;
  staffProfile?: StaffProfileDto;
  displayAvatarUrl?: string; // dùng field này để render avatar trong <img src>
}

// Giữ trong shared vì cross-feature: admin (Nhóm 6) + auth profile (GH-28, GET /api/staff)
export interface StaffAssignmentProfileDto {
  accountId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  department?: string;
  maxConcurrentTickets: number;
  isAvailable: boolean;
  displayAvatarUrl?: string;
  skills: StaffSkillDto[];
}
```

### `features/admin/types/admin.types.ts`

```ts
import type { AccountStatusEnum, RefreshTokenStatus } from '@/shared/types/account.types';

export enum RoleStatusEnum { Active = 1, Inactive = 2, Deprecated = 3 }

export enum LoginAttemptResult {
  Success = 1, WrongPassword = 2, AccountNotFound = 3,
  AccountLocked = 4, AccountSuspended = 5, AccountBanned = 6,
  AccountInactive = 7, AccountNotVerified = 8,
}

// Đọc đủ 40+ values từ api-auth.md khi implement Bước 3
export enum AuditActionEnum {
  LoginSuccess = 1, LoginFailedWrongPassword = 2, LoginFailedAccountLocked = 3,
  LoginFailedAccountSuspended = 4, LoginFailedAccountBanned = 5,
  LoginFailedAccountInactive = 6, LoginFailedNotVerified = 7,
  AccountAutoLocked = 8, Logout = 9, GoogleLoginSuccess = 10,
  GoogleLoginFailed = 11, TokenRefreshed = 12, TokenReuseDetected = 13,
  PasswordChanged = 20, PasswordReset = 21, OtpVerifySuccess = 22,
  OtpVerifyFailed = 23, EmailChangeRequested = 24, EmailChangeConfirmed = 25,
  PhoneVerified = 26, TwoFactorEnabled = 40, TwoFactorDisabled = 41,
  GoogleLinked = 50, GoogleUnlinked = 51, AccountRegistered = 60,
  AccountCreatedByAdmin = 61, AccountUpdated = 62, AccountStatusChanged = 63,
  AccountUnlocked = 64, AccountDeactivated = 65, AccountDeleted = 66,
  AccountInviteSent = 67, AccountInviteAccepted = 68, SessionRevoked = 80,
  AllSessionsRevoked = 81, AdminForceLogout = 82,
  SessionLimitExceededOldestRevoked = 83, RoleAssigned = 90, RoleRevoked = 91,
  RoleTemporaryAssigned = 92, RoleCreated = 93, RoleUpdated = 94,
  RoleStatusChanged = 95, RoleDeleted = 96, PermissionGranted = 97,
  PermissionRevoked = 98,
}

// DTOs
export interface RoleDto {
  id: string; name: string; normalizedName: string; description?: string;
  status: RoleStatusEnum; isSystemRole: boolean; createdAt: string; updatedAt?: string;
}
export interface PermissionDto {
  id: string; code: string; module: string; description?: string;
  isSystemPermission: boolean; createdAt: string;
}
export interface SessionDto {
  id: string; issuedAt: string; expiredAt: string; status: RefreshTokenStatus;
  ipAddress?: string; userAgent?: string; deviceId?: string;
  revokedAt?: string; revokedReason?: string; isCurrent: boolean;
}
export interface LoginAttemptDto {
  id: string; accountId?: string; attemptedEmail: string;
  result: LoginAttemptResult; resultName: string; method: string;
  ipAddress?: string; userAgent?: string; deviceId?: string; note?: string; createdAt: string;
}
export interface AuditLogDto {
  id: string; action: AuditActionEnum; actionName: string;
  targetAccountId?: string; targetEmail?: string; actorAccountId?: string;
  isSuccess: boolean; reason?: string; metadataJson?: string;
  ipAddress?: string; userAgent?: string; deviceId?: string;
  correlationId?: string; createdAt: string;
}

// ── Nhóm 5 — Payloads ──
export interface GetAccountsParams {
  pageNumber?: number; pageSize?: number; keyword?: string;
  status?: AccountStatusEnum; roleId?: string; emailConfirmed?: boolean;
}
export interface CreateAccountPayload {
  email: string; fullName: string; password: string;
  phoneNumber?: string; dateOfBirth?: string; address?: string;
  roleId: string; // bắt buộc — scalar Guid (1 role/account, quan hệ 1-N)
}
export interface InviteAccountPayload {
  email: string; fullName: string; phoneNumber?: string;
  roleId: string; // bắt buộc — scalar Guid (1 role/account, quan hệ 1-N)
}
export interface UpdateAccountPayload {
  fullName: string; phoneNumber?: string; avatarUrl?: string;
  dateOfBirth?: string; address?: string;
}
export interface ChangeAccountStatusPayload { status: AccountStatusEnum; reason?: string; }
export interface RevokeAllSessionsPayload { reason?: string; }
export interface GetLoginHistoryParams {
  pageNumber?: number; pageSize?: number; result?: LoginAttemptResult;
  onlyFailed?: boolean; fromUtc?: string; toUtc?: string;
}
export interface GetAccountSessionsParams { activeOnly?: boolean; }

// ── Nhóm 6 — Payloads ──
export interface UpdateStaffProfilePayload {
  employeeCode?: string; department?: string;
  maxConcurrentTickets: number; isAvailable: boolean; notes?: string;
}
export interface AddSkillPayload { skillCode: string; skillLevel: number; certifiedUntil?: string; }

// ── Nhóm 7 — Payloads ──
export interface GetRolesParams {
  pageNumber?: number; pageSize?: number;
  keyword?: string; status?: RoleStatusEnum; isSystemRole?: boolean;
}
export interface CreateRolePayload { name: string; description?: string; }
export type UpdateRolePayload = CreateRolePayload;
export interface ChangeRoleStatusPayload { status: RoleStatusEnum; }

// ── Nhóm 8 — Payloads ──
export interface SetPermissionsPayload { permissionIds: string[]; allowSystemRole?: boolean; }

// ── Nhóm 9 — Params ──
export interface GetAuditLogsParams {
  pageNumber?: number; pageSize?: number; action?: AuditActionEnum;
  targetAccountId?: string; actorAccountId?: string;
  isSuccess?: boolean; fromUtc?: string; toUtc?: string;
}
```

## Endpoints

```ts
ADMIN: {
  ACCOUNTS: {
    LIST:          '/api/admin/accounts',
    DETAIL:        (id: string) => `/api/admin/accounts/${id}`,
    CREATE:        '/api/admin/accounts',
    INVITE:        '/api/admin/accounts/invite',
    UPDATE:        (id: string) => `/api/admin/accounts/${id}`,
    STATUS:        (id: string) => `/api/admin/accounts/${id}/status`,
    UNLOCK:        (id: string) => `/api/admin/accounts/${id}/unlock`,
    DELETE:        (id: string) => `/api/admin/accounts/${id}`,
    SESSIONS:      (id: string) => `/api/admin/accounts/${id}/sessions`,
    REVOKE_ALL:    (id: string) => `/api/admin/accounts/${id}/sessions/revoke-all`,
    LOGIN_HISTORY: (id: string) => `/api/admin/accounts/${id}/login-history`,
  },
  STAFF: {
    PROFILE: (id: string) => `/api/admin/staff/${id}/profile`,
    SKILLS:  (id: string) => `/api/admin/staff/${id}/skills`,
    SKILL:   (id: string, skillCode: string) => `/api/admin/staff/${id}/skills/${skillCode}`,
  },
  ROLES: {
    LIST:   '/api/admin/roles',
    DETAIL: (id: string) => `/api/admin/roles/${id}`,
    CREATE: '/api/admin/roles',
    UPDATE: (id: string) => `/api/admin/roles/${id}`,
    STATUS: (id: string) => `/api/admin/roles/${id}/status`,
    DELETE: (id: string) => `/api/admin/roles/${id}`,
  },
  PERMISSIONS: {
    LIST:         '/api/admin/permissions',
    // GET và PUT cùng path — phân biệt bằng method trong service (axios.get vs axios.put)
    BY_ROLE:      (roleId: string) => `/api/admin/roles/${roleId}/permissions`,
    SET_FOR_ROLE: (roleId: string) => `/api/admin/roles/${roleId}/permissions`,
  },
  AUDIT_LOGS: {
    LIST: '/api/admin/audit-logs',
  },
}
```

**Endpoints table:**

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/admin/accounts` | `GetAccountsParams` (query) | `CommonResponse<PaginationResponse<AccountDto>>` |
| GET | `/api/admin/accounts/{id}` | — | `CommonResponse<AccountDto>` |
| POST | `/api/admin/accounts` | `CreateAccountPayload` | `CommonResponse<string>` (Guid) |
| POST | `/api/admin/accounts/invite` | `InviteAccountPayload` | `CommonResponse<string>` (Guid của account vừa tạo, trạng thái PendingVerification) |
| PUT | `/api/admin/accounts/{id}` | `UpdateAccountPayload` | `CommonResponse<string>` (Guid) |
| PATCH | `/api/admin/accounts/{id}/status` | `ChangeAccountStatusPayload` | `CommonResponse<unknown>` |
| POST | `/api/admin/accounts/{id}/unlock` | — | `CommonResponse<unknown>` |
| DELETE | `/api/admin/accounts/{id}` | — | `CommonResponse<unknown>` |
| GET | `/api/admin/accounts/{id}/sessions` | `GetAccountSessionsParams` (query) | `CommonResponse<SessionDto[]>` |
| POST | `/api/admin/accounts/{id}/sessions/revoke-all` | `RevokeAllSessionsPayload` | `CommonResponse<number>` |
| GET | `/api/admin/accounts/{id}/login-history` | `GetLoginHistoryParams` (query) | `CommonResponse<PaginationResponse<LoginAttemptDto>>` |
| PUT | `/api/admin/staff/{id}/profile` | `UpdateStaffProfilePayload` | `CommonResponse<string>` (Guid) |
| POST | `/api/admin/staff/{id}/skills` | `AddSkillPayload` | `CommonResponse<string>` (Guid) |
| DELETE | `/api/admin/staff/{id}/skills/{skillCode}` | — | `CommonResponse<unknown>` |
| GET | `/api/admin/roles` | `GetRolesParams` (query) | `CommonResponse<PaginationResponse<RoleDto>>` |
| GET | `/api/admin/roles/{id}` | — | `CommonResponse<RoleDto>` |
| POST | `/api/admin/roles` | `CreateRolePayload` | `CommonResponse<string>` (Guid) |
| PUT | `/api/admin/roles/{id}` | `UpdateRolePayload` | `CommonResponse<string>` (Guid) |
| PATCH | `/api/admin/roles/{id}/status` | `ChangeRoleStatusPayload` | `CommonResponse<unknown>` |
| DELETE | `/api/admin/roles/{id}` | — | `CommonResponse<unknown>` |
| GET | `/api/admin/permissions` | `{ module?: string }` (query) | `CommonResponse<PermissionDto[]>` |
| GET | `/api/admin/roles/{roleId}/permissions` | — | `CommonResponse<PermissionDto[]>` |
| PUT | `/api/admin/roles/{roleId}/permissions` | `SetPermissionsPayload` | `CommonResponse<unknown>` |
| GET | `/api/admin/audit-logs` | `GetAuditLogsParams` (query) | `CommonResponse<PaginationResponse<AuditLogDto>>` |

## Query Keys

```ts
export const KEY = {
  admin: {
    accounts:    ['admin', 'accounts'] as const,
    staff:       ['admin', 'staff'] as const,       // cần thiết để invalidate sau staff mutations
    roles:       ['admin', 'roles'] as const,
    permissions: ['admin', 'permissions'] as const,
    auditLogs:   ['admin', 'auditLogs'] as const,
  },
} as const;

export const QUERY_KEY = {
  admin: {
    accounts: {
      list:         (params?: GetAccountsParams) => [...KEY.admin.accounts, 'list', params],
      detail:       (id: string) => [...KEY.admin.accounts, 'detail', id],
      sessions:     (id: string) => [...KEY.admin.accounts, 'sessions', id],
      loginHistory: (id: string, params?: GetLoginHistoryParams) =>
                      [...KEY.admin.accounts, 'loginHistory', id, params],
    },
    staff: {
      profile: (accountId: string) => [...KEY.admin.staff, 'profile', accountId],
    },
    roles: {
      list:        (params?: GetRolesParams) => [...KEY.admin.roles, 'list', params],
      detail:      (id: string) => [...KEY.admin.roles, 'detail', id],
      permissions: (roleId: string) => [...KEY.admin.roles, 'permissions', roleId],
    },
    permissions: {
      list: (module?: string) => [...KEY.admin.permissions, 'list', module],
    },
    auditLogs: {
      list: (params?: GetAuditLogsParams) => [...KEY.admin.auditLogs, 'list', params],
    },
  },
} as const;
```

## Approach

- Service files import axios từ `shared/lib/axios.ts`, endpoints từ `ENDPOINTS.ADMIN.*`
- Hooks import service tương ứng + query keys từ `QUERY_KEY.admin.*`
- Query staleTime: default 2 phút (theo QueryClient config trong App.tsx)
- Mutation `onSuccess` strategy:
  - Account mutations → invalidate `KEY.admin.accounts`
  - Staff mutations → invalidate `KEY.admin.staff` + `QUERY_KEY.admin.accounts.detail(id)` (vì AccountDto embed staffProfile)
  - Role mutations → invalidate `KEY.admin.roles`
  - Permissions PUT → invalidate `QUERY_KEY.admin.roles.permissions(roleId)` + `KEY.admin.permissions`
- `StaffAssignmentProfileDto` giữ trong `shared/types` — cross-feature với GH-28 (`GET /api/staff`)
- `StaffProfileDto` confirmed: `accountId`, `employeeCode`, `department`, `maxConcurrentTickets`, `isAvailable`, `notes`, `skills[]` (non-optional). Không có `displayAvatarUrl`.

## Workflow

Ticket này chỉ implement data layer (types, services, hooks) — không có UI pages hay user flow. Workflow sẽ được bổ sung ở các issue UI riêng per feature (account list page, role management page, audit log page...).

**Invalidation strategy cho mutations:**
- Account mutations → `invalidateQueries({ queryKey: KEY.admin.accounts })`
- Staff mutations → `invalidateQueries({ queryKey: KEY.admin.staff })` + `invalidateQueries({ queryKey: QUERY_KEY.admin.accounts.detail(id) })` (vì `AccountDto` embed `staffProfile`)
- Role mutations → `invalidateQueries({ queryKey: KEY.admin.roles })`
- Permissions PUT → `invalidateQueries({ queryKey: QUERY_KEY.admin.roles.permissions(roleId) })` + `invalidateQueries({ queryKey: KEY.admin.permissions })`
- Audit logs — read-only, không có mutation

## Edge Cases & Error Handling

| Case | Xử lý |
|------|-------|
| `AccountStatusEnum.PendingVerification = 0` | Treat là giá trị hợp lệ, không coi là falsy/missing |
| `DELETE /api/admin/accounts/{id}` trả `409` | `onError` → `handleErrorApi({ error })` → toast.error (hook không cần logic đặc biệt, BE chưa enforce) |
| `PUT /api/admin/roles/{roleId}/permissions` với `permissionIds: []` | Replace semantics — xóa hết; hook expose thẳng, UI page (issue riêng) chịu trách nhiệm fetch-before-save |
| `PERMISSIONS.BY_ROLE` và `SET_FOR_ROLE` cùng path | Phân biệt bằng method: `axios.get` vs `axios.put` — comment trong service file |
| `InviteAccountPayload` response | `CommonResponse<string>` — `data` là Guid (confirmed từ api-auth.md line 1216–1225: response trả Guid của account PendingVerification) |

## Success Criteria

| Tiêu chí | Cách verify |
|----------|------------|
| `PaginationResponse.totalItems` đúng tên field | `tsc --noEmit` → 0 errors |
| Types compile không lỗi | `tsc --noEmit` → 0 errors |
| Lint sạch | `eslint --max-warnings=0` |
| Build pass | `npm run build` → success |
| Cross-feature import clean | ESLint no-restricted-imports → 0 violations |
| KEY.admin.staff tồn tại | Grep trong queryKeys.ts |

## Steps

- [x] Bước 1: Fix `totalCount → totalItems` trong `src/shared/types/api.types.ts` — 2026-05-19
- [x] Bước 2: Tạo `src/shared/types/account.types.ts` — 2026-05-19
- [x] Bước 3: Tạo `src/features/admin/types/admin.types.ts` — 2026-05-19
- [x] Bước 4: Update `src/shared/utils/endpoints.ts` — add ADMIN section — 2026-05-19
- [x] Bước 5: Update `src/shared/utils/queryKeys.ts` — add KEY.admin + QUERY_KEY.admin — 2026-05-19
- [x] Bước 6: Tạo 5 service files — 2026-05-19
- [x] Bước 7: Tạo 5 hook files — 2026-05-19
- [x] Bước 8: `tsc --noEmit` + `pnpm run build` → PASS — 2026-05-19

## Câu hỏi đã giải đáp

| Câu hỏi | Trả lời |
|---------|---------|
| UI scope? | Data layer only — UI tách issue riêng per feature |
| AppLayout trong scope? | Không — issue riêng; router placeholder giữ nguyên |
| Admin routing trong scope? | Không thay đổi — `/admin/*` placeholder giữ nguyên |
| KEY.admin.staff có cần không? | Có — cần để invalidate đúng sau staff mutations (stale data bug nếu thiếu) |
| StaffAssignmentProfileDto ở shared/ hay admin/? | shared/ — cross-feature với GH-28 (GET /api/staff) |
| InviteAccountPayload response shape? | `CommonResponse<string>` — `data` là Guid của account vừa tạo (trạng thái PendingVerification). Confirmed từ api-auth.md line 1216–1225. |
| StaffProfileDto shape confirmed? | Confirmed từ api-auth.md: `accountId` (non-optional), `employeeCode?`, `department?`, `maxConcurrentTickets`, `isAvailable`, `notes?`, `skills[]`. `employeeCode`, `department`, `notes` là **nullable**. Không có `displayAvatarUrl` (field đó chỉ có ở `StaffAssignmentProfileDto`). |
