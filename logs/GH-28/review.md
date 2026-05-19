# BÁO CÁO CODE REVIEW — GH-28: Auth Profile, Staff & Sessions — 2026-05-20

## TÓM TẮT
Data layer only (no UI): types, 3 service files, 8 hooks cho Auth Profile (Nhóm 3) + Session Management (Nhóm 4). `tsc --noEmit`, `eslint --max-warnings=0`, `npm run build` PASS.

---

## PHÂN TÍCH

### ✅ Pass — Quality gates

| Kiểm tra | Kết quả |
|----------|---------|
| `npx tsc --noEmit` | ✅ 0 lỗi |
| `npx eslint src --max-warnings=0` | ✅ 0 warning |
| `npm run build` | ✅ thành công |

### ✅ Pass — GH-28 scope

- `shared/types/account.types.ts` tạo đúng: AccountDto, AccountProfileDto, StaffProfileDto, StaffSkillDto, AccountStatusEnum, AvatarSourceEnum ✅
- `features/auth/types/auth.types.ts` thêm đúng: SessionDto, RefreshTokenStatus, UpdateProfilePayload, UpdateAvatarPayload, RevokeAllSessionsPayload ✅
- 3 service files: `profile.service.ts`, `session.service.ts`, `staff.service.ts` ✅
- `features/staff/` tạo đúng cấu trúc: hooks + services + types (không vi phạm feature isolation) ✅
- `useSessions`: `staleTime: 0, refetchOnWindowFocus: true` ✅
- `useProfile`: trong `queryKeys.ts` — staleTime default (2 phút từ QueryClient) ✅
- `useRevokeAllSessions`: invalidate `[KEY.sessions]` (array-wrapped) ✅
- `StaffAssignmentProfileDto` đặt ở `shared/types/account.types.ts` (cross-feature GH-28 + admin) ✅
- Services không hardcode URL, dùng `ENDPOINTS.*` ✅
- Hooks không gọi axiosInstance trực tiếp ✅

### ✅ Pass — Cross-feature isolation

`features/staff/hooks/useStaffList.ts` có comment `// Admin/Manager cần hook này → KHÔNG import xuyên feature` (theo plan) ✅

---

## RỦI RO & LƯU Ý

- `StaffProfileDto.notes?: string` — nullable theo API doc, cần confirm với BE trước khi merge (đã ghi trong plan blocker)
- `revokeAllSessions` với `currentRefreshToken: Cookies.get('refreshToken')` — cookie rotation risk đã noted trong plan

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Data layer đúng hoàn toàn. Sẵn sàng chạy `/kltn-test 28`.
