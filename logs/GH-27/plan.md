# Plan — GH-27: [FE] Implement Account Settings — /api/accounts/me

## Metadata
- **Status:** SHIPPED → **NEEDS REWORK (GH-295)** | **Role:** FE | **Ngày:** 2026-05-20, cập nhật 2026-06-14
- **Issue:** #27 — https://github.com/GSU26SE55/frontend/issues/27
- **Sprint:** Sprint 1 (deadline 2026-05-30)

---

## ⚠️ GH-295 Contract Update (2026-06-14) — SỬA TRƯỚC KHI FIX CODE

> SHIPPED 2026-05-20, trước GH-295. `docs/api-auth.md` đã đổi flow 2FA. Phần Types/Endpoints/Workflow cũ phía dưới lỗi thời ở chỗ được đánh dấu. **Đã đối chiếu codebase** — trạng thái thực tế ghi từng mục.

### C1 — 🔴 2FA enable flow CŨ đã bị thay (endpoint trả 410)

**Code hiện tại (đã verify):**
- `account.service.ts:43` `enableTwoFactor()` POST `/2fa/enable` body rỗng → doc [api-auth.md §`/2fa/enable`](../../docs/api-auth.md) endpoint này **luôn trả `410 Gone`**.
- `account.service.ts:48` `disableTwoFactor()` POST `/2fa/disable` body rỗng → doc yêu cầu body **bắt buộc** `{password, totpCode}`.
- `endpoints.ts:28-29` chỉ có `TWO_FA_ENABLE` + `TWO_FA_DISABLE` — thiếu hết endpoint GH-295.
- `TwoFactorSetup.tsx` comment "2FA kích hoạt ngay — không có bước confirm" → trái flow mới.

**Phải thay bằng flow 2 bước (doc §`/2fa/init`, §`/2fa/confirm`):**

| Endpoint mới | Body | Response data |
|---|---|---|
| `POST /api/accounts/me/2fa/init` | — | `{ secret, otpAuthUri, pendingToken }` |
| `POST /api/accounts/me/2fa/confirm` | `{ pendingToken, code }` | `{ enabled: true, backupCodes: string[8] }` (hiện 1 lần) |
| `POST /api/accounts/me/2fa/disable` | `{ password, totpCode }` | `Guid` |
| `POST /api/accounts/me/2fa/backup-codes/regenerate` | `{ totpCode }` | `{ backupCodes: string[8] }` |

→ `endpoints.ts` thêm `TWO_FA_INIT`, `TWO_FA_CONFIRM`, `TWO_FA_BACKUP_REGEN`; bỏ/deprecate `TWO_FA_ENABLE`.
→ `TwoFactorSetup` đổi thành wizard: init (render QR từ `otpAuthUri` + `secret`) → nhập 6 số → confirm → hiển thị 8 backup codes (modal bắt buộc "Tôi đã lưu").
→ `DisableTwoFactorForm` mới: 2 input `password` + `totpCode`.
→ Thêm `RegenerateBackupCodesModal` (nhập `totpCode`).

### C2 — 🟠 Types 2FA mới

`account.types.ts`:
```ts
// BỎ: EnableTwoFactorResponseData { secret, otpAuthUri }  ← thiếu pendingToken
export interface Init2faResponseData { secret: string; otpAuthUri: string; pendingToken: string; }
export interface Confirm2faPayload { pendingToken: string; code: string; }
export interface Confirm2faResponseData { enabled: boolean; backupCodes: string[]; }
export interface Disable2faPayload { password: string; totpCode: string; }
export interface RegenBackupCodesPayload { totpCode: string; }
export interface RegenBackupCodesResponseData { backupCodes: string[]; }
```

### C3 — ✅ `totalCount` vs `totalItems` — ĐÃ CHECK BE: code ĐÚNG, DOC SAI

- **BE (verified):** `shared/src/SharedContracts/Common/Responses/PaginationResponse.cs:6` → `public int TotalItems` (+ `TotalPages`, `HasNextPage`). JSON serialize ra **`totalItems`**.
- **Code FE (verified):** `api.types.ts:15` + `account.types.ts:58` dùng `totalItems` → **khớp BE, không sửa.**
- **Doc SAI:** [api-auth.md login-history](../../docs/api-auth.md) ghi `"totalCount": 42` — cần sửa DOC, không sửa code.
- → **Hành động:** sửa `docs/api-auth.md` các response phân trang `totalCount` → `totalItems`. Code giữ nguyên.

### C4 — 🟢 change-email / confirm-email-change: enable lại

Plan gốc đánh dấu 2 endpoint "CHƯA CÓ TRONG SWAGGER, pending BE" ([Endpoints dòng 161-162](#endpoints)). Doc [api-auth.md §`/change-email`, §`/confirm-email-change`](../../docs/api-auth.md) nay đã document đầy đủ. Code đã có sẵn (`account.service.ts:22-32`) → enable UI trong `ChangeEmailForm` (nếu đang bị comment out).

### C5 — 🟢 Login response shape (gián tiếp)

`AccountSettingsPage` không gọi login, nhưng nếu bất kỳ flow nào ở đây redirect qua login lại thì phụ thuộc fix GH-11 C1. Không cần sửa trong ticket này.

## Mục tiêu
Triển khai types, endpoints, service, hooks, schemas, components và page cho trang cài đặt tài khoản cá nhân tại route `/settings`. Bao gồm 12 endpoints Nhóm 2 (`/api/accounts/me`): đổi mật khẩu, đổi email (2-step OTP), xác thực SĐT, 2FA TOTP, liên kết Google, deactivate/delete account, và lịch sử đăng nhập.

## Scope
**Trong scope:**
- Types, endpoints, service, hooks, schemas cho 12 endpoints
- 6 form section components + 1 `LoginHistoryTable` + 1 page `AccountSettingsPage` (7 components total)
- Route `/settings` dưới `ProtectedRoute` (không `RoleRoute` — mọi role đều vào được)
- Package `qrcode.react` cho render QR code 2FA
- Package `@react-oauth/google` + wrap `App.tsx` trong `GoogleOAuthProvider` cho link-google

**Ngoài scope:**
- AppLayout (Sidebar, Header) — ticket riêng
- `GET /api/auth/me` (Nhóm 3) — ticket riêng
- `PUT /api/auth/me/profile` (Nhóm 3) — ticket riêng
- Avatar upload — ticket riêng

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | Thêm `ACCOUNTS.ME` group (12 path) |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `KEY.loginHistory` + `QUERY_KEY.loginHistory` |
| `src/features/auth/types/account.types.ts` | create | Payloads, response types, enums |
| `src/features/auth/services/account.service.ts` | create | 12 service methods |
| `src/features/auth/schemas/change-password.schema.ts` | create | |
| `src/features/auth/schemas/change-email.schema.ts` | create | |
| `src/features/auth/schemas/confirm-otp.schema.ts` | create | Dùng chung cho confirm-email + verify-phone |
| `src/features/auth/hooks/useChangePassword.ts` | create | useMutation |
| `src/features/auth/hooks/useChangeEmail.ts` | create | useMutation |
| `src/features/auth/hooks/useConfirmEmailChange.ts` | create | useMutation |
| `src/features/auth/hooks/useSendPhoneOtp.ts` | create | useMutation |
| `src/features/auth/hooks/useVerifyPhoneOtp.ts` | create | useMutation |
| `src/features/auth/hooks/useEnableTwoFactor.ts` | create | useMutation |
| `src/features/auth/hooks/useDisableTwoFactor.ts` | create | useMutation |
| `src/features/auth/hooks/useLinkGoogle.ts` | create | useMutation |
| `src/features/auth/hooks/useUnlinkGoogle.ts` | create | useMutation |
| `src/features/auth/hooks/useDeactivateAccount.ts` | create | useMutation |
| `src/features/auth/hooks/useDeleteAccount.ts` | create | useMutation |
| `src/features/auth/hooks/useLoginHistory.ts` | create | useQuery + pagination params |
| `src/features/auth/components/ChangePasswordForm.tsx` | create | |
| `src/features/auth/components/ChangeEmailForm.tsx` | create | 2-step: request email → OTP confirm |
| `src/features/auth/components/PhoneVerifySection.tsx` | create | Send OTP + verify OTP + 60s countdown |
| `src/features/auth/components/TwoFactorSetup.tsx` | create | Enable (QR + secret) / Disable toggle |
| `src/features/auth/components/GoogleLinkSection.tsx` | create | Link / Unlink Google |
| `src/features/auth/components/DangerZone.tsx` | create | Deactivate + Delete với confirm dialog |
| `src/features/auth/components/LoginHistoryTable.tsx` | create | Bảng phân trang shadcn Table |
| `src/features/auth/pages/AccountSettingsPage.tsx` | create | Page tổng hợp 6 sections |
| `src/App.tsx` | modify | Wrap `GoogleOAuthProvider` từ `@react-oauth/google` |
| `src/router/index.tsx` | modify | Thêm `/settings` route dưới `ProtectedRoute` |

## Enums

> **Note (thêm sau khi SHIPPED):** Enums được tách ra `src/shared/enums/` và `src/features/admin/enums/` — không define inline trong types.

| Enum | File |
|------|------|
| `AccountStatusEnum`, `AvatarSourceEnum`, `RefreshTokenStatus` | `shared/enums/account.enum.ts` |
| `LoginAttemptResult`, `AuditActionEnum` | `features/admin/enums/audit.enum.ts` |

## Types

```ts
// account.types.ts

// ChangePassword: BE expect đủ 3 fields (API docs line 602)
// Không tách FormValues/Payload — payload = form values trong trường hợp này
export interface ChangePasswordPayload {
  currentPassword: string; newPassword: string; confirmPassword: string;
}
export interface ChangeEmailPayload {
  newEmail: string; currentPassword: string;
}
export interface ConfirmEmailChangePayload { otp: string; }
// send-phone-otp: không có body (AccountId lấy từ JWT)
// verify-phone-otp: chỉ cần otp
export interface VerifyPhoneOtpPayload { otp: string; }
// 2fa/enable: không có body
// 2fa/disable: không có body
// deactivate: không có body
// delete: không có body
export interface EnableTwoFactorResponseData { secret: string; otpAuthUri: string; }
export interface LinkGooglePayload { idToken: string; }

export interface LoginHistoryParams {
  pageNumber?: number; pageSize?: number;
  result?: LoginAttemptResult; onlyFailed?: boolean;
  fromUtc?: string; toUtc?: string;
}

export enum LoginAttemptResult {
  Success = 1, WrongPassword = 2, AccountNotFound = 3, AccountLocked = 4,
  AccountSuspended = 5, AccountBanned = 6, AccountInactive = 7, AccountNotVerified = 8,
}

export interface LoginAttemptDto {
  id: string;
  accountId: string | null;
  attemptedEmail: string;
  result: LoginAttemptResult;
  resultName: string;
  method: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  note: string | null;
  createdAt: string;
}

export interface LoginHistoryResponseData {
  items: LoginAttemptDto[];
  totalItems: number;  // ← API dùng totalItems, không phải totalCount
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// AccountStatusEnum — mirror từ API contract
// PendingVerification = 0 là intentional exception (BE default state trước khi verify OTP)
// be.md quy định "enum bắt đầu từ 1" nhưng đây là FE mirror — phải map đúng giá trị BE trả về
export enum AccountStatusEnum {
  PendingVerification = 0,
  Active = 1,
  Locked = 2,
  Inactive = 3,
  Suspended = 4,
  Banned = 5,
}
```

## Schemas (Zod)

```ts
// change-password.schema.ts
currentPassword: z.string().min(1)
newPassword: z.string().min(8).max(100)
  .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/, 'Mật khẩu phải có chữ hoa, thường, số, ký tự đặc biệt')
confirmPassword: z.string() + .superRefine() check trùng newPassword

// change-email.schema.ts
newEmail: z.string().email().max(256)
currentPassword: z.string().min(1)

// confirm-otp.schema.ts
otp: z.string().length(6).regex(/^\d{6}$/, 'OTP gồm 6 chữ số')
```

## Endpoints

| Method | Path | ENDPOINTS key | Body |
|--------|------|--------------|------|
| PATCH | `/api/accounts/me/password` | `ACCOUNTS.ME.PASSWORD` | `ChangePasswordPayload` |
| POST | `/api/accounts/me/change-email` | `ACCOUNTS.ME.CHANGE_EMAIL` | `ChangeEmailPayload` | ⚠️ **CHƯA CÓ TRONG SWAGGER** — endpoint chưa được BE deploy, cần confirm trước khi implement |
| POST | `/api/accounts/me/confirm-email-change` | `ACCOUNTS.ME.CONFIRM_EMAIL_CHANGE` | `ConfirmEmailChangePayload` | ⚠️ **CHƯA CÓ TRONG SWAGGER** — endpoint chưa được BE deploy, cần confirm trước khi implement |
| POST | `/api/accounts/me/send-phone-otp` | `ACCOUNTS.ME.SEND_PHONE_OTP` | *(không có)* |
| POST | `/api/accounts/me/verify-phone-otp` | `ACCOUNTS.ME.VERIFY_PHONE_OTP` | `VerifyPhoneOtpPayload` |
| POST | `/api/accounts/me/2fa/enable` | `ACCOUNTS.ME.TWO_FA_ENABLE` | *(không có)* |
| POST | `/api/accounts/me/2fa/disable` | `ACCOUNTS.ME.TWO_FA_DISABLE` | *(không có)* |
| POST | `/api/accounts/me/link-google` | `ACCOUNTS.ME.LINK_GOOGLE` | `LinkGooglePayload` |
| POST | `/api/accounts/me/unlink-google` | `ACCOUNTS.ME.UNLINK_GOOGLE` | *(không có)* |
| POST | `/api/accounts/me/deactivate` | `ACCOUNTS.ME.DEACTIVATE` | *(không có)* |
| DELETE | `/api/accounts/me` | `ACCOUNTS.ME.DELETE` | *(không có)* |
| GET | `/api/accounts/me/login-history` | `ACCOUNTS.ME.LOGIN_HISTORY` | `LoginHistoryParams` (query) |

## Workflow

**Đổi mật khẩu:**
Submit form → `useChangePassword.mutateAsync` → OK: `clearSession()` + `Cookies.remove('accessToken')` + `Cookies.remove('refreshToken')` + `navigate('/login')` | FAIL: `handleErrorApi({ error, setError })`

**Đổi email (2-step):**
- Step 1: Submit `{newEmail, currentPassword}` → `useChangeEmail.mutateAsync` → OK: show OTP input | FAIL: `handleErrorApi({ error, setError })`
- Step 2: Submit `{otp}` → `useConfirmEmailChange.mutateAsync` → OK: `clearSession()` + `Cookies.remove('accessToken')` + `Cookies.remove('refreshToken')` + `navigate('/login')` | FAIL: toast

**Xác thực SĐT:**
Click "Gửi OTP" → `useSendPhoneOtp.mutate` → OK: show OTP input + 60s countdown
Submit OTP → `useVerifyPhoneOtp.mutateAsync` → OK: toast success

**2FA:**
Click "Bật 2FA" → `useEnableTwoFactor.mutate` → OK: show modal với QR code (qrcode.react) + secret text
*(2FA kích hoạt ngay — không có bước confirm thêm; cảnh báo user lưu secret)*
Click "Tắt 2FA" → confirm dialog → `useDisableTwoFactor.mutate`

**Link Google:**
Click "Liên kết Google" → `useGoogleLogin()` (react-oauth/google) → get `idToken` → `useLinkGoogle.mutate({ idToken })`
Click "Hủy liên kết" → confirm dialog → `useUnlinkGoogle.mutate()`

**Deactivate / Delete:**
Confirm dialog → mutate → OK: `clearSession()` + `Cookies.remove('accessToken')` + `Cookies.remove('refreshToken')` + `navigate('/login')`

**Login history:**
`useLoginHistory(params)` → `<LoginHistoryTable />` với shadcn `Table` + phân trang (`pageNumber`, `pageSize`)

## Edge Cases
- `confirmPassword`: Zod `superRefine` check trùng `newPassword` — không dùng `refine` để lỗi được attach đúng field
- Đổi email / đổi mật khẩu / deactivate / delete: token bị revoke phía server → FE bắt buộc gọi `clearSession()` + `Cookies.remove()` + `navigate('/login')` ngay sau response thành công
- 2FA secret: hiển thị 1 lần duy nhất — modal phải có cảnh báo "Lưu secret ngay, không thể xem lại"
- Send phone OTP: 60s cooldown → disable button + countdown timer (local `useState` countdown)
- Login history: API trả `totalItems` (không phải `totalCount`) — dùng `LoginHistoryResponseData` riêng, không reuse `PaginationResponse<T>` từ `api.types.ts`
- `@react-oauth/google` yêu cầu `VITE_GOOGLE_CLIENT_ID` env var — thêm vào `config/env.ts`
- **Đổi email (2 endpoints chưa có trong Swagger):** `ChangeEmailForm` và `useChangeEmail` / `useConfirmEmailChange` implement xong nhưng cần giữ ở trạng thái "pending BE". Cần confirm với BE trước khi enable UI. Nếu không kịp Sprint → comment out feature trong `AccountSettingsPage` (không xóa code)

## Endpoints bổ sung từ Swagger (ngoài scope GH-27, ghi nhận cho ticket sau)
| Method | Path | Ghi chú |
|--------|------|---------|
| GET | `/api/accounts/me/profile` | Lấy profile mở rộng (address, birthDate, timeZone) |
| PUT | `/api/accounts/me/profile` | Update profile: `{ fullName, phoneNumber, address, birthDate, timeZone }` — chú ý field tên là `birthDate` (không phải `dateOfBirth`) |

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| Đổi mật khẩu thành công → redirect /login | Test thủ công với BE local |
| Đổi email 2-step hoàn thành | Check OTP flow, email mới có hiệu lực |
| 2FA enable → QR code render đúng | Quét bằng Google Authenticator |
| Login history render bảng phân trang | Kiểm tra next/prev page |
| `tsc --noEmit` pass | `npx tsc --noEmit` không lỗi |
| `eslint --max-warnings=0` pass | `npx eslint . --max-warnings=0` |
| `npm run build` pass | Build không lỗi |

## Steps
- [x] Bước 1: Cài `qrcode.react` + `@react-oauth/google` — 2026-05-19
- [x] Bước 2: Thêm `ACCOUNTS.ME` vào `endpoints.ts`, thêm `loginHistory` vào `queryKeys.ts` — 2026-05-19
- [x] Bước 3: Tạo `account.types.ts` — 2026-05-19
- [x] Bước 4: Tạo `account.service.ts` (12 methods) — 2026-05-19
- [x] Bước 5: Tạo 3 schemas (`change-password`, `change-email`, `confirm-otp`) — 2026-05-19
- [x] Bước 6: Tạo 12 hooks (11 mutation + 1 query) — 2026-05-19
- [x] Bước 7: Tạo `ChangePasswordForm`, `ChangeEmailForm`, `PhoneVerifySection`, `TwoFactorSetup`, `GoogleLinkSection`, `DangerZone`, `LoginHistoryTable` — 2026-05-19
- [x] Bước 8: Tạo `AccountSettingsPage` (ghép 6 sections + LoginHistoryTable) — 2026-05-19
- [x] Bước 9: Wrap `GoogleOAuthProvider` trong `App.tsx`, thêm `VITE_GOOGLE_CLIENT_ID` vào `env.ts` — 2026-05-19
- [x] Bước 10: Thêm route `/settings` vào `router/index.tsx` dưới `ProtectedRoute` — 2026-05-19
- [x] Bước 11: `tsc --noEmit` + `pnpm run build` → PASS — 2026-05-19

## Câu hỏi đã giải đáp
- **Route location:** `/settings` dưới `ProtectedRoute` — không `RoleRoute`, mọi role đều vào được ✅
- **AppLayout:** Ngoài scope ticket này — không implement Sidebar/Header ✅
- **QR code:** Dùng `qrcode.react` package ✅
- **`ChangePasswordPayload.confirmPassword`:** BE expect đủ 3 fields (API docs line 602 — `confirmPassword` là Bắt buộc). Không tách FormValues/Payload ✅
- **2FA enable confirm OTP:** Không có bước confirm — "không có bước confirm TOTP riêng biệt" (API docs) ✅
- **Deactivate/Delete payload:** Không có body — "Request body: Không có" (API docs) ✅
- **`useSendPhoneOtp` payload:** Không có body — AccountId lấy từ JWT (API docs) ✅
- **7 components:** 6 form sections (ChangePasswordForm, ChangeEmailForm, PhoneVerifySection, TwoFactorSetup, GoogleLinkSection, DangerZone) + 1 LoginHistoryTable ✅
- **`AccountStatusEnum = 0`:** `PendingVerification = 0` là intentional exception từ API contract — không phải lỗi. FE mirror đúng giá trị BE trả, không áp dụng be.md rule "enum từ 1" cho type mirror ✅
- **`useSessions` + `refetchOnWindowFocus`:** Ngoài scope GH-27 — sẽ có ticket riêng cho session management. `useLoginHistory` (query duy nhất trong ticket này) không cần real-time update khi focus ✅
- **`npm run build` trong Success Criteria:** Đã có ở Steps và Success Criteria — không thay đổi ✅
