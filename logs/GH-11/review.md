## BÁO CÁO CODE REVIEW — feature/GH-11-flow-authentication — 2026-05-15
### Scope: FE (Web)
### Effort: Deep (63 files, full auth foundation)

---

### TÓM TẮT

Nền tảng auth được implement đúng kiến trúc (feature isolation, single axios instance, RBAC, 3-case hydration). Critical bug đã được fix — `ResetOtpVerifyForm` giờ dùng đúng `useResendResetOtp` → `POST /api/auth/resend-reset-otp`. Tất cả gates pass.

---

### PHÂN TÍCH

✅ **Fixed: `src/features/auth/components/ResetOtpVerifyForm.tsx:13`**
— Đã thay `useResendOtp` bằng `useResendResetOtp` → `authService.resendResetOtp` → `POST /api/auth/resend-reset-otp`

✅ **Fixed: `src/features/auth/components/ResetPasswordForm.tsx:26`**
— Đã bỏ type cast `setError as Parameters<typeof useResetPassword>[0]`
— `useResetPassword` giờ nhận `UseFormSetError<{ newPassword: string; confirmPassword: string }>` — đúng với form type

✅ **Pass: Architecture**
- Không có API call trực tiếp trong component — tất cả qua `auth.service.ts` → hooks ✅
- Feature isolation: `features/auth` không import từ `features/admin|manager|staff` ✅
- Single axios instance: tất cả call dùng `axiosInstance` từ `shared/lib/axios.ts` ✅
- Zustand (`sessionStore`) chỉ dùng cho auth session ✅

✅ **Pass: Error Handling**
- `handleErrorApi` xử lý 400/422 → `EntityError` (map field), các status khác → `HttpError` (toast) ✅
- `useLogin`, `useRegister`, `useResetPassword` truyền `setError` cho form field mapping ✅
- `useLogout`: `onSettled` always clear tokens dù API fail hay pass ✅

✅ **Pass: Auth & Security**
- Route tree: `/admin/*`, `/manager/*`, `/staff/*` đều wrap `ProtectedRoute` + `RoleRoute` ✅
- Public routes (login, register, forgot-password, callback) KHÔNG có ProtectedRoute — đúng ✅
- Token KHÔNG lưu localStorage — chỉ dùng `js-cookie` ✅
- Google OAuth: `replaceState` xóa token khỏi URL ngay trước khi xử lý ✅
- CUSTOMER role bị block ở `useLogin.onSuccess` với toast + clearTokens ✅
- `isHydrating` guard trong `ProtectedRoute` — không flash redirect khi boot ✅

✅ **Pass: Code Quality**
- Không có `console.log` (chỉ `console.error` trong GoogleCallbackPage — intentional per plan) ✅
- Không hardcode URL — tất cả dùng `ENDPOINTS` constant ✅
- Loading state đầy đủ trên tất cả form buttons ✅
- Build: `tsc --noEmit` ✅ | `eslint --max-warnings=0` ✅ | `npm run build` ✅

---

### RỦI RO & LƯU Ý

- **Multi-tab logout/refresh race**: Known Limitation đã document trong plan — không fix Sprint 1
- **Cookie không httpOnly**: Acknowledged security risk, acceptable for capstone scope
- **`src/shared/context/authContext.tsx`**: linter modified trailing newline — không ảnh hưởng logic

---

### KẾT LUẬN
**PASS** — Độ tự tin: Cao

Tất cả Critical bugs đã fix. Chạy `/kltn-test GH-11` để tiếp tục.
