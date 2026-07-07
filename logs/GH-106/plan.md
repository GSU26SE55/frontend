# Plan — GH-106: Sửa RBAC permission codes khớp BE + wire GET /me/permissions vào session

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-06-22
- **Issue:** #106 — https://github.com/GSU26SE55/frontend/issues/106
- **Sprint:** Sprint 3 (deadline 2026-06-27)

## Mục tiêu
`P.*` trong `src/shared/lib/authz.ts` lệch với permission code thật của BE → `checkPermission()` trả `false` sai → ẩn nhầm button/route dù user có quyền (bug RBAC thật). Đồng thời FE chưa lấy permission server-resolved: hiện `SessionUser.permissions` chỉ đến từ `perm[]` trong JWT (stale khi admin đổi quyền). Cần:
1. Sửa `P.*` khớp đúng catalog BE.
2. Wire `GET /api/auth/me/permissions` để lấy permission từ DB (snapshot mới nhất) lưu vào `sessionStore`; perm[] trong JWT giữ làm fallback.

## Verify hiện trạng (đã đọc code 2026-06-22)
- **BE source of truth — verify 2 nguồn, khớp 100% = 40 code** (không phải 43 như context cũ; snapshot đã drift):
  - `AuthService.Application/Authorization/PermissionCodes.cs` (const class) → 40 code.
  - `AuthService.Infrastructure/Persistence/Seeders/PermissionSeed.cs` (`SeedItem.All` — thứ **thực sự insert DB** & trả qua `/me/permissions`) → 40 code, identical.
- **Đã loại 2 code nhiễu** khi quét toàn bộ string literal `module.action` trong BE:
  - `ticket.delete` — chỉ là fixture giả trong `SetRolePermissionsCommandHandlerTests.cs` (test logic xóa permission), KHÔNG seed.
  - `report.pdf` — tên file đính kèm trong `MaintenanceLogAddCommandHandlerTests.cs`, KHÔNG phải permission.
  - `report.view` (singular) — KHÔNG tồn tại BE ⇒ xác nhận FE hiện tại sai, đúng là `reports.view`.
- **RoleDefaults mapping** (từ `PermissionSeed.cs` — dùng cho test/sanity sau): ADMIN = cả 40; MANAGER = 23 (user view/change_status/unlock/assign_role/force_logout, role.view, battery view/assign/configure, ticket view_all/assign/close/escalate, notification view/send, kb view/create/update/publish, reports view/export, audit.view, ticket.saga.view); STAFF = 7 (user.view, battery view/update, ticket view/resolve, notification.view, kb.view); CUSTOMER = 5 (battery.view, ticket view/create, notification.view, kb.view).
- **`P.*` chỉ được dùng 1 nơi:** `src/features/admin/pages/SagaDebugPage.tsx:55-56` → `P.TICKET_SAGA_VIEW`, `P.TICKET_SAGA_REPROCESS` (đã đúng, giữ nguyên). `EnvironmentalIncidentsView.tsx` chỉ dùng `checkRole` (không liên quan `P.*`). ⇒ Đổi/xóa các `P.*` còn lại **không vỡ** component nào.
- **`sessionStore.ts`** hiện chỉ có `user / isAuthenticated / setSession / clearSession` — chưa có cách update riêng `permissions`.
- **Login hoàn tất 2 pattern:**
  - `useLogin`, `useVerify2faLogin` → `window.location.href = redirectByRole()` (full reload) → sau reload `authContext` chạy `useHydrateSession` → `decodeToken` → `setSession(user)` (perm từ JWT).
  - `useAcceptInvite`, `GoogleCallbackPage` → `setSession(user)` + `navigate()` (SPA, không reload).
  - ⇒ Một query `useMyPermissions` gate theo `isAuthenticated`, sync trong `authContext`, **tự phủ cả 4 flow** — đơn giản hơn wiring từng hook (Simplicity First).
- **Doc đã verify:** `docs/api-auth.md` §Nhóm 3 (`GET /api/auth/me/permissions`) → `CommonResponse<MyPermissionsDto>`, `MyPermissionsDto = { roleId, roleName, permissions: PermissionDto[] }`, `PermissionDto.code` khớp `P.*`. Server resolve qua DB (không đọc perm[] JWT) → re-fetch là thấy quyền mới. Không cần sửa docs.

## Scope
**Trong scope:**
- Sửa toàn bộ `P.*` trong `authz.ts` khớp 40 code BE (giữ 2 saga code).
- Thêm `ENDPOINTS.AUTH.ME_PERMISSIONS`.
- `permission.service.ts` (auth feature) gọi endpoint.
- Type `MyPermissionsDto` / `PermissionDto`.
- `QUERY_KEY.currentUser.permissions()`.
- Hook `useMyPermissions` (TanStack Query) + sync vào `sessionStore` qua `setPermissions`.
- `sessionStore`: thêm `setPermissions(permissions: string[])`.
- Wire sync 1 chỗ trong `authContext` (phủ mọi flow login).

**Ngoài scope:**
- Không thêm `P.*` usage mới vào component nào (chỉ sửa catalog) — gắn gate UI cho từng button/route là ticket riêng.
- Không wire invalidate từ admin role/permission mutation (admin đổi quyền user khác). Chỉ tạo sẵn query key để invalidate được sau; wiring mutation là follow-up.
- Không sửa `decodeToken` (perm[] vẫn là fallback).
- Không sửa docs.

## Enums
Không tạo enum mới. `P` là `as const` object string brand (giữ pattern hiện có).

| Code (BE) | Const `P.*` | Đổi so với hiện tại |
|------|-----------|------|
| user.view | USER_VIEW | giữ |
| user.create | USER_CREATE | giữ |
| user.update | USER_UPDATE | giữ |
| user.delete | USER_DELETE | **thêm** |
| user.change_status | USER_CHANGE_STATUS | **thêm** (thay `user.deactivate`) |
| user.unlock | USER_UNLOCK | **thêm** |
| user.assign_role | USER_ASSIGN_ROLE | **thêm** |
| user.force_logout | USER_FORCE_LOGOUT | **thêm** |
| user.invite | USER_INVITE | giữ |
| role.view | ROLE_VIEW | **thêm** |
| role.create | ROLE_CREATE | **thêm** |
| role.update | ROLE_UPDATE | **thêm** |
| role.delete | ROLE_DELETE | **thêm** |
| role.assign_permission | ROLE_ASSIGN_PERMISSION | **thêm** |
| battery.view | BATTERY_VIEW | giữ |
| battery.create | BATTERY_CREATE | giữ |
| battery.update | BATTERY_UPDATE | giữ |
| battery.delete | BATTERY_DELETE | giữ |
| battery.assign | BATTERY_ASSIGN | giữ |
| battery.configure | BATTERY_CONFIGURE | **thêm** (thay `battery.config.view/update`) |
| ticket.view | TICKET_VIEW | giữ |
| ticket.view_all | TICKET_VIEW_ALL | **thêm** |
| ticket.create | TICKET_CREATE | giữ |
| ticket.assign | TICKET_ASSIGN | giữ |
| ticket.resolve | TICKET_RESOLVE | **thêm** |
| ticket.close | TICKET_CLOSE | giữ |
| ticket.escalate | TICKET_ESCALATE | giữ |
| notification.view | NOTIFICATION_VIEW | giữ |
| notification.send | NOTIFICATION_SEND | **thêm** |
| notification.manage_template | NOTIFICATION_MANAGE_TEMPLATE | **thêm** |
| knowledge_base.view | KNOWLEDGE_BASE_VIEW | **thêm** |
| knowledge_base.create | KNOWLEDGE_BASE_CREATE | **thêm** |
| knowledge_base.update | KNOWLEDGE_BASE_UPDATE | **thêm** |
| knowledge_base.delete | KNOWLEDGE_BASE_DELETE | **thêm** |
| knowledge_base.publish | KNOWLEDGE_BASE_PUBLISH | **thêm** |
| reports.view | REPORTS_VIEW | **sửa** (`report.view` → `reports.view`) |
| reports.export | REPORTS_EXPORT | **thêm** |
| audit.view | AUDIT_VIEW | **sửa** (`audit_log.view` → `audit.view`) |
| ticket.saga.view | TICKET_SAGA_VIEW | giữ (đang dùng) |
| ticket.saga.reprocess | TICKET_SAGA_REPROCESS | giữ (đang dùng) |

**Xóa (không tồn tại BE):** `TICKET_TRIAGE`, `TICKET_CLOSE_REJECT`, `BATTERY_CONFIG_VIEW`, `BATTERY_CONFIG_UPDATE`, `USER_DEACTIVATE`, `SLA_VIEW`, `SLA_CONFIGURE`, `MAINTENANCE_LOG_VIEW`, `MAINTENANCE_LOG_CREATE`, `AUDIT_LOG_VIEW` (→ AUDIT_VIEW), `REPORT_VIEW` (→ REPORTS_VIEW).

## Types
`src/features/auth/types/permission.types.ts` (create):
```ts
export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  description: string | null;
  isSystemPermission: boolean;
  createdAt: string;
}
export interface MyPermissionsDto {
  roleId: string;
  roleName: string;
  permissions: PermissionDto[];
}
```

## Schema (Zod)
Không có form → không cần Zod schema.

## Endpoints
| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/auth/me/permissions` | — (AccountId từ JWT) | `CommonResponse<MyPermissionsDto>` |

`ENDPOINTS.AUTH.ME_PERMISSIONS = "/api/auth/me/permissions"`.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/lib/authz.ts` | modify | Viết lại object `P` khớp 40 code BE (giữ `checkPermission`/`checkRole`) |
| `src/shared/utils/endpoints.ts` | modify | Thêm `AUTH.ME_PERMISSIONS` |
| `src/features/auth/types/permission.types.ts` | create | `PermissionDto`, `MyPermissionsDto` |
| `src/features/auth/services/permission.service.ts` | create | `getMyPermissions()` → axiosInstance.get |
| `src/shared/utils/queryKeys.ts` | modify | `QUERY_KEY.currentUser.permissions()` |
| `src/features/auth/hooks/useMyPermissions.ts` | create | useQuery, `enabled: isAuthenticated`, map `.code` |
| `src/shared/stores/sessionStore.ts` | modify | Thêm `setPermissions(permissions: string[])` |
| `src/shared/context/authContext.tsx` | modify | Gọi `useMyPermissions` + sync `setPermissions` khi query success |

## Workflow

**Permission resolution flow (mọi flow login):**
```
Login/AcceptInvite/Google → token saved → SessionUser vào store
  (permissions = perm[] từ JWT — fallback tức thì)
authContext: isAuthenticated=true
  → useMyPermissions enabled → GET /me/permissions
  → success: setPermissions(data.permissions.map(p => p.code))   // override = server truth
  → error/pending: giữ perm[] JWT (fallback)
checkPermission(user, P.X) đọc user.permissions (đã là server truth khi query xong)
```

**Đổi quyền (admin sửa role) — re-apply không cần login lại:**
```
invalidateQueries(QUERY_KEY.currentUser.permissions())  // sẽ wire ở ticket follow-up
  → useMyPermissions refetch → setPermissions → UI cập nhật quyền mới
```

## Acceptance Criteria
- [ ] `P.*` trong `authz.ts` khớp đúng 40 permission code BE (giữ 2 saga code đang dùng), không còn code không tồn tại BE.
- [ ] `SagaDebugPage` vẫn dùng `P.TICKET_SAGA_VIEW` / `P.TICKET_SAGA_REPROCESS` không vỡ.
- [ ] Thêm `ENDPOINTS.AUTH.ME_PERMISSIONS` + type `MyPermissionsDto`/`PermissionDto` + `permission.service.ts` gọi `GET /me/permissions`.
- [ ] `useMyPermissions` gate theo `isAuthenticated`, sync `setPermissions` vào `sessionStore` (server truth override perm[] JWT; error/pending giữ perm[] JWT làm fallback).
- [ ] Wire sync 1 chỗ trong `authContext` phủ cả 4 flow login (login/2FA/accept-invite/google).
- [ ] `QUERY_KEY.currentUser.permissions()` tạo sẵn để invalidate được (wiring mutation là follow-up).
- [ ] tsc --noEmit + eslint --max-warnings=0 + npm run build → PASS

## Steps
- [x] Bước 1: Viết lại `P` trong `authz.ts` (40 code), xác nhận `SagaDebugPage` vẫn dùng `P.TICKET_SAGA_VIEW/REPROCESS` OK. — 2026-06-22
- [x] Bước 2: Thêm `ENDPOINTS.AUTH.ME_PERMISSIONS`. — 2026-06-22
- [x] Bước 3: Tạo `permission.types.ts` (`PermissionDto`, `MyPermissionsDto`). — 2026-06-22
- [x] Bước 4: Tạo `permission.service.ts` (`getMyPermissions`). — 2026-06-22
- [x] Bước 5: Thêm `QUERY_KEY.currentUser.permissions()`. — 2026-06-22
- [x] Bước 6: Thêm `setPermissions` vào `sessionStore`. — 2026-06-22
- [x] Bước 7: Tạo `useMyPermissions` (gate `isAuthenticated`, map `.code`). — 2026-06-22
- [x] Bước 8: Wire sync trong `authContext` (gọi hook + effect setPermissions on success). — 2026-06-22
- [x] Bước 9: `npx tsc --noEmit` + `npx eslint . --max-warnings=0` + `npm run build` → PASS. — 2026-06-22
