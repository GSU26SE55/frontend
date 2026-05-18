## BÁO CÁO CODE REVIEW — feature/GH-11-flow-authentication — 2026-05-18
### Scope: FE (Web)
### Effort: Deep (63 files — auth foundation + shared infrastructure)

---

### TÓM TẮT

Nền tảng auth implement đúng kiến trúc. Critical bug đã được fix — `GoogleCallbackPage` giờ block CUSTOMER role + clearTokens + toast + navigate('/login') nhất quán với `useLogin` flow. Tất cả quality gates pass.

---

### PHÂN TÍCH

#### ✅ Fixed: `src/features/auth/pages/GoogleCallbackPage.tsx:25–32`
— Đã thêm CUSTOMER block sau khi decode token:
```ts
if (user.role === 'CUSTOMER') {
  clearTokens();
  toast.error('Vui lòng sử dụng Mobile App để đăng nhập.');
  navigate('/login', { replace: true });
  return;
}
```
Nhất quán với `useLogin.onSuccess` — Customer không còn bị kẹt với active session.

---

#### 🟡 Warning (không block ship — ghi nhận cho các ticket sau)

**`src/shared/utils/endpoints.ts:21–28`** — `ENDPOINTS.USERS.*` dùng path sai.
- Hiện tại: `/api/users/*` → Đúng: `/api/admin/accounts/*`
- Chưa có code nào consume ENDPOINTS.USERS → chưa lỗi runtime
- Cần rename → `ADMIN_ACCOUNTS` với đúng paths **trước khi implement Admin ticket đầu tiên**

**`src/shared/utils/endpoints.ts:67–69`** — `ENDPOINTS.AUDIT_LOGS.LIST` path sai.
- Hiện tại: `/api/audit-logs` → Đúng: `/api/admin/audit-logs`
- Cùng lý do — cần fix cùng lúc với ENDPOINTS.USERS rename

**`LoginForm.tsx` / `RegisterForm.tsx` / `ResetPasswordForm.tsx`** — Form submit dùng `mutate` + closure-captured `setError` trong `onError` thay vì `mutateAsync` + `try-catch` theo fe.md prescription. Functionally equivalent (setError vẫn được gọi), nhưng lệch convention. Ghi nhận để đồng nhất trong các ticket form sau.

**Bundle size 559 kB** — Cần `React.lazy` + dynamic import trong router khi Admin/Manager/Staff pages được thêm vào Sprint 2/3.

---

#### ✅ Pass: Architecture
- Không có API call trực tiếp trong component — tất cả qua `services/` → hooks ✅
- Feature isolation: `features/auth` không import từ `features/admin|manager|staff` ✅
- Single axios instance (`shared/lib/axios.ts`) ✅
- Zustand (`sessionStore`) chỉ dùng cho auth session ✅

#### ✅ Pass: Auth & Security
- Route tree: `/admin/*`, `/manager/*`, `/staff/*` đều wrap `ProtectedRoute` + `RoleRoute` ✅
- Public routes (login, register, forgot-password, callback) không có ProtectedRoute ✅
- `isHydrating` guard trong `ProtectedRoute` — không flash redirect khi boot ✅
- 3-case boot logic trong `AuthContext` đúng spec ✅
- Token chỉ lưu cookie (`js-cookie`), không có `localStorage` ✅
- Google OAuth: `replaceState` xóa token khỏi URL trước khi xử lý ✅
- CUSTOMER block: `useLogin.onSuccess` ✅ + `GoogleCallbackPage` ✅ (fixed)

#### ✅ Pass: Token Refresh
- `isRefreshing` flag + `pendingQueue` chống double-refresh ✅
- `tryRefresh` timeout 10s ✅
- `finally` flush queue → reset flag (đúng thứ tự, không deadlock) ✅
- 401 fallback trong response interceptor ✅
- Clock skew buffer 30s ✅

#### ✅ Pass: Error Handling
- `EntityError` → `setError` map field dưới input ✅
- `HttpError` → `toast.error` ✅
- `useLogout` dùng `onSettled` — luôn clear tokens dù API fail ✅

#### ✅ Pass: UX Flows
- OTP resend countdown 60s + disable button ✅
- `OtpVerifyPage` guard `if (!location.state?.email) → navigate('/register')` ✅
- `ForgotPasswordPage` countdown resetToken 5 phút + auto reset step 1 ✅
- Loading state đầy đủ trên tất cả form buttons ✅
- Không có `console.log` (chỉ `console.error` trong GoogleCallbackPage — intentional) ✅

#### ✅ Pass: Quality Gates
- `tsc --noEmit` — 0 errors ✅
- `eslint --max-warnings=0` — 0 warnings ✅
- `npm run build` — success ✅

---

### RỦI RO & LƯU Ý

- **Multi-tab logout/refresh race:** Known Limitation đã document trong plan — không fix Sprint 1
- **Cookie không httpOnly:** Acknowledged security risk, acceptable cho capstone scope
- **ENDPOINTS.USERS / AUDIT_LOGS paths sai:** Sẽ gây bug âm thầm khi Admin ticket bắt đầu — phải fix trước
- **Bundle size:** Code-split cần thiết trước Sprint 3

---

### KẾT LUẬN
**PASS** — Độ tự tin: Cao

Critical bug đã fix. Chạy `/kltn-test GH-11` để tiếp tục.
