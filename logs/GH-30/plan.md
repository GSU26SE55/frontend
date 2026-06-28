# Plan — GH-30: Admin Account Management — Nhóm 5, 6, 7, 8, 9

## Metadata
- **Status:** SHIPPED → **NEEDS REWORK (GH-295 + plan↔code drift)** | **Role:** FE | **Ngày:** 2026-05-20, cập nhật 2026-06-14
- **Issue:** #30 — https://github.com/GSU26SE55/frontend/issues/30
- **Sprint:** Sprint 1 (due: 2026-05-30)

---

## ⚠️ GH-295 + Codebase Drift (2026-06-14) — SỬA TRƯỚC KHI FIX CODE

> SHIPPED 2026-05-20. **Đã đối chiếu codebase** — phát hiện plan ghi nhiều thứ mà CODE KHÔNG implement (plan sai, code đúng doc) và ngược lại. Phần Types/Endpoints cũ phía dưới giữ để tham chiếu; điểm sai đánh dấu bên dưới.

### C1 — 🔴 `skillTier` CÓ trong doc/BE (plan ĐÚNG, code THIẾU) — REVERSED 2026-06-15

> **Đối chiếu lại với `api-auth.md` + BE code (UpdateStaffProfileCommand.cs:22):** `skillTier` (int, 1–3, mặc định 1, `StaffSkillTierEnum`) **CÓ THẬT** trong body `PUT /api/admin/staff/{id}/profile`. Kết luận drift cũ ("code đúng, plan sai") là SAI — đã đảo lại.
- **Plan ĐÚNG:** giữ `skillTier: number` trong `StaffProfileDto` + `UpdateStaffProfilePayload`.
- **Code THIẾU:** `account.types.ts` `StaffProfileDto` chưa có `skillTier` → **phải thêm** field này vào type + payload + form UI (GH-64).
- → **Sửa CODE (không sửa plan):** thêm `skillTier` vào `StaffProfileDto`, `UpdateStaffProfilePayload`, và gửi kèm khi PUT.

### C2 — 🔴 `GET /api/admin/audit-logs/by-account/{accountId}` CÓ trong doc/BE (plan ĐÚNG, code THIẾU) — REVERSED 2026-06-15

> **Đối chiếu lại với `api-auth.md` §Nhóm 9 + BE code (AdminAuditLogsController.cs:107):** endpoint `GET /api/admin/audit-logs/by-account/{accountId}` **CÓ THẬT** (Admin-only, query `pageNumber/pageSize/action/isSuccess`). Kết luận drift cũ ("404, không tồn tại") là SAI — đã đảo lại.
- **Plan ĐÚNG:** giữ `AUDIT_LOGS.BY_ACCOUNT` + mục endpoint.
- **Code THIẾU:** `endpoints.ts AUDIT_LOGS` chỉ có `LIST` → **phải thêm** `BY_ACCOUNT` + service + hook.
- → **Sửa CODE (không sửa plan):** thêm `BY_ACCOUNT: (accountId) => '/api/admin/audit-logs/by-account/${accountId}'` + `adminAuditLogsByAccount(accountId, params)` + hook `useAdminAuditLogsByAccount`.

### C3 — 🔴 Thiếu `DELETE /api/admin/accounts/{id}/2fa` (admin reset 2FA — GH-295)

- Doc [api-auth.md §`DELETE /api/admin/accounts/{id}/2fa`](../../docs/api-auth.md): Admin reset 2FA của user (clear secret + backup codes). Auth **Admin only**.
- **Code (verified):** không có trong `endpoints.ts ADMIN.ACCOUNTS` (chỉ tới `ROLE` dòng 131) lẫn `admin-accounts.service.ts`.
- → **Thêm:** `ADMIN.ACCOUNTS.RESET_2FA: (id) => '/api/admin/accounts/${id}/2fa'` + service `adminReset2fa(id)` (DELETE) + hook `useAdminReset2fa` + nút "Reset 2FA" trong AccountsPage (GH-64). Response `CommonResponse<Guid>`, idempotent.

### C4 — 🟠 `AuditActionEnum` thiếu actions 2FA mới (GH-295)

- **Plan/Code:** `AuditActionEnum` ([Types dòng 159-177](#features-admintypesadmintypests)) dừng ở `PermissionRevoked=98`, **thiếu** nhóm 2FA mới của doc ([api-auth.md §AuditActionEnum](../../docs/api-auth.md)):
  `TwoFactorReset=42, BackupCodeRedeemed=43, BackupCodesRegenerated=44, Admin2FAReset=45, LoginWith2FA=46, LoginPending2FA=47`.
- → **Thêm** 6 value này vào `features/admin/enums/audit.enum.ts` để `AuditLogsPage` filter/hiển thị đúng action mới.

### C5 — ✅ `totalItems` — code FE + BE + doc khớp (RESOLVED)

- **BE (verified):** `SharedContracts/.../PaginationResponse.cs:6` → `TotalItems` → JSON `totalItems`.
- **Code FE (verified):** `api.types.ts:15` `totalItems` → **khớp BE.** GH-30 Bước 1 đổi `totalCount → totalItems` là **đúng**.
- **Doc (đã sửa 2026-06-15):** `api-auth.md` PaginationResponse nay dùng `totalItems`. Cả 3 phía khớp — không còn action.

### C6 — 🟢 `UpdateAccountPayload.avatarUrl` (legacy, deprecated Sprint 5)

Doc [api-auth.md §`PUT /api/admin/accounts/{id}`](../../docs/api-auth.md): `avatarUrl` là legacy field, **sẽ bị xóa sau FileStorage integration (Sprint 5)**. Plan/code đang giữ — OK tạm, nhưng đánh dấu deprecated, FE render avatar bằng `displayAvatarUrl`.

### C7 — 🟡 Auth role per-endpoint (cho UI gating GH-64) — BE-verified 2026-06-15

Data layer không gate, nhưng UI (GH-64) phải `checkRole` đúng. Theo `[Authorize(Roles=...)]` thực tế:
- **Admin + Manager:** `GET /accounts`, `GET /accounts/{id}`, `GET /accounts/{id}/sessions`, `GET /accounts/{id}/login-history`, `POST /accounts/{id}/unlock`, `GET /roles`, `GET /roles/{id}`.
- **Admin only:** mọi mutation account (`POST/PUT/PATCH/DELETE /accounts/*`, `/role`, `/2fa`, `revoke-all`), tất cả mutation role, toàn bộ `/permissions`, **toàn bộ `/audit-logs` (kể cả GET — Manager KHÔNG xem được)**.
- ⚠️ Lưu ý ngược trực giác: audit-logs **Admin-only** (không phải Admin+Manager); `GET /accounts/{id}/sessions` **Admin+Manager** (không phải Admin-only).

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
| `src/features/admin/services/admin-accounts.service.ts` | create | 12 functions Nhóm 5 (gồm `adminReset2fa` — DELETE /{id}/2fa, C3) |
| `src/features/admin/services/admin-staff.service.ts` | create | 3 functions Nhóm 6 |
| `src/features/admin/services/admin-roles.service.ts` | create | 6 functions Nhóm 7 |
| `src/features/admin/services/admin-permissions.service.ts` | create | 3 functions Nhóm 8 |
| `src/features/admin/services/admin-audit-logs.service.ts` | create | 2 functions Nhóm 9 (`list` + `byAccount` — C2) |
| `src/features/admin/hooks/useAdminAccounts.ts` | create | 12 hooks Nhóm 5 (gồm `useAdminReset2fa` — C3) |
| `src/features/admin/hooks/useAdminStaff.ts` | create | 3 mutation hooks Nhóm 6 |
| `src/features/admin/hooks/useAdminRoles.ts` | create | 6 hooks Nhóm 7 |
| `src/features/admin/hooks/useAdminPermissions.ts` | create | 3 hooks Nhóm 8 |
| `src/features/admin/hooks/useAdminAuditLogs.ts` | create | 2 query hooks Nhóm 9 (`useAdminAuditLogs` + `useAdminAuditLogsByAccount` — C2) |

## Enums

> **Note (thêm sau khi SHIPPED):** Enums được tách ra `src/shared/enums/` và `src/features/admin/enums/` — không define inline trong types.

| Enum | File |
|------|------|
| `AccountStatusEnum`, `AvatarSourceEnum`, `RefreshTokenStatus` | `shared/enums/account.enum.ts` |
| `RoleStatusEnum`, `RoleTypeFilter` | `features/admin/enums/role.enum.ts` |
| `LoginAttemptResult`, `AuditActionEnum` | `features/admin/enums/audit.enum.ts` |
| `BatteryStatusEnum` | `shared/enums/battery.enum.ts` |
| `SiteStatusEnum` | `shared/enums/site.enum.ts` |

> **Cleanup (2026-06-28, local):** Đã xoá 3 file orphan trùng lặp `shared/types/account.enums.ts` + `shared/types/battery.enums.ts` + `shared/types/site.enums.ts` (0 import, dead-code). Bản canonical đang dùng là `shared/enums/*.enum.ts` ở bảng trên — không ảnh hưởng. `tsc` + `eslint` PASS.

## Types

### `shared/types/account.types.ts`

```ts
// shared/enums/account.enum.ts (as const — KHÔNG dùng TS native enum theo fe.md)
export const AccountStatusEnum = {
  PendingVerification: 0,
  Active: 1,
  Locked: 2,
  Inactive: 3,
  Suspended: 4,
  Banned: 5,
} as const;
export type AccountStatusEnum = (typeof AccountStatusEnum)[keyof typeof AccountStatusEnum];

export const RefreshTokenStatus = {
  Active: 1, Used: 2, Revoked: 3, Expired: 4, Compromised: 5,
} as const;
export type RefreshTokenStatus = (typeof RefreshTokenStatus)[keyof typeof RefreshTokenStatus];

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
  skillTier: number;       // ← Swagger: bắt buộc, integer (tier 1/2/3 theo StaffSkillTierEnum)
  notes?: string;          // nullable theo API doc
  skills: StaffSkillDto[] | null;  // ← Swagger: nullable: true — luôn guard bằng `skills ?? []` khi render
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

// features/admin/enums/*.enum.ts (as const — KHÔNG dùng TS native enum theo fe.md)
export const RoleStatusEnum = {
  Active: 1, Inactive: 2, Deprecated: 3,
} as const;
export type RoleStatusEnum = (typeof RoleStatusEnum)[keyof typeof RoleStatusEnum];

export const LoginAttemptResult = {
  Success: 1, WrongPassword: 2, AccountNotFound: 3,
  AccountLocked: 4, AccountSuspended: 5, AccountBanned: 6,
  AccountInactive: 7, AccountNotVerified: 8,
} as const;
export type LoginAttemptResult = (typeof LoginAttemptResult)[keyof typeof LoginAttemptResult];

// Keys dùng SCREAMING_SNAKE_CASE khớp code thực tế (features/admin/enums/audit.enum.ts)
export const AuditActionEnum = {
  LOGIN_SUCCESS: 1, LOGIN_FAILED_WRONG_PASSWORD: 2, LOGIN_FAILED_ACCOUNT_LOCKED: 3,
  LOGIN_FAILED_ACCOUNT_SUSPENDED: 4, LOGIN_FAILED_ACCOUNT_BANNED: 5,
  LOGIN_FAILED_ACCOUNT_INACTIVE: 6, LOGIN_FAILED_NOT_VERIFIED: 7,
  ACCOUNT_AUTO_LOCKED: 8, LOGOUT: 9, GOOGLE_LOGIN_SUCCESS: 10,
  GOOGLE_LOGIN_FAILED: 11, TOKEN_REFRESHED: 12, TOKEN_REUSE_DETECTED: 13,
  PASSWORD_CHANGED: 20, PASSWORD_RESET: 21, OTP_VERIFY_SUCCESS: 22,
  OTP_VERIFY_FAILED: 23, EMAIL_CHANGE_REQUESTED: 24, EMAIL_CHANGE_CONFIRMED: 25,
  PHONE_VERIFIED: 26, TWO_FACTOR_ENABLED: 40, TWO_FACTOR_DISABLED: 41,
  GOOGLE_LINKED: 50, GOOGLE_UNLINKED: 51, ACCOUNT_REGISTERED: 60,
  ACCOUNT_CREATED_BY_ADMIN: 61, ACCOUNT_UPDATED: 62, ACCOUNT_STATUS_CHANGED: 63,
  ACCOUNT_UNLOCKED: 64, ACCOUNT_DEACTIVATED: 65, ACCOUNT_DELETED: 66,
  ACCOUNT_INVITE_SENT: 67, ACCOUNT_INVITE_ACCEPTED: 68, SESSION_REVOKED: 80,
  ALL_SESSIONS_REVOKED: 81, ADMIN_FORCE_LOGOUT: 82,
  SESSION_LIMIT_EXCEEDED_OLDEST_REVOKED: 83, ROLE_ASSIGNED: 90, ROLE_REVOKED: 91,
  ROLE_TEMPORARY_ASSIGNED: 92, ROLE_CREATED: 93, ROLE_UPDATED: 94,
  ROLE_STATUS_CHANGED: 95, ROLE_DELETED: 96, PERMISSION_GRANTED: 97,
  PERMISSION_REVOKED: 98,
} as const;
export type AuditActionEnum = (typeof AuditActionEnum)[keyof typeof AuditActionEnum];

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
  maxConcurrentTickets: number; isAvailable: boolean;
  skillTier: number;  // ← Swagger: bắt buộc — gửi kèm khi PUT staff profile
  notes?: string;
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

// ── Nhóm 5 bổ sung — đổi role ──
export interface ChangeAccountRolePayload { roleId: string; }  // PUT /api/admin/accounts/{id}/role

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
    CHANGE_ROLE:   (id: string) => `/api/admin/accounts/${id}/role`,  // ← bổ sung từ Swagger
    UNLOCK:        (id: string) => `/api/admin/accounts/${id}/unlock`,
    RESET_2FA:     (id: string) => `/api/admin/accounts/${id}/2fa`,   // DELETE — admin reset 2FA (C3, Admin-only)
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
    LIST:       '/api/admin/audit-logs',
    BY_ACCOUNT: (accountId: string) => `/api/admin/audit-logs/by-account/${accountId}`,  // ← bổ sung từ Swagger
  },
}
```

**Endpoints table:**

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/admin/accounts` | `GetAccountsParams` (query) | `CommonResponse<PaginationResponse<AccountDto>>` |
| GET | `/api/admin/accounts/{id}` | — | `CommonResponse<AccountDto>` |
| POST | `/api/admin/accounts` | `CreateAccountPayload` | `CommonResponse<string>` (Guid) — HTTP **201** |
| POST | `/api/admin/accounts/invite` | `InviteAccountPayload` | `CommonResponse<string>` (Guid của account vừa tạo, trạng thái PendingVerification) |
| PUT | `/api/admin/accounts/{id}` | `UpdateAccountPayload` | `CommonResponse<string>` (Guid) |
| PUT | `/api/admin/accounts/{id}/role` | `{ roleId: string }` | `CommonResponse<unknown>` | ← endpoint đổi role, thêm vào ENDPOINTS.ADMIN.ACCOUNTS |
| PATCH | `/api/admin/accounts/{id}/status` | `ChangeAccountStatusPayload` | `CommonResponse<unknown>` |
| POST | `/api/admin/accounts/{id}/unlock` | — | `CommonResponse<unknown>` | Admin **hoặc Manager** |
| DELETE | `/api/admin/accounts/{id}/2fa` | — | `CommonResponse<string>` (Guid, idempotent) | **Admin only** — reset 2FA (C3) |
| DELETE | `/api/admin/accounts/{id}` | — | `CommonResponse<unknown>` | Admin only |
| GET | `/api/admin/accounts/{id}/sessions` | `GetAccountSessionsParams` (query) | `CommonResponse<SessionDto[]>` |
| POST | `/api/admin/accounts/{id}/sessions/revoke-all` | `RevokeAllSessionsPayload` | `CommonResponse<number>` |
| GET | `/api/admin/accounts/{id}/login-history` | `GetLoginHistoryParams` (query) | `CommonResponse<PaginationResponse<LoginAttemptDto>>` |
| PUT | `/api/admin/staff/{id}/profile` | `UpdateStaffProfilePayload` | `CommonResponse<string>` (Guid) | ← payload phải có `skillTier` (bắt buộc) |
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
| GET | `/api/admin/audit-logs/by-account/{accountId}` | `{ pageNumber?, pageSize?, action?, isSuccess? }` (query) | `CommonResponse<PaginationResponse<AuditLogDto>>` | ← endpoint bổ sung từ Swagger |

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
- `StaffProfileDto` confirmed: `accountId`, `employeeCode?`, `department?`, `maxConcurrentTickets`, `isAvailable`, `skillTier` (bắt buộc, 1–3), `notes?`, `skills[]` (nullable). Không có `displayAvatarUrl`.

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
| `StaffProfileDto.skills` là `null` | Swagger: `nullable: true` — luôn dùng `staffProfile.skills ?? []` khi render/iterate, không dùng `staffProfile.skills.map(...)` trực tiếp |
| `UpdateStaffProfilePayload` thiếu `skillTier` | `skillTier` là bắt buộc trong Swagger — form UI phải có field này. UI page (issue riêng) chịu trách nhiệm lấy giá trị hiện tại từ `staffProfile.skillTier` làm default |
| `POST /api/admin/accounts` trả HTTP 201 | Axios mặc định treat 2xx là success → không cần handle riêng |

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
| StaffProfileDto shape confirmed? | Confirmed từ Swagger: `accountId` (non-optional), `employeeCode?`, `department?`, `maxConcurrentTickets`, `isAvailable`, `skillTier` (bắt buộc, int), `notes?`, `skills[]` (nullable). `employeeCode`, `department`, `notes` là nullable. Không có `displayAvatarUrl`. |
| `skillTier` trong `UpdateStaffProfilePayload`? | **Bắt buộc** — BE-verified `UpdateStaffProfileCommand.cs:22` có `skillTier: int` (1–3, default 1, `StaffSkillTierEnum`). Plan ĐÚNG; **code FE thiếu → phải thêm** (xem C1 reversed). |
| `by-account` audit-logs endpoint? | **CÓ THẬT** — BE-verified `AdminAuditLogsController.cs:107` `GET /api/admin/audit-logs/by-account/{accountId}` (Admin-only). Plan ĐÚNG; **code FE thiếu → phải thêm** (xem C2 reversed). |
| `skills` trong `StaffProfileDto` là nullable? | **Có** — Swagger: `nullable: true`. Guard bằng `?? []`. |
