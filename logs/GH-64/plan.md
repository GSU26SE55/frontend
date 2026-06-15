# Plan — GH-64: Implement deferred UI — Profile, Accept Invite, Admin UI forms

## Metadata
- **Status:** REVIEWING → **NEEDS REWORK (GH-295)** | **Role:** FE | **Ngày:** 2026-06-06, cập nhật 2026-06-14
- **Issue:** #64 — https://github.com/GSU26SE55/frontend/issues/64
- **Sprint:** Sprint 1 (deadline 2026-05-30)

---

## ⚠️ GH-295 Contract Update (2026-06-14) — SỬA TRƯỚC KHI FIX CODE

> **Đã đối chiếu codebase.** Phần Endpoints/Approach cũ phía dưới lỗi thời ở chỗ đánh dấu.

### C1 — 🔴 Accept Invite response: `data.tokens.*` (phụ thuộc fix GH-11 C1)

- **Plan** ([Endpoints §Accept Invite dòng 48](#accept-invite), [Approach dòng 166](#accept-invite-flow)) ghi response `CommonResponse<{ accessToken, refreshToken }>` phẳng.
- **Code (verified):** `auth.service.ts:66` `acceptInvite` type `CommonResponse<LoginResponseData>` (phẳng) — sẽ vỡ với shape mới.
- **Doc** [api-auth.md §`/accept-invite`](../../docs/api-auth.md): response = `LoginResultDto` → `data.tokens.accessToken`, `data.challenge=null`.
- → `AcceptInvitePage` onSuccess: `saveTokens(data.tokens.accessToken, data.tokens.refreshToken)` (không phải `data.accessToken`). Đồng bộ với `useLogin` sau khi GH-11 C1 fix. Accept-invite **bypass 2FA** nên `challenge` luôn null — không cần handle `requiresTwoFactor`.

### C4 — 🔴 Accept Invite body PHẢI gồm `confirmPassword` (plan SAI) — 2026-06-15

- **Plan cũ** ([Files dòng 116], [Approach dòng 190], Q&A dòng 284): `AcceptInvitePayload { invitationToken, password }` — **KHÔNG gửi confirmPassword**.
- **Doc** [api-auth.md §`/accept-invite`]: body bắt buộc **cả 3** — `invitationToken`, `password`, **`confirmPassword`** (BE validate cross-field, mismatch → `422`). Nếu FE strip `confirmPassword`, BE không thực hiện được check đã document.
- → **Sửa:** `AcceptInvitePayload { invitationToken, password, confirmPassword }` — gửi đủ 3 field lên BE (vẫn giữ Zod `.refine` check match phía FE).

### C5 — 🔴 Accept Invite error status: 401 (không phải 410) — 2026-06-15

- **Plan cũ** ([Approach dòng 201], Edge Cases dòng 243) branch lỗi trên `410` cho token hết hạn.
- **Doc** [api-auth.md §`/accept-invite`]: token hết hạn/không hợp lệ/đã vô hiệu hóa = **`401`** (BE không có nhánh 410); `confirmPassword` mismatch = `422`; token đã dùng (account active) = `409`.
- → **Sửa:** branch theo `401` (hết hạn/invalid) + `409` (đã active) + `422` (confirm mismatch — hiện dưới field). Nhánh `410` không bao giờ fire → bỏ.

### C2 — 🔴 AccountsPage: thêm nút "Reset 2FA" (admin) — endpoint GH-295 mới

- Doc [api-auth.md §`DELETE /api/admin/accounts/{id}/2fa`](../../docs/api-auth.md): admin reset 2FA của user khác. **Admin only**.
- **Code (verified):** chưa có endpoint/service/hook (xem GH-30 C3).
- → Sau khi GH-30 thêm `useAdminReset2fa`: thêm menu item "Reset 2FA" trong row action AccountsPage (chỉ hiện khi `account.twoFactorEnabled === true` và actor là Admin) → confirm dialog → `DELETE`. Toast theo message idempotent từ BE.

### C3 — 🟢 ProfilePage avatar — plan đúng, nhưng review.md sai field

`POST /api/auth/me/avatar` body `{ avatarFileId }` + render bằng `displayAvatarUrl` — plan ([Approach dòng 182]) **đúng doc**. ⚠️ Lưu ý: `review.md` đề xuất render bằng `account.avatarUrl` — **SAI** (doc: `avatarUrl` là legacy field deprecated, KHÔNG dùng để hiển thị). Khi implement, render `<img src={displayAvatarUrl}>` theo plan, bỏ qua đề xuất review.md.

> Các phần admin forms khác (invite/create/edit/status/role/unlock/delete, roles, permissions, audit) khớp doc — không cần sửa, TRỪ: AuditLogsPage filter cần thêm 6 action 2FA mới sau khi GH-30 C4 mở rộng `AuditActionEnum`.

## Mục tiêu
Implement 4 nhóm UI bị defer từ GH-11, GH-27, GH-28, GH-30:
1. **ProfilePage** — shared page dùng chung cho Admin/Manager/Staff, xem & chỉnh sửa profile + upload avatar
2. **Accept Invite flow** — public page `/invite/accept?token=...` để user nhận invite từ Admin đặt mật khẩu
3. **Admin UI forms/dialogs** — AccountsPage (create/invite/edit/status/role/unlock/delete/sessions/staff), RolesPage (create/edit/status/delete/permissions)
4. **AuditLogsPage** — new page tại `/admin/audit-logs`, thêm vào ADMIN_NAV

> AppLayout/Sidebar/Header đã được implement — KHÔNG làm lại.

## Scope

**Trong scope:**
- ProfilePage (route `/admin/profile`, `/manager/profile`, `/staff/profile`) dùng chung 1 component
- Accept Invite (route `/invite/accept`, public, không cần auth)
- Admin: AccountsPage dialogs — Invite, Create, Edit, ChangeStatus, ChangeRole, Unlock, Delete, AccountDetailDrawer (sessions + login history), EditStaffProfileDialog
- Admin: RolesPage dialogs — Create, Edit (name/desc + status toggle), Delete, PermissionsDialog
- Admin: AuditLogsPage mới tại `/admin/audit-logs` + thêm vào ADMIN_NAV
- Thêm missing service method + hook: `changeRole` (PUT /api/admin/accounts/{id}/role)
- Router: wire `/admin/profile`, `/manager/profile`, `/staff/profile`, `/invite/accept`, `/admin/audit-logs`, `/admin/settings`, `/manager/settings`, `/staff/settings` → AccountSettingsPage
- AppLayout Topbar: đổi navigate từ `/{role}/settings` → `/{role}/profile` (intentional behavior change: user click menu sẽ vào ProfilePage thay vì AccountSettingsPage; settings vẫn accessible qua sidebar "Cài đặt" → redirect `/settings`)

**Ngoài scope:**
- Trang profile riêng cho Customer (dùng mobile)
- Sessions page riêng (sessions hiển thị trong AccountDetailDrawer, đủ scope)
- Real-time notification
- FileUpload widget độc lập (chỉ dùng `useUploadFile` inline trong ProfilePage)

## Endpoints

### Profile
| Method | Path | Mục đích |
|--------|------|----------|
| GET | `/api/auth/me` | Lấy profile hiện tại (hook đã có: `useProfile`) |
| PUT | `/api/auth/me/profile` | Cập nhật profile (hook đã có: `useUpdateProfile`) |
| POST | `/api/auth/me/avatar` | Gắn avatarFileId (hook đã có: `useUpdateAvatar`) |
| POST | `/api/files/upload` | Upload file lấy fileId (hook đã có: `useUploadFile`) |

### Accept Invite
| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/auth/accept-invite` | `AcceptInvitePayload` `{ invitationToken, password, confirmPassword }` | `CommonResponse<LoginResultData>` — `data.tokens.*`, `data.challenge=null` (GH-295) |

### Admin — Accounts (hooks đã có, **trừ changeRole**)
| Method | Path | Hook |
|--------|------|------|
| POST | `/api/admin/accounts` | `useAdminCreateAccount` ✅ |
| POST | `/api/admin/accounts/invite` | `useAdminInviteAccount` ✅ |
| PUT | `/api/admin/accounts/{id}` | `useAdminUpdateAccount` ✅ |
| PATCH | `/api/admin/accounts/{id}/status` | `useAdminChangeAccountStatus` ✅ |
| PUT | `/api/admin/accounts/{id}/role` | `useAdminChangeAccountRole` ❌ cần thêm |
| POST | `/api/admin/accounts/{id}/unlock` | `useAdminUnlockAccount` ✅ |
| DELETE | `/api/admin/accounts/{id}` | `useAdminDeleteAccount` ✅ |
| GET | `/api/admin/accounts/{id}/sessions` | `useAdminAccountSessions` ✅ |
| POST | `/api/admin/accounts/{id}/sessions/revoke-all` | `useAdminRevokeAllSessions` ✅ |
| GET | `/api/admin/accounts/{id}/login-history` | `useAdminAccountLoginHistory` ✅ |

### Admin — Staff (hooks đã có)
| Method | Path | Hook |
|--------|------|------|
| PUT | `/api/admin/staff/{id}/profile` | `useAdminUpdateStaffProfile` ✅ |
| POST | `/api/admin/staff/{id}/skills` | `useAdminAddSkill` ✅ |
| DELETE | `/api/admin/staff/{id}/skills/{skillCode}` | `useAdminDeleteSkill` ✅ |

### Admin — Roles & Permissions (hooks đã có)
| Method | Path | Hook |
|--------|------|------|
| POST | `/api/admin/roles` | `useAdminCreateRole` ✅ |
| PUT | `/api/admin/roles/{id}` | `useAdminUpdateRole` ✅ |
| PATCH | `/api/admin/roles/{id}/status` | `useAdminChangeRoleStatus` ✅ |
| DELETE | `/api/admin/roles/{id}` | `useAdminDeleteRole` ✅ |
| GET | `/api/admin/permissions` | `useAdminPermissionList` ✅ |
| GET | `/api/admin/roles/{roleId}/permissions` | `useAdminRolePermissions` ✅ |
| PUT | `/api/admin/roles/{roleId}/permissions` | `useAdminSetRolePermissions` ✅ |

### Admin — Audit Logs
| Method | Path | Hook |
|--------|------|------|
| GET | `/api/admin/audit-logs` | `useAdminAuditLogs` ✅ |

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/auth/types/auth.types.ts` | modify | Thêm `AcceptInviteFormValues` (form) và `AcceptInvitePayload` (API body — `invitationToken` + `password` + `confirmPassword`, gửi đủ 3) |
| `src/features/admin/types/admin.types.ts` | modify | Thêm `ChangeAccountRolePayload { roleId: string }` |
| `src/features/auth/services/auth.service.ts` | modify | Thêm `acceptInvite` method |
| `src/features/auth/schemas/profile.schema.ts` | create | Zod schema cho edit profile form |
| `src/features/auth/schemas/accept-invite.schema.ts` | create | Zod schema — password + confirmPassword |
| `src/features/auth/hooks/useAcceptInvite.ts` | create | useMutation → acceptInvite service |
| `src/features/auth/pages/ProfilePage.tsx` | create | Shared profile page: avatar upload + edit form |
| `src/features/auth/pages/AcceptInvitePage.tsx` | create | Public page — token từ URL, form đặt mật khẩu |
| `src/shared/utils/endpoints.ts` | modify | Thêm `ROLE: (id: string) => \`/api/admin/accounts/${id}/role\`` vào `ENDPOINTS.ADMIN.ACCOUNTS` |
| `src/features/admin/services/admin-accounts.service.ts` | modify | Thêm `changeRole(id: string, payload: ChangeAccountRolePayload)` — dùng `ENDPOINTS.ADMIN.ACCOUNTS.ROLE(id)` |
| `src/features/admin/hooks/useAdminAccounts.ts` | modify | Thêm `useAdminChangeAccountRole` hook |
| `src/features/admin/schemas/admin-account.schema.ts` | create | Zod schemas: invite, create, edit, status, role |
| `src/features/admin/schemas/role.schema.ts` | create | Zod schemas: create role, edit role |
| `src/features/admin/schemas/staff-profile.schema.ts` | create | Zod schema: edit staff profile + add skill |
| `src/features/admin/components/InviteAccountDialog.tsx` | create | POST invite: email, fullName, phone, roleId |
| `src/features/admin/components/CreateAccountDialog.tsx` | create | POST create: email, fullName, password, phone, dob, address, roleId |
| `src/features/admin/components/EditAccountDialog.tsx` | create | PUT update: fullName, phone, dob, address |
| `src/features/admin/components/ChangeAccountStatusDialog.tsx` | create | PATCH status: dropdown status + reason |
| `src/features/admin/components/ChangeRoleDialog.tsx` | create | PUT role: select từ role list |
| _(không có file riêng cho Unlock)_ | — | Unlock dùng `useAdminUnlockAccount` trực tiếp với inline `AlertDialog` confirm trong AccountsPage |
| `src/features/admin/components/AccountDetailDrawer.tsx` | create | Sessions list + revoke + login history table |
| `src/features/admin/components/EditStaffProfileDialog.tsx` | create | PUT staff profile + skills CRUD inline |
| `src/features/admin/components/CreateRoleDialog.tsx` | create | POST role: name, description |
| `src/features/admin/components/EditRoleDialog.tsx` | create | PUT role + PATCH status + DELETE (confirm) |
| `src/features/admin/components/PermissionsDialog.tsx` | create | Checkbox list: fetch current → merge → PUT (replace semantics); inline `AlertDialog` khi `permissionIds: []` |
| `src/features/admin/pages/AccountsPage.tsx` | modify | Wire tất cả dialogs + row actions |
| `src/features/admin/pages/RolesPage.tsx` | modify | Wire tất cả dialogs + row actions |
| `src/features/admin/pages/AuditLogsPage.tsx` | create | Table + filter: action, targetAccount, isSuccess, date range |
| `src/router/index.tsx` | modify | Thêm profile routes, accept-invite, audit-logs, settings routes |
| `src/shared/components/layout/AppLayout.tsx` | modify | ADMIN_NAV: add audit-logs; Topbar: fix profile link; Sidebar: wire settings |

## Enums

Enums dùng trong GH-64 và file nguồn tương ứng:

| Enum | Dùng ở đâu | File |
|------|-----------|------|
| `AccountStatusEnum` | `ChangeAccountStatusDialog` — dropdown status; `admin-account.schema.ts` | `shared/enums/account.enum.ts` |
| `AvatarSourceEnum` | `ProfilePage` — render avatar theo nguồn | `shared/enums/account.enum.ts` |
| `RefreshTokenStatus` | `AccountDetailDrawer` — hiển thị trạng thái session | `shared/enums/account.enum.ts` |
| `RoleStatusEnum` | `ChangeRoleStatusDialog` — toggle active/inactive | `features/admin/enums/role.enum.ts` |
| `LoginAttemptResult` | `AccountDetailDrawer` — login history table | `features/admin/enums/audit.enum.ts` |
| `AuditActionEnum` | `AuditLogsPage` — filter action | `features/admin/enums/audit.enum.ts` |

**Lưu ý quan trọng — `AccountStatusEnum.PendingVerification = 0`:**
```ts
// ❌ SAI — 0 bị treat falsy
if (account.status) { showBadge() }

// ✅ ĐÚNG
if (account.status !== undefined && account.status !== null) { showBadge() }
// hoặc dùng === trực tiếp
if (account.status === AccountStatusEnum.PendingVerification) { ... }
```

**Schema pattern:**
```ts
import { AccountStatusEnum } from "@/shared/enums/account.enum";
status: z.nativeEnum(AccountStatusEnum)  // ✅ — không dùng z.enum([...])
```

## Approach

### ProfilePage
- `useProfile()` → hiển thị current data; `useUpdateProfile()` → onSubmit form
- Avatar: file input `<input type="file" accept=".jpg,.jpeg,.png,.webp">` (khớp whitelist Avatar của FileStorage — spec api-filestorage.md) → `useUploadFile({ file, purpose: FilePurposeEnum.Avatar })` → lấy `fileId` → `useUpdateAvatar({ avatarFileId: fileId })`
- Render avatar: `${VITE_API_BASE_URL}${account.displayAvatarUrl}` hoặc placeholder nếu null
- `profile` có thể `null` (seed admin) → form vẫn submit được, BE tự tạo profile row
- Cache invalidation: `useUpdateProfile` + `useUpdateAvatar` đều dùng `invalidateQueries({ queryKey: [KEY.profile] })` — prefix-match `QUERY_KEY.profile.me()` = `[KEY.profile, "me"]` → đúng, không cần sửa

### Accept Invite flow
- Route `/invite/accept` dưới AuthLayout (public)
- `invitationToken` lấy từ `useSearchParams()` — đọc `?token=...`
- Form state type: `AcceptInviteFormValues { password, confirmPassword }` (Zod `.refine` check match)
- API payload type: `AcceptInvitePayload { invitationToken, password, confirmPassword }` — **gửi đủ 3 field** (BE validate cross-field; mismatch → 422)
- BE response: `CommonResponse<LoginResultData>` (GH-295) — `data.tokens.*`, `data.challenge=null`
- onSuccess — mirror chính xác useLogin (theo thứ tự):
  ```
  1. saveTokens(data.tokens.accessToken, data.tokens.refreshToken)   // GH-295: đọc data.tokens.*
  2. const user = decodeToken(data.tokens.accessToken)
  3. if (user.role === 'CUSTOMER') { clearTokens(); toast.error(...); return; }  // guard nhất quán với useLogin
  4. setSession(user)
  5. queryClient.setQueryData(QUERY_KEY.currentUser.session(), user)   // ← bắt buộc, không bỏ
  6. navigate(redirectByRole(user.role), { replace: true })
  ```
- Error 401: "Link mời không hợp lệ hoặc đã hết hạn (72h). Liên hệ Admin để gửi lại." — không redirect
- Error 422: `confirmPassword` không khớp — hiện lỗi dưới field (handleErrorApi setError)
- Error 409: "Tài khoản đã được kích hoạt." — không redirect

### Admin AccountsPage — row actions
- Mỗi row có dropdown menu (MoreHorizontal): Edit, Change Status, Change Role, View Sessions/History, Delete
- Nếu `account.status === Locked`: thêm "Mở khóa" menu item → click → inline `AlertDialog` confirm → gọi `useAdminUnlockAccount` (không có file dialog riêng)
- Nếu `account.role === "Staff"` (so sánh sau `.toUpperCase()`): thêm "Edit Staff Profile" menu item
- Toolbar: "Invite User" button + "Create Account" button
- Mỗi mutation hook cần `onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY.admin.accounts })` (hoặc key tương ứng)

### Admin RolesPage — lưu ý type cast hiện tại
`RolesPage.tsx` hiện có type cast guard `const raw = data as unknown; const roles = Array.isArray(raw) ? ...` — **giữ nguyên, không fix trong scope này**. Khi modify file để wire dialogs, không chạm vào data-fetching logic này để tránh scope creep.

### Admin RolesPage — row actions
- Mỗi row có dropdown: Edit (name/desc), Change Status, Manage Permissions, Delete
- `isSystemRole = true` → ẩn Delete button
- PermissionsDialog: load all permissions + current role permissions → checkbox list → PUT (replace)
  - Khi submit với 0 permission được chọn: inline `AlertDialog` "Bạn sắp xóa toàn bộ permissions khỏi role này. Xác nhận?" → confirm → PUT `permissionIds: []`
- Mỗi mutation hook cần `onSuccess` invalidate `KEY.admin.roles` (hoặc `QUERY_KEY.admin.roles.permissions(roleId)`)

### AuditLogsPage
- Table: createdAt, actorAccountId, action (actionName), targetEmail, isSuccess, ipAddress
- Filter bar: action select, isSuccess toggle, fromUtc/toUtc date inputs
- Pagination với pageSize 20

### Router changes
```
/invite/accept        → AuthLayout > AcceptInvitePage (public, ngoài ProtectedRoute)
/admin/profile        → AppLayout > ProfilePage
/manager/profile      → AppLayout > ProfilePage
/staff/profile        → AppLayout > ProfilePage
/admin/settings       → <Navigate to="/settings" replace /> (route /settings đã tồn tại → AccountSettingsPage)
/manager/settings     → <Navigate to="/settings" replace />
/staff/settings       → <Navigate to="/settings" replace />
/admin/audit-logs     → AppLayout > AuditLogsPage
```
> `/settings` đã tồn tại trong router hiện tại (ProtectedRoute → AccountSettingsPage) — redirect hợp lệ.
> `AccountSettingsPage` đã tồn tại tại `src/features/auth/pages/AccountSettingsPage.tsx` — KHÔNG tạo mới.

## Edge Cases

- `profile: null` trong AccountDto — form fields empty, submit vẫn OK (BE tạo row mới)
- Accept invite 401 → hiện "link không hợp lệ/hết hạn" message, không redirect
- Accept invite 422 → confirmPassword mismatch → setError dưới field
- Accept invite 409 → "Đã kích hoạt, đăng nhập bình thường"
- PermissionsDialog `permissionIds: []` → xóa hết permissions — thêm confirm dialog
- `isSystemRole = true` → disable Delete button trên RolesPage
- ChangeRole: roleId mới trùng roleId hiện tại → idempotent, không báo lỗi
- AccountStatusEnum.PendingVerification = 0 → valid, không treat là falsy
- displayAvatarUrl null → hiển thị initials avatar (đã có trong Topbar logic)

## Acceptance Criteria

- [ ] ProfilePage render đúng data từ `GET /api/auth/me`, edit thành công → toast success
- [ ] Avatar upload flow: chọn file → upload → gắn fileId → hiển thị avatar mới
- [ ] Accept Invite: token valid → set password → login → redirect đúng role dashboard
- [ ] Accept Invite: token hết hạn → hiện error message phù hợp
- [ ] AccountsPage: invite/create/edit/change-status/change-role/unlock/delete đều có dialog + hoạt động
- [ ] AccountDetailDrawer: hiện sessions list + có thể revoke; hiện login history table
- [ ] Staff role account → "Edit Staff Profile" dialog mở được, save staff profile + skills
- [ ] RolesPage: create/edit/status/delete dialogs hoạt động, system role không có delete button
- [ ] PermissionsDialog: load permissions, check/uncheck, save → invalidate role permissions cache
- [ ] AuditLogsPage: hiện tại `/admin/audit-logs`, data load được, filter hoạt động
- [ ] Route `/admin/settings`, `/manager/settings`, `/staff/settings` → redirect `/settings`
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS

## Steps

- [x] Bước 1: Types + schemas — `AcceptInviteFormValues`, `AcceptInvitePayload` (gồm `confirmPassword` — C4), `ChangeAccountRolePayload { roleId: string }` (vào `admin.types.ts`), `profile.schema.ts`, `accept-invite.schema.ts`, `admin-account.schema.ts` (status field: `z.nativeEnum(AccountStatusEnum)`), `role.schema.ts`, `staff-profile.schema.ts` — 2026-06-06 · ⚠️ rework C4/C5 (payload+errors)
- [x] Bước 2: Missing service + hook — `endpoints.ts` (ROLE), `auth.service.ts` (acceptInvite), `admin-accounts.service.ts` (changeRole với `ChangeAccountRolePayload`), `useAcceptInvite.ts`, `useAdminChangeAccountRole` — 2026-06-06
- [x] Bước 3: Accept Invite — `AcceptInvitePage.tsx` + wire router `/invite/accept` — 2026-06-06
- [x] Bước 4: ProfilePage — `ProfilePage.tsx` (GET/PUT profile + avatar upload) + wire router `/admin|manager|staff/profile` + fix AppLayout links + settings redirects — 2026-06-06
- [x] Bước 5: Admin AccountsPage dialogs — Invite, Create, Edit, ChangeStatus, ChangeRole, Unlock, Delete — 2026-06-06
- [x] Bước 6: Admin AccountDetailDrawer — sessions list + revoke + login history — 2026-06-06
- [x] Bước 7: EditStaffProfileDialog — staff profile fields + skills CRUD; wire vào AccountsPage — 2026-06-06
- [x] Bước 8: Admin RolesPage dialogs — Create, Edit, ChangeStatus, Delete + PermissionsDialog — 2026-06-06
- [x] Bước 9: AuditLogsPage + thêm vào ADMIN_NAV + route `/admin/audit-logs` — 2026-06-06
- [x] Bước 10: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS — 2026-06-06

## Câu hỏi đã giải đáp

| Câu hỏi | Trả lời |
|---------|---------|
| Accept invite response có trả tokens không? | **Có** — response = `LoginResultDto` (GH-295): `data.tokens.*`, `data.challenge=null`. Flow `saveTokens(data.tokens.*)` → auto login. |
| `AcceptInvitePayload` vs form values? | `AcceptInviteFormValues { password, confirmPassword }` (Zod). `AcceptInvitePayload { invitationToken, password, confirmPassword }` — **gửi đủ 3 field** (BE validate cross-field, mismatch 422). Xem C4. |
| Accept invite token hết hạn trả status nào? | **`401`** (không phải 410 — BE không có nhánh 410). confirmPassword mismatch = `422`, đã active = `409`. Xem C5. |
| UnlockAccount có cần dialog riêng? | Không — inline `AlertDialog` confirm trong AccountsPage, gọi thẳng `useAdminUnlockAccount`. Không có file component riêng. |
| PermissionsDialog khi `permissionIds: []` xử lý thế nào? | Inline `AlertDialog` trong `PermissionsDialog.tsx` — không cần file riêng. |
| `/admin/settings` redirect target là gì? | Redirect `<Navigate to="/settings" replace />` — `/settings` đã tồn tại trong router → `AccountSettingsPage`. |
| `AccountSettingsPage` đã tồn tại chưa? | **Đã có** tại `src/features/auth/pages/AccountSettingsPage.tsx` — KHÔNG tạo lại. |
| ADMIN_NAV nằm ở đâu? | Trong `src/shared/components/layout/AppLayout.tsx` (constant ADMIN_NAV, MANAGER_NAV, STAFF_NAV). |
| Profile đặt ở đâu? | Route `/role/profile` trong AppLayout, 1 component `ProfilePage` dùng chung 3 role. |
| AppLayout/Sidebar/Header còn cần làm gì? | Đã done — chỉ sửa Topbar link + thêm nav items (AuditLogs, Profile). |
| AuditLogsPage có trong scope? | Có — thêm ADMIN_NAV item + route + page mới. |
| Staff management: page riêng hay dialog? | Dialog only — `EditStaffProfileDialog` mở từ row action trong AccountsPage. |
| `changeRole` hook có sẵn chưa? | Chưa — thêm `ROLE` endpoint vào `endpoints.ts`, rồi thêm service method + hook trong bước 2. |
| `ChangeAccountRolePayload` body shape là gì? | `{ roleId: string }` — xác nhận từ api-auth.md §5 `PUT /api/admin/accounts/{id}/role`. |
| `AcceptInvite` onSuccess cần `setQueryData` không? | **Có** — bắt buộc mirror `useLogin`: `queryClient.setQueryData(QUERY_KEY.currentUser.session(), user)` để components đang `useQuery(QUERY_KEY.currentUser.session())` nhận user mới ngay, không phải đợi refetch. |
| CUSTOMER guard trong `useAcceptInvite`? | Thêm để nhất quán với `useLogin` (Admin không nên invite Customer vào web, nhưng guard là safety net). |
| Gap 3: profile cache invalidation có đúng không? | **Đúng** — `useUpdateProfile`/`useUpdateAvatar` dùng `[KEY.profile]`, prefix-match `QUERY_KEY.profile.me()` = `[KEY.profile, "me"]`. TanStack Query invalidate toàn bộ queries có prefix `[KEY.profile]`. Không cần sửa. |
| RolesPage type cast `data as unknown` — fix hay giữ? | **Giữ nguyên** — bug ngoài scope, fix riêng ở issue khác. Khi wire dialogs không chạm data-fetching logic. |
