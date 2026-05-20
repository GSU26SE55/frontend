## BÁO CÁO CODE REVIEW — feature/GH-11-flow-authentication — 2026-05-20
### Scope: FE (Web)
### Effort: Deep

---

### TÓM TẮT

Code nền tảng auth (axios interceptor, sessionStore, ProtectedRoute, hooks, service) đúng pattern và sạch. Phát hiện 1 Critical: `AccountSettingsPage` hardcode `isEnabled={false}` cho TwoFactorSetup trong khi `AccountDto.twoFactorEnabled` đã sẵn có từ `useCurrentUser`.

---

### PHÂN TÍCH

🔴 **Critical**

- `src/features/auth/pages/AccountSettingsPage.tsx:17`
  — `<TwoFactorSetup isEnabled={false} />` hardcoded → UI luôn hiển thị "Chưa bật 2FA" dù user đã bật
  — Fix: dùng `useCurrentUser()` → `account?.twoFactorEnabled ?? false`

---

🟡 **Warning**

- `src/features/auth/pages/AccountSettingsPage.tsx:18`
  — `<GoogleLinkSection isLinked={false} />` hardcoded
  — `AccountDto` không có field `isGoogleLinked` tường minh; cần xác nhận với BE cách detect (có thể từ `avatarSource === AvatarSourceEnum.Google` hoặc field riêng)
  — Tạm thời nên connect qua `useCurrentUser` khi có đủ data

- `src/features/landing/pages/LandingPage.tsx:33`
  — `console.log("LandingPage user:", user)` — debug statement
  — Pre-existing trên `origin/dev` (không do branch này thêm), nhưng sẽ ship nếu không xóa trước merge. Nên xóa ở đây hoặc tạo separate fix commit trên dev.

- `src/features/auth/services/auth.service.ts` + `src/features/auth/services/profile.service.ts`
  — Cả hai đều có `getMe()` gọi cùng `ENDPOINTS.AUTH.ME` — minor duplication
  — Nên chọn 1 source duy nhất (ưu tiên `profileService.getMe()` hoặc xóa bản trong `authService`)

---

✅ **Pass**

- Architecture: API 100% qua `services/` → hook, không fetch trực tiếp trong component
- Feature isolation: `features/admin` chỉ import từ `features/admin`, không cross-feature
- Auth wrap: `/settings` đúng bên trong `ProtectedRoute` — không có route auth-required nào bỏ sót
- Error handling: form mutations dùng `try-catch` + `handleErrorApi({ error, setError })`; non-form mutations dùng `onError` callback
- QueryKey: `QUERY_KEY` factory dùng nhất quán, không inline array
- invalidateQueries: dùng `KEY` root (broad invalidation)
- Token storage: js-cookie only, không có `localStorage`
- Axios: dùng `shared/lib/axios` instance, không tạo mới
- TypeScript: `tsc --noEmit` → 0 lỗi
- ESLint: `eslint . --max-warnings=0` → 0 warning

---

### RỦI RO & LƯU Ý

- `AccountSettingsPage` + account settings components (ChangeEmail, PhoneVerify, TwoFactor, GoogleLink, DangerZone, LoginHistory) + admin/staff hooks nằm ngoài scope GH-11 ban đầu — xem xét move sang ticket riêng nếu chưa có review
- `useCurrentUser` hook tồn tại nhưng chưa được dùng tại `AccountSettingsPage` — thiếu liên kết dữ liệu thực

---

### KẾT LUẬN

**FAIL** — Độ tự tin: **Cao**

Fix 1 Critical trước khi ship: truyền `account?.twoFactorEnabled` thay vì `false` vào `TwoFactorSetup`.
