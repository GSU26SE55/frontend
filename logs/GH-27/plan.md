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

### C3 — ✅ `totalItems` — code FE khớp BE + doc (RESOLVED)

- **BE (verified):** `shared/src/SharedContracts/Common/Responses/PaginationResponse.cs:6` → `public int TotalItems` (+ `TotalPages`, `HasNextPage`). JSON serialize ra **`totalItems`**.
- **Code FE (verified):** `api.types.ts:15` + `account.types.ts:58` dùng `totalItems` → **khớp BE, không sửa.**
- **Doc (đã sửa 2026-06-15):** `api-auth.md` PaginationResponse nay dùng `totalItems` đúng. Tất cả 3 phía khớp — không còn action.
- **login-history default `pageSize`:** doc default = **20** (api-auth.md). FE luôn gửi `pageSize` tường minh nên BE default không bị dùng; nếu muốn parity, set `PAGE_SIZE = 20` trong `LoginHistoryTable`.

### C4 — 🟢 change-email / confirm-email-change: enable lại (BE đã wire route)

Plan gốc đánh dấu 2 endpoint "CHƯA CÓ TRONG SWAGGER, pending BE". Doc [api-auth.md §`/change-email`, §`/confirm-email-change`](../../docs/api-auth.md) nay đã document đầy đủ **và BE đã wire route** (AccountsController). Code FE đã có sẵn (`account.service.ts:22-32`) → enable UI trong `ChangeEmailForm`.

Status code (theo handler thực tế, để map lỗi đúng):
- `change-email`: `200` success (data=accountId) · `401` password sai · `404` · `409` email đã dùng · `422` email trùng email hiện tại
- `confirm-email-change`: `200` (revoke mọi session → clear token + redirect login) · `401` OTP sai/hết hạn · `404` · `409` không có pending / email bị chiếm · `423` lockout

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
| `src/shared/utils/endpoints.ts` | modify | Thêm `ACCOUNTS.ME` group — gồm 2FA GH-295: `TWO_FA_INIT`, `TWO_FA_CONFIRM`, `TWO_FA_DISABLE`, `TWO_FA_BACKUP_REGEN` (bỏ `TWO_FA_ENABLE`) |
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
| `src/features/auth/hooks/useInit2fa.ts` | create | useMutation — POST /2fa/init (GH-295) |
| `src/features/auth/hooks/useConfirm2fa.ts` | create | useMutation — POST /2fa/confirm |
| `src/features/auth/hooks/useDisable2fa.ts` | create | useMutation — POST /2fa/disable `{password, totpCode}` |
| `src/features/auth/hooks/useRegenBackupCodes.ts` | create | useMutation — POST /2fa/backup-codes/regenerate |
| `src/features/auth/hooks/useLinkGoogle.ts` | create | useMutation |
| `src/features/auth/hooks/useUnlinkGoogle.ts` | create | useMutation |
| `src/features/auth/hooks/useDeactivateAccount.ts` | create | useMutation |
| `src/features/auth/hooks/useDeleteAccount.ts` | create | useMutation |
| `src/features/auth/hooks/useLoginHistory.ts` | create | useQuery + pagination params |
| `src/features/auth/components/ChangePasswordForm.tsx` | create | |
| `src/features/auth/components/ChangeEmailForm.tsx` | create | 2-step: request email → OTP confirm |
| `src/features/auth/components/PhoneVerifySection.tsx` | create | Send OTP + verify OTP + 60s countdown |
| `src/features/auth/components/TwoFactorSetup.tsx` | create | Wizard GH-295: init (QR+secret) → confirm (TOTP) → backup codes modal |
| `src/features/auth/components/DisableTwoFactorForm.tsx` | create | 2 input `password` + `totpCode` |
| `src/features/auth/components/RegenerateBackupCodesModal.tsx` | create | Nhập `totpCode` → hiển thị 8 codes mới |
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
// deactivate / delete: không có body

// === 2FA flow GH-295 (2 bước init → confirm) ===
// 2fa/enable CŨ đã DEPRECATED — luôn trả 410 Gone, KHÔNG dùng.
export interface Init2faResponseData       { secret: string; otpAuthUri: string; pendingToken: string; }  // POST /2fa/init (no body)
export interface Confirm2faPayload         { pendingToken: string; code: string; }
export interface Confirm2faResponseData    { enabled: boolean; backupCodes: string[]; }  // 8 codes — hiện 1 lần
export interface Disable2faPayload         { password: string; totpCode: string; }       // BẮT BUỘC cả 2 field
export interface RegenBackupCodesPayload   { totpCode: string; }
export interface RegenBackupCodesResponseData { backupCodes: string[]; }  // 8 codes mới — hiện 1 lần
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
| POST | `/api/accounts/me/change-email` | `ACCOUNTS.ME.CHANGE_EMAIL` | `ChangeEmailPayload` | BE đã wire route (api-auth.md) |
| POST | `/api/accounts/me/confirm-email-change` | `ACCOUNTS.ME.CONFIRM_EMAIL_CHANGE` | `ConfirmEmailChangePayload` | BE đã wire route — confirm → revoke session |
| POST | `/api/accounts/me/send-phone-otp` | `ACCOUNTS.ME.SEND_PHONE_OTP` | *(không có)* |
| POST | `/api/accounts/me/verify-phone-otp` | `ACCOUNTS.ME.VERIFY_PHONE_OTP` | `VerifyPhoneOtpPayload` |
| ~~POST~~ | ~~`/api/accounts/me/2fa/enable`~~ | ~~`TWO_FA_ENABLE`~~ | ⚠️ **DEPRECATED (GH-295) — luôn 410 Gone.** Dùng init+confirm. |
| POST | `/api/accounts/me/2fa/init` | `ACCOUNTS.ME.TWO_FA_INIT` | *(không có)* → `Init2faResponseData` |
| POST | `/api/accounts/me/2fa/confirm` | `ACCOUNTS.ME.TWO_FA_CONFIRM` | `Confirm2faPayload` → `Confirm2faResponseData` (8 backup codes) |
| POST | `/api/accounts/me/2fa/disable` | `ACCOUNTS.ME.TWO_FA_DISABLE` | `Disable2faPayload` `{password, totpCode}` |
| POST | `/api/accounts/me/2fa/backup-codes/regenerate` | `ACCOUNTS.ME.TWO_FA_BACKUP_REGEN` | `RegenBackupCodesPayload` `{totpCode}` → 8 codes mới |
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

**2FA (wizard 2 bước — GH-295):**
- Bật 2FA — Step 1: Click "Bật 2FA" → `useInit2fa.mutate` → render QR từ `otpAuthUri` (qrcode.react) + hiển thị `secret` để nhập tay; giữ `pendingToken` trong state.
- Bật 2FA — Step 2: User nhập 6 số TOTP → `useConfirm2fa.mutateAsync({pendingToken, code})` → OK: hiển thị 8 `backupCodes` trong modal **bắt buộc "Tôi đã lưu"** trước khi đóng (codes chỉ hiện 1 lần).
- Tắt 2FA: form 2 input `password` + `totpCode` → `useDisable2fa.mutateAsync({password, totpCode})` (422 message generic "Mật khẩu hoặc mã không đúng").
- Regenerate backup codes: modal nhập `totpCode` → `useRegenBackupCodes.mutateAsync({totpCode})` → hiển thị 8 codes mới (modal "Tôi đã lưu").

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
- 2FA backup codes: hiển thị 1 lần duy nhất — modal `confirm 2fa` / `regenerate` phải bắt buộc user "Tôi đã lưu" trước khi đóng (không thể xem lại)
- 2FA disable: cần cả `password` + `totpCode`; 422 trả message generic — hiện dưới form, không redirect login
- Send phone OTP: 60s cooldown → disable button + countdown timer (local `useState` countdown)
- Login history: API trả `totalItems` (không phải `totalCount`) — dùng `LoginHistoryResponseData` riêng, không reuse `PaginationResponse<T>` từ `api.types.ts`
- `@react-oauth/google` yêu cầu `VITE_GOOGLE_CLIENT_ID` env var — thêm vào `config/env.ts`
- **Đổi email:** BE đã wire route `/change-email` + `/confirm-email-change` — enable UI trong `ChangeEmailForm`. Sau `confirm-email-change` thành công → mọi session bị revoke → clear token + redirect login.

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
- **2FA enable confirm OTP:** ❌ ĐÃ THAY (GH-295) — flow nay BẮT BUỘC 2 bước: `/2fa/init` (sinh QR + pendingToken) → `/2fa/confirm` (verify TOTP 6 số → activate + trả 8 backup codes). Endpoint `/2fa/enable` cũ trả 410 Gone. Xem C1.
- **Deactivate/Delete payload:** Không có body — "Request body: Không có" (API docs) ✅
- **`useSendPhoneOtp` payload:** Không có body — AccountId lấy từ JWT (API docs) ✅
- **7 components:** 6 form sections (ChangePasswordForm, ChangeEmailForm, PhoneVerifySection, TwoFactorSetup, GoogleLinkSection, DangerZone) + 1 LoginHistoryTable ✅
- **`AccountStatusEnum = 0`:** `PendingVerification = 0` là intentional exception từ API contract — không phải lỗi. FE mirror đúng giá trị BE trả, không áp dụng be.md rule "enum từ 1" cho type mirror ✅
- **`useSessions` + `refetchOnWindowFocus`:** Ngoài scope GH-27 — sẽ có ticket riêng cho session management. `useLoginHistory` (query duy nhất trong ticket này) không cần real-time update khi focus ✅
- **`npm run build` trong Success Criteria:** Đã có ở Steps và Success Criteria — không thay đổi ✅
