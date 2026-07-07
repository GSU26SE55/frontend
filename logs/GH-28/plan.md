# Plan — GH-28: Auth Profile, Staff Assignment & Session Management — services + hooks

## Metadata
- **Status:** SHIPPED → **OK (minor)** | **Role:** FE | **Ngày:** 2026-05-20, cập nhật 2026-06-14
- **Issue:** #28 — https://github.com/GSU26SE55/frontend/issues/28
- **Sprint:** Sprint 1 (deadline 2026-05-30)

---

## ⚠️ GH-295 Review (2026-06-14) — KHÔNG có breaking change ở ticket này

> **Đã đối chiếu codebase + doc.** GH-28 là data-layer cho profile/staff/session (Nhóm 3 & 4) — các endpoint này **không bị GH-295 đụng tới**. Không cần rework lớn. Ghi nhận:

- ✅ `GET/PUT /api/auth/me`, `POST /api/auth/me/avatar` (`{ avatarFileId }`), `/api/staff*`, `/api/sessions*` — code khớp doc. (`account.types.ts` `AccountDto`/`StaffProfileDto`/`SessionDto` đã verify đúng shape.)
- ✅ `StaffProfileDto.notes?` nullable — đã đúng (blocker #2 cũ resolved). Code `account.types.ts:25-26` còn để `employeeCode`/`department` **non-optional** trong khi doc ([api-auth.md §Nhóm 6](../../docs/api-auth.md)) cho phép `string?` — 🟢 minor: nên đổi sang optional để khớp, nhưng không gây lỗi runtime (BE eager-load luôn trả).
- ⚠️ `StaffProfileDto` KHÔNG có `skillTier` — **đúng** (xem GH-30 C1: plan GH-30 ghi nhầm `skillTier`, code/doc đều không có).
- ℹ️ `AccountDto` được dùng lại bởi login flow (gián tiếp) nhưng GH-28 không gọi login → không dính C1 token-wrapper của GH-11.

→ **Hành động:** chỉ cân nhắc đổi `employeeCode`/`department` sang optional. Không có việc fix bắt buộc.

## Mục tiêu
Tạo types + services + TanStack Query hooks cho 8 endpoint thuộc Nhóm 3 (Auth Profile & Staff Assignment) và Nhóm 4 (Session Management). Không tạo pages/components — chỉ là tầng data access để các feature pages dùng sau.

## Scope
**Trong scope:**
- Types cho `AccountDto`, `AccountProfileDto`, `StaffProfileDto`, `StaffAssignmentProfileDto`, `SessionDto` và các enums liên quan
- Services: `profile.service.ts`, `session.service.ts`, `staff.service.ts`
- TanStack Query hooks: `useProfile`, `useUpdateProfile`, `useUpdateAvatar`, `useSessions`, `useRevokeSession`, `useRevokeAllSessions`, `useStaffList`, `useStaffAssignmentProfile`
- Cập nhật `endpoints.ts` và `queryKeys.ts`

**Ngoài scope:**
- Pages/components (ProfilePage, SessionsPage...) — implement ở issue riêng
- Zod schemas — không cần trong plan này (xem section [Schema (Zod)](#schema-zod))
- Avatar upload lên FileStorageService — chỉ gọi `POST /api/auth/me/avatar` với `avatarFileId` có sẵn
- `GET /api/admin/accounts` / `GET /api/admin/accounts/{id}` — issue admin riêng, sẽ reuse `AccountDto` từ `shared/types/`
- Di chuyển `features/staff/` sang `shared/` khi admin/manager cần — tạo issue riêng

---

## ⚠️ Blockers — Cần xác nhận trước khi code

### Confirm với BE

| # | Item | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1 | `POST /api/sessions/revoke-all` — HTTP method | ✅ Confirmed (POST) | API doc §Nhóm 4 ghi rõ `POST` |
| 2 | `StaffProfileDto.notes` — nullable hay không | ✅ Không block code | Dùng `notes?: string` (safe fallback). Confirm với BE trước khi ship — nếu non-nullable thì sửa type |

---

## Endpoints

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| `GET` | `/api/auth/me` | — | `CommonResponse<AccountDto>` |
| `PUT` | `/api/auth/me/profile` | `UpdateProfilePayload` | `CommonResponse<AccountDto>` |
| `POST` | `/api/auth/me/avatar` | `UpdateAvatarPayload` | `CommonResponse<AccountDto>` |
| `GET` | `/api/staff` | `?skill=string` (query) | `CommonResponse<StaffAssignmentProfileDto[]>` |
| `GET` | `/api/staff/{id}/assignment-profile` | — | `CommonResponse<StaffAssignmentProfileDto>` |
| `GET` | `/api/sessions/me` | `?activeOnly=bool` (query) | `CommonResponse<SessionDto[]>` |
| `DELETE` | `/api/sessions/{sessionId}` | — | `CommonResponse<number>` |
| `POST` | `/api/sessions/revoke-all` | `RevokeAllSessionsPayload` | `CommonResponse<number>` |

---

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/types/account.types.ts` | create | `AccountStatusEnum`, `AvatarSourceEnum`, `AccountProfileDto`, `StaffSkillDto`, `StaffProfileDto`, `AccountDto` |
| `src/features/staff/types/staff.types.ts` | create | `StaffAssignmentProfileDto` — import `StaffSkillDto` từ `shared/types/account.types.ts` |
| `src/features/auth/types/auth.types.ts` | modify | Thêm `RefreshTokenStatus`, `SessionDto`, `UpdateProfilePayload`, `UpdateAvatarPayload`, `RevokeAllSessionsPayload` |
| `src/shared/utils/endpoints.ts` | modify | Thêm `AUTH.ME/ME_PROFILE/ME_AVATAR`, `STAFF.*`, `SESSIONS.*` |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `KEY.profile/staff/sessions` + factories |
| `src/features/auth/services/profile.service.ts` | create | `getMe`, `updateProfile`, `updateAvatar` |
| `src/features/auth/services/session.service.ts` | create | `getSessions`, `revokeSession`, `revokeAllSessions` |
| `src/features/staff/services/staff.service.ts` | create | `getList`, `getAssignmentProfile` |
| `src/features/auth/hooks/useProfile.ts` | create | `useQuery` — staleTime 5 phút |
| `src/features/auth/hooks/useUpdateProfile.ts` | create | `useMutation` — invalidate `KEY.profile` |
| `src/features/auth/hooks/useUpdateAvatar.ts` | create | `useMutation` — invalidate `KEY.profile` |
| `src/features/auth/hooks/useSessions.ts` | create | `useQuery` — staleTime 0, refetchOnWindowFocus true |
| `src/features/auth/hooks/useRevokeSession.ts` | create | `useMutation` — invalidate `KEY.sessions` |
| `src/features/auth/hooks/useRevokeAllSessions.ts` | create | `useMutation` — invalidate `KEY.sessions` |
| `src/features/staff/hooks/useStaffList.ts` | create | `useQuery` — staleTime 2 phút. Thêm comment đầu file: `// Admin/Manager cần hook này → KHÔNG import xuyên feature. Tạo issue để quyết định abstract.` |
| `src/features/staff/hooks/useStaffAssignmentProfile.ts` | create | `useQuery` — staleTime 2 phút |

> **Lý do staff ở `features/staff/` thay vì `shared/`:** Tránh tạo `shared/services/` và `shared/hooks/` ngoài template chuẩn. Khi admin/manager cần hooks này → tạo issue riêng để quyết định abstract lên `shared/` hay duplicate có chủ đích.

---

## Enums

> **Note (thêm sau khi SHIPPED):** Enums được tách ra `src/shared/enums/` và `src/features/admin/enums/` — không define inline trong types. Plan đã đồng bộ sang pattern `as const` object + type alias (theo rule fe.md — KHÔNG dùng TS native enum), khớp với codebase thực tế.

| Enum | File |
|------|------|
| `AccountStatusEnum`, `AvatarSourceEnum`, `RefreshTokenStatus` | `shared/enums/account.enum.ts` |
| `RoleStatusEnum`, `RoleTypeFilter` | `features/admin/enums/role.enum.ts` |
| `LoginAttemptResult`, `AuditActionEnum` | `features/admin/enums/audit.enum.ts` |
| `BatteryStatusEnum` | `shared/enums/battery.enum.ts` |
| `SiteStatusEnum` | `shared/enums/site.enum.ts` |

---

## Types

```ts
// shared/enums/account.enum.ts (as const — KHÔNG dùng TS native enum theo fe.md)
export const AccountStatusEnum = {
  PendingVerification: 0, Active: 1, Locked: 2, Inactive: 3, Suspended: 4, Banned: 5,
} as const;
export type AccountStatusEnum = (typeof AccountStatusEnum)[keyof typeof AccountStatusEnum];

export const AvatarSourceEnum = {
  None: 0, Uploaded: 1, Google: 2,
} as const;
export type AvatarSourceEnum = (typeof AvatarSourceEnum)[keyof typeof AvatarSourceEnum];

export interface AccountProfileDto {
  accountId: string;
  avatarFileId?: string;
  externalAvatarUrl?: string;
  avatarSource: AvatarSourceEnum;
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
  fullName: string;
  phoneNumber?: string;
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
  profile?: AccountProfileDto;     // null nếu account chưa tạo profile row (vd seed admin)
  staffProfile?: StaffProfileDto;  // null nếu không phải Staff
  displayAvatarUrl?: string;       // dùng field này để render avatar trong <img src>
}

// features/staff/types/staff.types.ts
import type { StaffSkillDto } from '@/shared/types/account.types';

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

// shared/enums/account.enum.ts (as const — KHÔNG dùng TS native enum theo fe.md)
export const RefreshTokenStatus = {
  Active: 1, Used: 2, Revoked: 3, Expired: 4, Compromised: 5,
} as const;
export type RefreshTokenStatus = (typeof RefreshTokenStatus)[keyof typeof RefreshTokenStatus];
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
export interface UpdateProfilePayload {
  fullName: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: string;
  timeZone?: string;
}
export interface UpdateAvatarPayload { avatarFileId: string; }
export interface RevokeAllSessionsPayload {
  exceptCurrent?: boolean;
  currentRefreshToken?: string;
}
```

---

## Schema (Zod)

**Plan này KHÔNG dùng Zod.** Lý do:
- Scope chỉ là services + hooks — không có form, không có user input cần validate ở FE layer.
- Validation được BE xử lý hoàn toàn; FE nhận lỗi qua `listErrors` và handle bằng `handleErrorApi`.
- Zod schema cho `UpdateProfilePayload` (form PUT /api/auth/me/profile) sẽ được tạo ở issue riêng khi implement ProfilePage.

---

## Endpoints (additions to endpoints.ts)

```ts
AUTH: {
  // ...existing...
  ME:          '/api/auth/me',
  ME_PROFILE:  '/api/auth/me/profile',
  ME_AVATAR:   '/api/auth/me/avatar',
},
STAFF: {
  LIST:   '/api/staff',
  DETAIL: (id: string) => `/api/staff/${id}/assignment-profile`,
},
SESSIONS: {
  ME:         '/api/sessions/me',
  REVOKE:     (id: string) => `/api/sessions/${id}`,
  REVOKE_ALL: '/api/sessions/revoke-all',
},
```

---

## Query Keys (additions to queryKeys.ts)

```ts
export const KEY = {
  profile:  ['profile']  as const,
  staff:    ['staff']    as const,
  sessions: ['sessions'] as const,
} as const;

export const QUERY_KEY = {
  profile: {
    me: () => [...KEY.profile, 'me'] as const,
  },
  staff: {
    list:   (skill?: string) => [...KEY.staff, 'list', skill]  as const,
    detail: (id: string)     => [...KEY.staff, 'detail', id]   as const,
  },
  sessions: {
    me: (activeOnly?: boolean) => [...KEY.sessions, 'me', activeOnly] as const,
  },
} as const;
```

---

## Approach

- Service files (`profile.service.ts`, `session.service.ts`, `staff.service.ts`) import axios từ `shared/lib/axios.ts`, endpoints từ `ENDPOINTS.*` — không hardcode URL
- Hooks dùng TanStack Query: queries dùng `useQuery`, mutations dùng `useMutation`
- `useProfile` — `staleTime: 5 phút` (user profile ít thay đổi; đủ fresh cho header/avatar)
- `useSessions` — `staleTime: 0, refetchOnWindowFocus: true` (security-sensitive — luôn fetch mới khi user quay lại tab)
- `useStaffList`, `useStaffAssignmentProfile` — `staleTime: 2 phút` (default)
- Mutation `onSuccess` invalidate scope hẹp: profile mutations → `KEY.profile`, session mutations → `KEY.sessions`
- `StaffAssignmentProfileDto` và `StaffProfileDto` đặt ở `shared/types/account.types.ts` — cross-feature với GH-30 (admin) sau này
- Không tạo Zod schema trong ticket này — scope chỉ là services + hooks, không có form input

## Cookie — revokeAllSessions

`RevokeAllSessionsPayload.currentRefreshToken` được lấy từ cookie `'refreshToken'` bằng `Cookies.get('refreshToken')`.

**Chi tiết:**
- **Cookie key:** `'refreshToken'`
- **httpOnly:** `false` — non-httpOnly (ghi rõ trong `axios.ts`: `// SECURITY: non-httpOnly cookie, acceptable for capstone scope`)
- **Cách FE đọc:** `import Cookies from 'js-cookie'; const rt = Cookies.get('refreshToken');`
- **Khi dùng:** Caller tự truyền khi gọi `useRevokeAllSessions` với `exceptCurrent: true`

```ts
// Ví dụ caller usage (ở page layer):
const { mutate } = useRevokeAllSessions();
mutate({
  exceptCurrent: true,
  currentRefreshToken: Cookies.get('refreshToken'),
});
```

> ⚠️ Rủi ro: nếu refresh token rotation đã xảy ra (token mới chưa được cập nhật vào cookie) thì `currentRefreshToken` có thể outdated. Acceptable cho capstone scope.

---

## Workflow

**GET /api/auth/me:**
```
useProfile() → profileService.getMe() → GET /api/auth/me
→ OK:   cache AccountDto (staleTime 5m)
→ FAIL: 401 → axios interceptor tự refresh / redirect login
```

**PUT /api/auth/me/profile:**
```
useUpdateProfile() → profileService.updateProfile(payload)
→ OK:   invalidate KEY.profile → useProfile refetch tự động
→ FAIL: 400 + listErrors → handleErrorApi({ error, setError })
```

**DELETE /api/sessions/{id}:**
```
useRevokeSession() → sessionService.revokeSession(id)
→ OK:   invalidate KEY.sessions
→ 403:  HttpError → toast.error (session không thuộc về bạn)
```

**POST /api/sessions/revoke-all:**
```
useRevokeAllSessions() → sessionService.revokeAllSessions(payload)
  payload = { exceptCurrent: true, currentRefreshToken: Cookies.get('refreshToken') }
→ OK:   invalidate KEY.sessions
```

---

## Edge Cases

- `profile: null` trong `AccountDto` là hợp lệ — không throw error, consumer tự handle
- `staffProfile: null` trong `AccountDto` là hợp lệ — null khi user không phải Staff
- `isCurrent: true` session — hook không block revoke, UI layer tự ẩn nút "Revoke"
- `GET /api/staff` chỉ dành cho Admin/Manager — hook không guard role, route guard ở `RoleRoute`

---

## Rủi ro

| Mức | Rủi ro | Xác suất | Mitigation |
|-----|--------|----------|-----------|
| **CAO** | `StaffProfileDto.notes` nullable mismatch → runtime type error | Cao | Dùng `notes?: string` tạm thời; flag rõ trong code comment; track ở blocker table |
| **CAO** | `revokeAllSessions` sai method → integration test fail | Thấp (đã confirm POST) | Đã confirm từ API doc, ghi endpoint rõ |
| **TRUNG BÌNH** | `features/staff/` hooks không reachable từ `features/admin/` (ESLint no-restricted-imports) | Chắc chắn | Đã biết — tạo issue riêng khi admin/manager cần |
| **THẤP** | Cookie `refreshToken` bị rotate trước khi `revokeAllSessions` gọi | Thấp | Acceptable; note trong code |

---

## Dài hạn

- **Tạo issue riêng:** khi admin/manager feature cần `useStaffList` / `useStaffAssignmentProfile`, quyết định abstract lên `shared/` hay tạo wrapper hooks riêng trong từng feature.

---

## Acceptance Criteria

| Tiêu chí | Cách verify |
|----------|------------|
| `tsc --noEmit` không lỗi | `npx tsc --noEmit` → exit 0 |
| `eslint --max-warnings=0` pass | `npx eslint src --max-warnings=0` → exit 0 |
| Services không hardcode URL | `grep -r "'/api/" src/features/auth/services src/features/staff/services` → no match |
| Hooks không gọi axiosInstance trực tiếp | Chỉ gọi qua service functions |

---

## Steps

- [x] Bước 1: Tạo `src/shared/types/account.types.ts` — 2026-05-19
- [x] Bước 2: Cập nhật `src/features/auth/types/auth.types.ts` (thêm session + profile payload types) — 2026-05-19
- [x] Bước 3: Cập nhật `src/shared/utils/endpoints.ts` (thêm ME, STAFF, SESSIONS) — 2026-05-19
- [x] Bước 4: Cập nhật `src/shared/utils/queryKeys.ts` (thêm KEY + QUERY_KEY) — 2026-05-19
- [x] Bước 5: Tạo `src/features/auth/services/profile.service.ts` — 2026-05-19
- [x] Bước 6: Tạo `src/features/auth/services/session.service.ts` — 2026-05-19
- [x] Bước 7: Tạo `src/features/staff/services/staff.service.ts` — 2026-05-19
- [x] Bước 8: Tạo 3 profile hooks (`useProfile`, `useUpdateProfile`, `useUpdateAvatar`) — 2026-05-19
- [x] Bước 9: Tạo 3 session hooks (`useSessions`, `useRevokeSession`, `useRevokeAllSessions`) — 2026-05-19
- [x] Bước 10: Tạo 2 staff hooks (`useStaffList`, `useStaffAssignmentProfile`) — 2026-05-19
- [x] Bước 11: `tsc --noEmit` → PASS — 2026-05-19
