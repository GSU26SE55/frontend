# BÁO CÁO CODE REVIEW — GH-30: Admin Account Management — 2026-05-20

## TÓM TẮT
Data layer cho 5 nhóm Admin API (Nhóm 5–9): types, 5 service files, 5 hook files. `tsc --noEmit`, `eslint --max-warnings=0`, `npm run build` PASS.

---

## PHÂN TÍCH

### ✅ Pass — Quality gates

| Kiểm tra | Kết quả |
|----------|---------|
| `npx tsc --noEmit` | ✅ 0 lỗi |
| `npx eslint src --max-warnings=0` | ✅ 0 warning |
| `npm run build` | ✅ thành công |

### ✅ Pass — GH-30 scope

- `admin.types.ts`: RoleDto, PermissionDto, AuditLogDto, SessionDto, LoginAttemptDto, AuditActionEnum (40+ values), RoleStatusEnum, LoginAttemptResult, tất cả request payloads ✅
- `shared/types/account.types.ts`: AccountDto, AccountProfileDto, StaffProfileDto, StaffSkillDto, AccountStatusEnum, RefreshTokenStatus, StaffAssignmentProfileDto ✅
- 5 service files: admin-accounts, admin-staff, admin-roles, admin-permissions, admin-audit-logs ✅
- 5 hook files: useAdminAccounts (11 hooks), useAdminStaff (3), useAdminRoles (6), useAdminPermissions (3), useAdminAuditLogs (1) ✅
- `KEY.admin.accounts` là array `['admin', 'accounts']` → `invalidateQueries({ queryKey: KEY.admin.accounts })` đúng ✅
- `useAdminRevokeAllSessions` invalidate đúng `QUERY_KEY.admin.accounts.sessions(id)` (không invalidate cả list) ✅
- `useAdminAccountDetail/AccountSessions/LoginHistory` có `enabled: !!id` ✅
- `PERMISSIONS.BY_ROLE` và `SET_FOR_ROLE` cùng path nhưng khác method (axios.get vs axios.put) ✅

### ✅ Pass — Type imports

`admin.types.ts` import `AccountStatusEnum, RefreshTokenStatus` từ `@/shared/types/account.types` (không duplicate) ✅

---

## RỦI RO & LƯU Ý

- `useAdminDeleteAccount`: không có `onError` handler — mutations không có form nên cần thêm `onError: (error) => handleErrorApi({ error })`. Hiện tại delete thất bại (409 conflict) sẽ không toast. Không block nhưng nên fix khi implement UI.
- `StaffAssignmentProfileDto` trong `shared/types` — không phải trong `features/staff` (đúng, cross-feature với GH-28)

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Data layer đúng và đầy đủ. Sẵn sàng chạy `/kltn-test 30`.
