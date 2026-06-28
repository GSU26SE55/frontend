# Plan — GH-11: [FE] Flow Authentication

## Metadata
- **Status:** SHIPPED → **NEEDS REWORK (GH-295)** | **Role:** FE | **Ngày:** 2026-05-20, cập nhật 2026-06-14
- **Issue:** #11 — https://github.com/GSU26SE55/frontend/issues/11
- **Sprint:** Sprint 1 (deadline 2026-05-30)

---

## ⚠️ GH-295 Contract Update (2026-06-14) — BẮT BUỘC SỬA TRƯỚC KHI FIX CODE

> Plan này SHIPPED 2026-05-20, TRƯỚC breaking change **GH-295**. `docs/api-auth.md` (bản hiện tại) đã đổi contract. Các điểm bên dưới là nguồn sự thật — phần Endpoints/Types/Approach cũ phía dưới giữ nguyên để tham chiếu lịch sử, nhưng **đã lỗi thời** ở những chỗ được đánh dấu.

> **Đã đối chiếu codebase hiện tại (2026-06-14):** Code THỰC TẾ vẫn dùng shape cũ — chưa migrate:
> - `auth.types.ts:40` `LoginResponseData { accessToken, refreshToken }` phẳng (không có `tokens`/`challenge`/`requiresTwoFactor`).
> - `useLogin.ts:18` `const { accessToken, refreshToken } = res.data` — đọc trực tiếp, sẽ `undefined` với shape mới.
> - `axios.ts:62` `tryRefresh` đọc `res.data.data` phẳng — cùng lỗi.
> - `auth.service.ts:30,66` refresh-token + acceptInvite type `CommonResponse<LoginResponseData>` phẳng.
> - `endpoints.ts` thiếu `AUTH.LOGIN_VERIFY_2FA`; vẫn còn group `USERS:` (dòng 38).
> - `auth.types.ts:12` `RegisterPayload` vẫn có `confirmPassword` → gửi thừa.
> → Tất cả điểm C1–C5 đều cần sửa ở CẢ code (chưa làm).

### C1 — 🔴 Response login/refresh/google/accept-invite: wrap trong `data.tokens.*`

Trước GH-295: `data.accessToken` / `data.refreshToken` phẳng.
Sau GH-295 ([api-auth.md §1 `POST /api/auth/login`](../../docs/api-auth.md)): discriminated union `LoginResultDto`:

```ts
// LoginResultDto — shape MỚI, áp dụng cho: login, refresh-token, google/callback, accept-invite
interface TokenDTO { accessToken: string; refreshToken: string; }
interface TwoFactorChallengeDto {
  challengeToken: string;       // 32 hex, TTL 5 phút (Redis)
  expiresInSeconds: number;     // luôn 300
  methods: string[];            // luôn ["totp", "backupCode"]
}
interface LoginResultData {
  tokens: TokenDTO | null;          // set khi login complete (Case A); null khi 2FA on (Case B)
  challenge: TwoFactorChallengeDto | null;  // set khi 2FA on (Case B); null khi Case A
  requiresTwoFactor: boolean;       // computed: challenge != null
}
```

**Sửa mọi nơi đọc token:**
- `saveTokens(res.data.data.accessToken, ...)` → `saveTokens(res.data.data.tokens.accessToken, res.data.data.tokens.refreshToken)`
- Axios refresh interceptor ([Approach §tryRefresh](#approach)): `const { accessToken, refreshToken } = res.data.data` → `const { accessToken, refreshToken } = res.data.data.tokens`
- Google callback ([Approach §Google OAuth](#approach)): `const { accessToken, refreshToken } = res.data` → `res.data.data.tokens`
- `refresh-token` và `google/callback` **luôn** `challenge = null` (không bao giờ trả 2FA challenge).

### C2 — 🔴 Login phải xử lý `requiresTwoFactor` (2FA bước 1)

`useLogin` / `LoginForm` hiện chỉ handle Case A. Phải thêm rẽ nhánh:

```
POST /api/auth/login
  ├─ data.requiresTwoFactor === false → saveTokens(data.tokens.*) → decode → setSession → redirectByRole
  └─ data.requiresTwoFactor === true  → giữ data.challenge.challengeToken trong memory (KHÔNG cookie)
                                         → navigate('/login/2fa') → màn hình verify-2fa
```

- Endpoint mới `POST /api/auth/login/verify-2fa` body `{ challengeToken, code, isBackupCode }` → response giống login Case A (`data.tokens.*`).
- 2FA verify page + hook nằm ngoài scope GH-11 gốc → **tách sang ticket migrate** (xem §Migration scope cuối plan), nhưng `useLogin` BẮT BUỘC sửa trong ticket này để không crash khi `data.tokens === null`.

### C3 — 🟡 `endpoints.ts`: thêm path GH-295, bỏ group `USERS` sai

- Thêm `AUTH.LOGIN_VERIFY_2FA: '/api/auth/login/verify-2fa'`.
- Group `USERS: { '/api/users', ... }` ([Endpoints block dưới](#endpoints--srcsharedutilsendpointsts)) **không tồn tại trong doc** — account management nằm ở `/api/admin/accounts` (đã đúng ở GH-30). Đánh dấu deprecated / xóa.

### C4 — 🟡 Register: bỏ `confirmPassword` khỏi API body

Body register doc ([api-auth.md §`POST /api/auth/register`](../../docs/api-auth.md)) KHÔNG có `confirmPassword`. Giữ `confirmPassword` là FE-only validation (giống reset-password đã làm đúng). Sửa `RegisterPayload` API body → `{ fullName, email, password, phoneNumber }`.

### C5 — 🟢 Login password validation `.min(8)` → `.min(1)`

Doc: login chỉ sanity-check "không rỗng", không enforce strong-password. `.min(8)` chặn nhầm user pass cũ. Đổi `login.schema.ts` password → `z.string().min(1)`.

### C6 — 🟢 Comment TTL accessToken: "90 phút" → "1 giờ"

Doc ghi JWT access token TTL **1 giờ**. Code lấy `exp` từ JWT nên không lỗi runtime — chỉ sửa comment cho khớp.

### C7 — 🟡 Block `TICKETS` + ticket permissions sơ khai, sai so với `docs/api-ticket.md` *(bổ sung BE-verify 2026-06-15)*

> Block `TICKETS` (và ticket perms trong `authz.ts`) ở GH-11 là phác đoán Sprint 1 TRƯỚC khi có `docs/api-ticket.md`. Endpoints ticket chính thức đã được GH-58 (Staff), GH-59 (Manager), GH-60 (Admin) định nghĩa lại đúng (`STAFF_TICKETS`, `ADMIN.TICKETS`, `TICKETS.ACTIVITIES`). Block `TICKETS` cũ phía dưới **đã lỗi thời**.

> **Đã đối chiếu codebase (2026-06-14):** [`src/shared/utils/endpoints.ts:48-60`](../../src/shared/utils/endpoints.ts) vẫn còn block `TICKETS` cũ với các endpoint **không tồn tại trong spec** — cần dọn ở ticket riêng:
> - `LIST: '/api/tickets'`, `CREATE: '/api/tickets'` — spec tách theo role: `GET/POST /api/customer/tickets`, `GET /api/staff/tickets/me`, `GET /api/admin/tickets`. Không có list/create generic dưới `/api/tickets`.
> - `UPDATE_STATUS: /{id}/status` — **không tồn tại**; chuyển trạng thái qua action riêng (`/start`, `/hold`, `/resume`, `/resolve`, `/triage`, `/assign`, `/approve`, `/reject`, ...).
> - `CLOSE: /{id}/close` — **không tồn tại**; đóng qua `customer/.../rate` (→ Closed) hoặc `admin/.../approve` (→ ClosedPendingRate).
> - `CLOSE_REJECT: /{id}/close-reject` — sai path; đúng là `POST /api/admin/tickets/{id}/triage-reject`.
> - `ASSIGN`/`ESCALATE` dưới `/api/tickets` — sai base; đúng là `/api/admin/tickets/{id}/assign|escalate`.
> - Giữ hợp lệ (thuộc base `/api/tickets` chung): `DETAIL`, `ACTIVITIES`, `COMMENTS`, `MAINTENANCE_LOGS`.
> - Còn thiếu (do GH-58/59/60 bổ sung ở nhóm khác): `customer/tickets` (`me`/`reopen`/`rate`), `admin/tickets/queue`, `triage`, `reassign`, `declare-incident`, `staff .../escalate-request`, `maintenance-logs/me`.

> **Ticket permissions `authz.ts` (C7):** spec ticket dùng từ ngữ `triage` / `triage-reject` / `approve` / `reject` — không phải `close` / `close_reject`. JWT mẫu (dòng 227) chỉ chứa `ticket.create`, `ticket.view`. Các perm `ticket.triage/close/close_reject/assign/escalate` **chưa được xác nhận từ BE** — cần confirm danh sách perm string thực tế (api-ticket.md không liệt kê permission). Đổi `TICKET_CLOSE`/`TICKET_CLOSE_REJECT` cho khớp tên action spec sau khi BE confirm.

> **Cập nhật 2026-06-15 — đối chiếu codebase BE TicketService:** Các controller ticket BE dùng **role-based authorization** (`[Authorize(Roles="Staff")]`, `"Manager,Admin"`, `"Customer"`), **KHÔNG dùng permission-based policy** cho ticket actions. Permission string (`ticket.saga.view` / `ticket.saga.reprocess`) **chỉ tồn tại cho 2 endpoint Saga** (`/api/admin/sagas/alert-ticket`). → Kết luận: ticket gating ở FE nên dùng **`checkRole(user, 'STAFF'|'MANAGER'|'ADMIN'|'CUSTOMER')`** theo từng action, KHÔNG dựa vào `ticket.*` permission (các perm này không được BE enforce). Block ticket perms cũ trong `authz.ts` → xóa hoặc giữ tối thiểu, không mở rộng speculative.

### Migration scope (ticket riêng — không thuộc GH-11 rework)
- `POST /api/auth/login/verify-2fa` page + `useVerifyLogin2fa` hook → thuộc ticket 2FA migrate (cùng GH-27 2FA rework).
- Dọn block `TICKETS` cũ trong `endpoints.ts` + sửa ticket perms trong `authz.ts` → ticket riêng (sau khi GH-58/59/60 merge và BE confirm perm list).

## Mục tiêu
Thiết lập toàn bộ nền tảng project (router, providers, axios, Zustand session store) và implement đầy đủ auth flow gồm: Login, Register + OTP verify, Forgot Password (3 bước), Google OAuth. Đây là ticket nền tảng Sprint 1 — các feature sau (admin/manager/staff) đều phụ thuộc vào kết quả này.

## Scope
**Trong scope:**
- Project structure setup: config/env.ts, App.tsx (providers), router/, shared/ (axios, errors, sessionStore, authContext, types, layout)
- Auth flows: Login · Register + OTP · Forgot Password · Google OAuth · Logout · Token refresh (interceptor)
- ProtectedRoute + RoleRoute
- AuthLayout

**Ngoài scope:**
- Accept invite (ticket riêng khi Admin feature có UI invite)
- AppLayout / Sidebar / Header (ticket khác)
- Admin/Manager/Staff pages (các ticket riêng)
- Avatar upload
- `/api/auth/me/profile` PUT (profile management — ticket riêng)

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `.env.example` | create | Template VITE_API_BASE_URL |
| `src/config/env.ts` | create | Zod-validate env khi boot |
| `src/App.tsx` | modify | Rewrite: QueryClient + ThemeProvider + AuthProvider + Router + Toaster |
| `src/router/index.tsx` | create | createBrowserRouter — toàn bộ route tree auth |
| `src/router/ProtectedRoute.tsx` | create | Redirect /login nếu chưa auth |
| `src/router/RoleRoute.tsx` | create | Redirect /unauthorized nếu sai role |
| `src/shared/lib/axios.ts` | create | Axios instance + attach token + refresh interceptor |
| `src/shared/lib/errors.ts` | create | HttpError, EntityError, handleErrorApi |
| `src/shared/lib/authz.ts` | create | RBAC: P constants, checkPermission(), checkRole() |
| `src/shared/stores/sessionStore.ts` | create | Zustand: user, token, setSession, logout |
| `src/shared/context/authContext.tsx` | create | AuthProvider: hydrate sessionStore từ cookie khi boot |
| `src/shared/types/api.types.ts` | create | CommonResponse\<T\>, ErrorEntity, PaginationResponse\<T\> |
| `src/shared/types/session.types.ts` | create | SessionUser, JwtPayload, UserRole, decodeToken, redirectByRole — dùng bởi shared/ (không để ở features/) |
| `src/shared/utils/queryKeys.ts` | create | KEY + QUERY_KEY factories (skeleton cho Sprint 1) |
| `src/shared/utils/endpoints.ts` | create | Toàn bộ API endpoint strings của dự án |
| `src/shared/components/layout/AuthLayout.tsx` | create | Centered card layout cho auth pages |
| `src/features/auth/types/auth.types.ts` | create | LoginPayload, RegisterPayload, AuthUser, AccountDto, ... |
| `src/features/auth/schemas/login.schema.ts` | create | Zod login schema |
| `src/features/auth/schemas/register.schema.ts` | create | Zod register schema |
| `src/features/auth/schemas/otp-verify.schema.ts` | create | Zod OTP 6 chữ số |
| `src/features/auth/schemas/forgot-password.schema.ts` | create | Zod schemas cho 3 bước forgot password |
| `src/features/auth/services/auth.service.ts` | create | Tất cả auth API calls |
| `src/features/auth/hooks/useLogin.ts` | create | useMutation |
| `src/features/auth/hooks/useLogout.ts` | create | useMutation |
| `src/features/auth/hooks/useRegister.ts` | create | useMutation |
| `src/features/auth/hooks/useVerifyOtp.ts` | create | useMutation |
| `src/features/auth/hooks/useResendOtp.ts` | create | useMutation |
| `src/features/auth/hooks/useForgotPassword.ts` | create | useMutation |
| `src/features/auth/hooks/useVerifyResetOtp.ts` | create | useMutation |
| `src/features/auth/hooks/useResendResetOtp.ts` | create | useMutation |
| `src/features/auth/hooks/useResetPassword.ts` | create | useMutation |
| `src/features/auth/components/LoginForm.tsx` | create | email + password + Google button |
| `src/features/auth/components/RegisterForm.tsx` | create | full register fields |
| `src/features/auth/components/OtpVerifyForm.tsx` | create | 6-digit OTP + resend countdown |
| `src/features/auth/components/ForgotPasswordForm.tsx` | create | Step 1: email |
| `src/features/auth/components/ResetOtpVerifyForm.tsx` | create | Step 2: OTP + resend |
| `src/features/auth/components/ResetPasswordForm.tsx` | create | Step 3: new password |
| `src/features/auth/pages/LoginPage.tsx` | create | |
| `src/features/auth/pages/RegisterPage.tsx` | create | |
| `src/features/auth/pages/OtpVerifyPage.tsx` | create | Nhận email từ router state |
| `src/features/auth/pages/ForgotPasswordPage.tsx` | create | Multi-step (state nội bộ: step 1→2→3) |
| `src/features/auth/pages/GoogleCallbackPage.tsx` | create | Parse token từ URL query → save → redirect |

## Types

```ts
// src/features/auth/types/auth.types.ts

// Payloads
interface LoginPayload          { email: string; password: string; }
interface RegisterPayload       { fullName: string; email: string; password: string; phoneNumber: string; }  // confirmPassword là FE-only validation, KHÔNG gửi lên BE (GH-295)
interface Verify2faLoginPayload { challengeToken: string; code: string; isBackupCode: boolean; }  // GH-295 bước 2 login
interface OtpVerifyPayload      { email: string; otp: string; }
interface ResendOtpPayload      { email: string; }               // dùng chung cho resend-otp + resend-reset-otp
interface ForgotPasswordPayload { email: string; }
interface VerifyResetOtpPayload { email: string; otp: string; }
interface ResetPasswordPayload  { resetToken: string; newPassword: string; }  // confirmPassword là FE-only validation, không gửi lên BE

// Responses (GH-295 — LoginResultDto discriminated union)
interface TokenDTO                   { accessToken: string; refreshToken: string; }
interface TwoFactorChallengeDto      { challengeToken: string; expiresInSeconds: number; methods: string[]; }  // expiresInSeconds luôn 300, methods=["totp","backupCode"]
interface LoginResultData            { tokens: TokenDTO | null; challenge: TwoFactorChallengeDto | null; requiresTwoFactor: boolean; }
interface RegisterResponseData       { email: string; otpExpiresInSeconds: number; }  // ← countdown cho OTP verify sau register
interface VerifyResetOtpResponseData { resetToken: string; expiresInSeconds: number; }  // expiresInSeconds = 900 (15 phút)
interface AccountDto                 { id: string; email: string; fullName: string; role: string; phoneNumber?: string; displayAvatarUrl?: string; }
// AccountDto đầy đủ — xem GH-30 plan (shared/types/account.types.ts). Render avatar bằng displayAvatarUrl, KHÔNG dùng avatarUrl trực tiếp.
```

## Schema (Zod)

```ts
// login.schema.ts — login chỉ sanity-check "không rỗng", BE không enforce strong-password ở login (api-auth.md)
email:    z.string().email()
password: z.string().min(1)

// register.schema.ts
fullName:        z.string().min(2)
email:           z.string().email()
password:        z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/)
confirmPassword: z.string()
phoneNumber:     z.string().regex(/^(0[35789])[0-9]{8}$/)
// .refine: password === confirmPassword

// otp-verify.schema.ts
otp: z.string().length(6).regex(/^\d{6}$/)

// forgot-password.schema.ts — 3 sub-schemas (step 1/2/3)
// Step 1: email: z.string().email()
// Step 2: otp: z.string().length(6)
// Step 3: newPassword + confirmPassword (cùng pattern với register)
```

## Endpoints

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| POST | `/api/auth/login` | `{ email, password }` | `CommonResponse<LoginResultData>` — discriminated union `{ tokens, challenge, requiresTwoFactor }` (GH-295) |
| POST | `/api/auth/login/verify-2fa` | `{ challengeToken, code, isBackupCode }` | `CommonResponse<LoginResultData>` — giống login Case A (`data.tokens.*`) |
| POST | `/api/auth/register` | `{ fullName, email, password, phoneNumber }` | `201` `CommonResponse<RegisterResponseData>` — `{ email, otpExpiresInSeconds }` — KHÔNG gửi `confirmPassword` (FE-only validation) |
| POST | `/api/auth/verify-otp` | `{ email, otp }` | `CommonResponse<null>` |
| POST | `/api/auth/resend-otp` | `{ email }` | `CommonResponse<null>` |
| POST | `/api/auth/forgot-password` | `{ email }` | `CommonResponse<null>` |
| POST | `/api/auth/verify-reset-otp` | `{ email, otp }` | `CommonResponse<VerifyResetOtpResponseData>` |
| POST | `/api/auth/resend-reset-otp` | `{ email }` | `CommonResponse<null>` |
| POST | `/api/auth/reset-password` | `{ resetToken, newPassword }` | `CommonResponse<null>` | ← `confirmPassword` validate phía FE only, KHÔNG gửi lên BE |
| POST | `/api/auth/refresh-token` | `{ refreshToken }` | `CommonResponse<LoginResultData>` — `data.tokens.*`, `data.challenge` luôn null (GH-295) |
| POST | `/api/auth/logout` | `{ refreshToken }` | `CommonResponse<null>` |
| GET | `/api/auth/google/login` | — | redirect 302 → Google |
| GET | `/api/auth/google/callback` | — | `CommonResponse<LoginResultData>` — `data.tokens.*`, `data.challenge` luôn null (bypass 2FA) |
| POST | `/api/auth/accept-invite` | — | ngoài scope — ticket Admin riêng (GH-64) |
| GET | `/api/auth/me` | — | `CommonResponse<AccountDto>` — ngoài scope (GH-28) |
| PUT | `/api/auth/me/profile` | `{ fullName, phoneNumber?, address?, birthDate?, timeZone? }` | `CommonResponse<AccountDto>` — ngoài scope (GH-28) |
| POST | `/api/auth/me/avatar` | `{ avatarFileId }` | `CommonResponse<AccountDto>` — ngoài scope (GH-36) |

> `refresh-token` và `logout` gọi trực tiếp trong `shared/lib/axios.ts` interceptor — KHÔNG qua `authService` để tránh circular dependency.

---

## JWT Structure (thực tế từ backend)

```json
{
  "jti": "uuid",
  "nameid": "2b15665d-7263-42a7-b373-aa74f72347d8",
  "AccountId": "2b15665d-7263-42a7-b373-aa74f72347d8",
  "email": "user@example.com",
  "FullName": "Nguyen Van A",
  "role": "Customer",
  "perm": ["ticket.create", "battery.view", "notification.view", "ticket.view"],
  "nbf": 1778771938,
  "exp": 1778775538,
  "iat": 1778771938,
  "iss": "https://localhost:5001",
  "aud": "https://localhost:5001"
}
```

**Role enum — UPPERCASE** (JWT gửi PascalCase → FE `.toUpperCase()` khi decode):

```ts
// session.types.ts — dùng const object + type alias (erasableSyntaxOnly không cho phép enum)
export const UserRole = {
  ADMIN:    'ADMIN',
  MANAGER:  'MANAGER',
  STAFF:    'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
```

> JWT claim `role: "Customer"` → `jwtPayload.role.toUpperCase() as UserRole` → `"CUSTOMER"`
> Mọi so sánh trong app đều dùng constant: `checkRole(user, UserRole.ADMIN)`, `user.role === UserRole.MANAGER`
> Không hardcode string `'ADMIN'` trực tiếp — luôn dùng `UserRole.XXX`

**JwtPayload type** dùng để decode trong `auth.types.ts`:
```ts
interface JwtPayload {
  jti: string;
  nameid: string;
  AccountId: string;  // PascalCase — tên claim của BE
  email: string;
  FullName: string;   // PascalCase — tên claim của BE
  role: string;       // PascalCase từ BE, sẽ toUpperCase() khi map
  perm: string[];
  nbf: number;
  exp: number;
  iat: number;
}
```

**SessionUser** (lưu vào Zustand sessionStore sau khi decode):
```ts
interface SessionUser {
  accountId: string;      // ← JwtPayload.AccountId
  email: string;
  fullName: string;       // ← JwtPayload.FullName
  role: UserRole;         // ← JwtPayload.role.toUpperCase()
  permissions: string[];  // ← JwtPayload.perm
}
```

**`decodeToken` — utility function, gọi tại ≥2 chỗ (AuthContext + tryRefresh):**
```ts
// Vị trí BẮT BUỘC: src/shared/types/session.types.ts
// KHÔNG đặt ở features/auth/ — gây circular dependency:
//   shared/lib/axios.ts → features/auth/types → shared/lib/axios.ts

export const decodeToken = (token: string): SessionUser => {
  const payload = jwtDecode<JwtPayload>(token);
  return {
    accountId:   payload.AccountId,
    email:       payload.email,
    fullName:    payload.FullName,
    role:        payload.role.toUpperCase() as UserRole,  // "Customer" → "CUSTOMER"
    permissions: payload.perm,
  };
};
```

**Redirect by role sau login:**
```ts
// Vị trí: src/shared/types/session.types.ts (cùng file với UserRole)
// KHÔNG inline trong từng page/hook — dùng chung cho useLogin, GoogleCallbackPage, AuthContext
const redirectByRole = (role: UserRole): string => ({
  ADMIN:    '/admin',
  MANAGER:  '/manager',
  STAFF:    '/staff',
  CUSTOMER: '/unauthorized',  // web app không hỗ trợ Customer
}[role] ?? '/unauthorized');

// Trong useLogin onSuccess — block Customer sớm, trước khi redirect:
if (user.role === 'CUSTOMER') {
  toast.error('Vui lòng sử dụng Mobile App để đăng nhập.');
  logout();
  return;
}
```

---

## Enums

> **Note (thêm sau khi SHIPPED):** Enums được tách ra `src/shared/enums/` — không define inline trong types.

| Enum | File |
|------|------|
| `UserRole` | `shared/enums/session.enum.ts` |
| `AccountStatusEnum`, `AvatarSourceEnum`, `RefreshTokenStatus` | `shared/enums/account.enum.ts` |

> **Cleanup (2026-06-28, local):** Đã xoá 2 file orphan trùng lặp `shared/types/session.enums.ts` + `shared/types/account.enums.ts` (0 import, dead-code). Bản canonical đang dùng là `shared/enums/*.enum.ts` ở bảng trên — không ảnh hưởng. `tsc` + `eslint` PASS.

---

## Approach

**Token storage:** `js-cookie` lưu `accessToken` và `refreshToken` trong cookie.
- `accessToken`: expires lấy từ `exp` trong JWT (BE TTL **1 giờ** — api-auth.md)
- `refreshToken`: expires **7 ngày** (`{ expires: 7 }`) — confirmed Q1

> **[SECURITY — Acknowledged]** js-cookie tạo JavaScript-accessible cookie (không phải httpOnly). Acceptable cho capstone scope. Mọi nơi set cookie phải kèm comment:
> `// SECURITY: non-httpOnly cookie, acceptable for capstone scope`

**Cookie helpers:**
```ts
const CLOCK_SKEW_MS = 30_000; // 30s buffer tránh clock skew server/client

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= (exp * 1000) - CLOCK_SKEW_MS;
  } catch {
    return true;
  }
};

// accessToken — expires lấy từ exp trong JWT (chính xác hơn hardcode 90p)
// SECURITY: non-httpOnly cookie, acceptable for capstone scope
export const saveTokens = (accessToken: string, refreshToken: string) => {
  const { exp } = jwtDecode<{ exp: number }>(accessToken);
  Cookies.set('accessToken', accessToken, { expires: new Date(exp * 1000) });
  // TODO: update expires khi Q1 (refreshToken TTL) confirmed với BE
  Cookies.set('refreshToken', refreshToken, { expires: 7 }); // confirmed: BE TTL = 7 ngày
};
```

> `jwtDecode` KHÔNG verify signature — chỉ dùng để đọc claims cho UI/routing. Authorization thực sự do BE enforce.

**Session hydration — 3 cases + `isHydrating` state:**

AuthContext expose `isHydrating: boolean`. ProtectedRoute phải check `isHydrating` TRƯỚC khi redirect — tránh flash unauthenticated content.

```
App boot → AuthContext set isHydrating = true → đọc cookie

Case 1: CÓ accessToken + CÓ refreshToken, access CHƯA hết hạn
  → decode accessToken → setSession(user) → isHydrating = false ✅

Case 2: KHÔNG có refreshToken
  → logout() [clear cookie + clear Zustand] → isHydrating = false → /login

Case 3: CÓ refreshToken, KHÔNG có accessToken HOẶC access đã hết hạn
  → POST /api/auth/refresh-token { refreshToken }
      → OK:   lưu token mới vào cookie → decode → setSession(user) → isHydrating = false ✅
      → fail: logout() [clear cookie + clear Zustand] → isHydrating = false → /login
```

**ProtectedRoute + RoleRoute — interface rõ ràng:**
```tsx
// ProtectedRoute.tsx
// isHydrating → <PageLoader /> (không redirect)
// !isAuthenticated → <Navigate to="/login" replace />  ← thẳng /login, không qua LandingPage
// OK → <Outlet />

// RoleRoute.tsx — nhận allowedRoles: UserRole[]
// sai role → <Navigate to="/unauthorized" replace />
// OK → <Outlet />

// Compose trong router:
{
  element: <ProtectedRoute />,
  children: [
    {
      element: <RoleRoute allowedRoles={[UserRole.ADMIN]} />,
      children: [{ path: '/admin/*', element: <AdminLayout /> }],
    },
  ],
}
```

**Logout:**
```ts
// Trong React tree (component/hook) → dùng useNavigate, không reload page
// useLogout dùng onSettled (luôn chạy dù API fail) để đảm bảo luôn clear session
const logout = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  sessionStore.getState().clearSession();  // bắt buộc clear Zustand
  navigate('/login', { replace: true });   // thẳng /login, không qua LandingPage (/)
};

// Trong Axios interceptor (ngoài React tree) → window.location.href là acceptable
// vì không có access tới useNavigate
window.location.href = '/login';
```

**Axios interceptor flow:**
```
Request chuẩn bị gửi:
  → isTokenExpired(accessToken)?
      → false: attach Bearer token → gửi
      → true:  thử refresh → OK: attach token mới → gửi / fail: logout()

Response 401 (backup — clock skew hoặc token bị revoke):
  → thử refresh (nếu chưa refresh trong request này)
      → OK: retry với token mới
      → fail: logout() [window.location.href = '/login']

Chống double-refresh: isRefreshing flag + pending queue (per-tab, in-memory)
  → Refresh call có timeout 10s. finally block reset isRefreshing = false + flush queue với error
  → [Known Limitation] flag không share giữa tabs — xem mục Known Limitations

// Pseudo-code queue + timeout + finally:
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const tryRefresh = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise(resolve => pendingQueue.push(resolve));
  }
  isRefreshing = true;
  try {
    const res = await axios.post(ENDPOINTS.AUTH.REFRESH_TOKEN, ..., { timeout: 10_000 });
    const { accessToken, refreshToken } = res.data.data.tokens;  // GH-295: wrap trong data.tokens.*
    saveTokens(accessToken, refreshToken);
    sessionStore.getState().setSession(decodeToken(accessToken));
    pendingQueue.forEach(cb => cb(accessToken)); // flush TRƯỚC khi reset
    return accessToken;
  } catch {
    pendingQueue.forEach(cb => cb(null));         // flush TRƯỚC khi reset
    logout();
    return null;
  } finally {
    isRefreshing = false;
    pendingQueue = []; // reset SAU khi forEach — không được đảo thứ tự
  }
};
```

**Google OAuth flow:**
```
Click "Sign in with Google" → window.location.href = VITE_API_BASE_URL + ENDPOINTS.AUTH.GOOGLE_LOGIN
→ Google redirect về /api/auth/google/callback (BE xử lý)
→ BE trả JSON: CommonResponse<LoginResultData> (GH-295) — `data.tokens.*`, `data.challenge` luôn null (Google bypass 2FA). KHÔNG redirect FE với token trong URL

GoogleCallbackPage — BE gọi endpoint này server-side, FE không mount page này trực tiếp từ Google redirect.
FE cần gọi GET /api/auth/google/callback (qua axios) để nhận token JSON:

  // Confirmed từ thực tế: BE trả JSON response, không redirect với ?accessToken= trong URL
  try {
    const res = await authService.googleCallback(code, state);  // GET /api/auth/google/callback
    const { accessToken, refreshToken } = res.data.data.tokens;  // GH-295: wrap trong data.tokens.*
    saveTokens(accessToken, refreshToken);
    const user = decodeToken(accessToken);
    sessionStore.getState().setSession(user);
    navigate(redirectByRole(user.role), { replace: true });
  } catch (err) {
    console.error('[GoogleCallback]', err);
    toast.error('Đăng nhập Google thất bại');
    navigate('/login', { replace: true });
  }

  // GoogleCallbackPage mount tại /auth/google/callback
  // Đọc ?code=...&state=... từ URL (Google redirect về đây)
  // Gọi authService.googleCallback(code, state) → BE exchange code → trả { accessToken, refreshToken }
```

**Known Limitations (document, không fix trong Sprint 1):**
- **Multi-tab logout:** Cookie bị xóa không có native event. Tab khác sẽ phát hiện khi gọi API tiếp theo → 401 → redirect /login. Nếu cần sync ngay: dùng `BroadcastChannel` (task riêng).
- **Multi-tab refresh race:** `isRefreshing` là in-memory, không share giữa tabs. Nếu 2 tabs đồng thời refresh với token rotation → tab 2 fail → tự logout. Acceptable cho capstone scope.

**Forgot Password multi-step (single page, internal state):**
```
Step 1: nhập email → POST /forgot-password → lưu email trong component state → next step
Step 2: nhập OTP → POST /verify-reset-otp → nhận resetToken → next step
Step 3: nhập mật khẩu mới → POST /reset-password { resetToken, newPassword } (KHÔNG gửi confirmPassword lên BE) → navigate('/login') + toast
// resetToken TTL = lấy từ response.data.expiresInSeconds của POST /verify-reset-otp (field: expiresInSeconds, integer, seconds)
// API doc: expiresInSeconds = 900 (15 phút) — dùng giá trị động từ response, không hardcode
// UX: hiển thị countdown theo expiresInSeconds nhận được ở step 2, nếu hết hạn → toast "Mã đã hết hạn, vui lòng thử lại" → reset về step 1
```

**Register → OtpVerifyPage:**
```ts
// useRegister onSuccess: navigate('/register/verify-otp', { state: { email, otpExpiresInSeconds } })
// OtpVerifyPage dùng otpExpiresInSeconds từ state để hiển thị countdown (giống step 2 forgot password)
// Nếu otpExpiresInSeconds không có trong state → fallback: không show countdown (resend button luôn hiện)
```

**OtpVerifyPage guard:**
```ts
// Dùng React Router DOM v7 location.state — không dùng sessionStorage hay Zustand
const location = useLocation();
if (!location.state?.email) {
  navigate('/register', { replace: true });
  return null;
}
```

**Routes:**
```
/                       → redirect by role (hoặc /login nếu chưa auth)
/login                  → AuthLayout > LoginPage
/register               → AuthLayout > RegisterPage
/register/verify-otp    → AuthLayout > OtpVerifyPage (nhận email từ navigate state)
/forgot-password        → AuthLayout > ForgotPasswordPage
/auth/google/callback   → GoogleCallbackPage (không có layout)
/unauthorized           → trang 403 đơn giản
```

## Endpoints — `src/shared/utils/endpoints.ts`

Single source of truth cho toàn bộ API path. Service files import từ đây — không hardcode string URL.

```ts
export const ENDPOINTS = {

  AUTH: {
    LOGIN:              '/api/auth/login',
    LOGIN_VERIFY_2FA:   '/api/auth/login/verify-2fa',   // GH-295 bước 2 login
    LOGOUT:             '/api/auth/logout',
    REGISTER:           '/api/auth/register',
    VERIFY_OTP:         '/api/auth/verify-otp',
    RESEND_OTP:         '/api/auth/resend-otp',
    REFRESH_TOKEN:      '/api/auth/refresh-token',
    FORGOT_PASSWORD:    '/api/auth/forgot-password',
    VERIFY_RESET_OTP:   '/api/auth/verify-reset-otp',
    RESET_PASSWORD:     '/api/auth/reset-password',
    RESEND_RESET_OTP:   '/api/auth/resend-reset-otp',
    ACCEPT_INVITE:      '/api/auth/accept-invite',
    GOOGLE_LOGIN:       '/api/auth/google/login',
    GOOGLE_CALLBACK:    '/api/auth/google/callback',
    ME:                 '/api/auth/me',
    UPDATE_PROFILE:     '/api/auth/me/profile',
    UPDATE_AVATAR:      '/api/auth/me/avatar',
  },

  // ⚠️ Group USERS (/api/users) ĐÃ XÓA — không tồn tại trong spec.
  // Account management nằm ở /api/admin/accounts (GH-30) + /api/accounts/me (GH-27).

  BATTERIES: {
    LIST:               '/api/batteries',
    CREATE:             '/api/batteries',
    DETAIL:             (id: string) => `/api/batteries/${id}`,
    UPDATE:             (id: string) => `/api/batteries/${id}`,
    DELETE:             (id: string) => `/api/batteries/${id}`,
    ASSIGN:             (id: string) => `/api/batteries/${id}/assign`,
    CONFIG:             (id: string) => `/api/batteries/${id}/config`,
    READINGS:           (id: string) => `/api/batteries/${id}/readings`,
    READINGS_AGGREGATE: (id: string) => `/api/batteries/${id}/readings/aggregate`,
  },

  // ⚠️ Group TICKETS cũ ĐÃ LỖI THỜI (xem C7) — endpoint ticket chính thức tách theo role
  // ở GH-58 (Staff), GH-59 (Manager), GH-60 (Admin) theo docs/api-ticket.md.
  // Giữ hợp lệ dưới base /api/tickets chung: DETAIL, ACTIVITIES, COMMENTS, MAINTENANCE_LOGS.
  // KHÔNG có: LIST/CREATE generic, /{id}/status, /{id}/close, /{id}/close-reject,
  // ASSIGN/ESCALATE dưới /api/tickets (đúng base: /api/admin/tickets/{id}/assign|escalate).
  TICKETS: {
    DETAIL:             (id: string) => `/api/tickets/${id}`,
    ACTIVITIES:         (id: string) => `/api/tickets/${id}/activities`,
    COMMENTS:           (id: string) => `/api/tickets/${id}/comments`,
    MAINTENANCE_LOGS:   (id: string) => `/api/tickets/${id}/maintenance-logs`,
  },

  NOTIFICATIONS: {
    LIST:               '/api/notifications',
    MARK_READ:          (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ:      '/api/notifications/read-all',
  },

  SLA: {
    LIST:               '/api/sla-rules',
    UPDATE:             (id: string) => `/api/sla-rules/${id}`,
  },

  AUDIT_LOGS: {
    LIST:               '/api/audit-logs',
  },

} as const;
```

> **Quy tắc:** Mỗi khi thêm endpoint mới → thêm vào đây trước, rồi mới dùng trong service. Không import ENDPOINTS từ feature files — chỉ dùng trong `services/`.

---

## RBAC — `src/shared/lib/authz.ts`

**Khác với ví dụ:** GSU26SE55 backend đã gửi sẵn `perm[]` trong JWT — FE không cần static matrix. `checkPermission()` chỉ cần check `user.permissions.includes(P.XXX)`. P constants đóng vai trò **type-safe string reference** để tránh hardcode trong component.

**Cấu trúc:**

```ts
// PermissionType — branded string, không derive từ enum
type PermissionType = string & { readonly __brand: 'Permission' };

// P — Single Source of Truth, khớp đúng với perm strings backend gửi trong JWT
export const P = {
  // TICKET
  TICKET_VIEW:         'ticket.view'          as PermissionType,
  TICKET_CREATE:       'ticket.create'        as PermissionType,
  TICKET_TRIAGE:       'ticket.triage'        as PermissionType,
  TICKET_ASSIGN:       'ticket.assign'        as PermissionType,
  TICKET_ESCALATE:     'ticket.escalate'      as PermissionType,
  TICKET_CLOSE:        'ticket.close'         as PermissionType,
  TICKET_CLOSE_REJECT: 'ticket.close_reject'  as PermissionType,

  // BATTERY
  BATTERY_VIEW:          'battery.view'          as PermissionType,
  BATTERY_CREATE:        'battery.create'        as PermissionType,
  BATTERY_UPDATE:        'battery.update'        as PermissionType,
  BATTERY_DELETE:        'battery.delete'        as PermissionType,
  BATTERY_ASSIGN:        'battery.assign'        as PermissionType,
  BATTERY_CONFIG_VIEW:   'battery.config.view'   as PermissionType,
  BATTERY_CONFIG_UPDATE: 'battery.config.update' as PermissionType,

  // USER
  USER_VIEW:       'user.view'       as PermissionType,
  USER_CREATE:     'user.create'     as PermissionType,
  USER_UPDATE:     'user.update'     as PermissionType,
  USER_INVITE:     'user.invite'     as PermissionType,
  USER_DEACTIVATE: 'user.deactivate' as PermissionType,

  // SLA
  SLA_VIEW:      'sla.view'      as PermissionType,
  SLA_CONFIGURE: 'sla.configure' as PermissionType,

  // AUDIT LOG & REPORT
  AUDIT_LOG_VIEW: 'audit_log.view' as PermissionType,
  REPORT_VIEW:    'report.view'    as PermissionType,

  // NOTIFICATION
  NOTIFICATION_VIEW: 'notification.view' as PermissionType,

  // MAINTENANCE LOG
  MAINTENANCE_LOG_VIEW:   'maintenance_log.view'   as PermissionType,
  MAINTENANCE_LOG_CREATE: 'maintenance_log.create' as PermissionType,
} as const;

// checkPermission — dùng JWT perm[] làm source of truth
// Component dùng: checkPermission(user, P.TICKET_ASSIGN)
export const checkPermission = (
  user: SessionUser | null | undefined,
  permission: PermissionType,
): boolean => user?.permissions.includes(permission) ?? false;

// checkRole — kiểm tra role, dùng cho route guard / UI conditional
// checkRole(user, 'ADMIN', 'MANAGER')
export const checkRole = (
  user: SessionUser | null | undefined,
  ...roles: UserRole[]
): boolean => !!user && roles.includes(user.role);
```

> **Quy tắc sử dụng:**
> - Component luôn dùng `P.XXX`, không hardcode string `'ticket.assign'`
> - `checkPermission` cho feature-level gate (hiển thị/ẩn button, guard API call)
> - `checkRole` cho layout-level gate (render menu item, RoleRoute)
> - P constants chỉ mở rộng khi có feature mới yêu cầu — không define speculative permissions

---

## Edge Cases
- **isHydrating = true:** ProtectedRoute render `<PageLoader />`, không redirect — tránh flash /login
- **Boot không có refreshToken:** Case 2 → logout() clear cả cookie + Zustand → /login
- **Boot access hết hạn, refresh còn:** Case 3 → gọi refresh → setSession nếu OK
- **401 khi đang refresh:** không retry → logout() + `window.location.href = '/login'`
- **Double refresh (cùng tab):** `isRefreshing` flag + queue, 3 request đồng thời → chỉ 1 refresh call. Timeout 10s + `finally` reset flag → không deadlock khi BE hung
- **Clock skew:** `isTokenExpired` buffer 30s + 401 fallback là 2 lớp bảo vệ
- **Google callback:** BE trả JSON, FE mount `/auth/google/callback` → đọc `?code&state` từ URL → gọi `authService.googleCallback(code, state)` → nhận token từ JSON response (không có token leak trong URL vì token nằm trong response body)
- **Customer login vào web:** block sớm trong `useLogin onSuccess` — `toast.error('Vui lòng dùng Mobile App')` + `clearTokens()` (không navigate — user ở lại /login)
- **Google callback lỗi:** không parse error param — `catch` block: `console.error` + `toast.error` + `navigate('/login')`
- **resetToken hết hạn:** countdown lấy từ `expiresInSeconds` trong response verify-reset-otp (API doc: 900s = 15 phút), hiển thị ở step 3, hết giờ → toast + reset về step 1
- **OtpVerifyPage navigate trực tiếp:** `if (!location.state?.email) → navigate('/register', { replace: true })`
- **Resend OTP 429:** disable nút + countdown 60s
- **Multi-tab logout/refresh race:** Known Limitation — document, không fix Sprint 1

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| Login valid creds → redirect đúng role | Manual test + kiểm tra cookie |
| Login sai creds → toast error | Manual test |
| Register → nhận OTP email → verify → redirect /login | Manual với test email |
| Forgot password 3 bước → reset thành công → redirect /login | Manual |
| Google OAuth click → redirect Google auth page | Manual |
| `/admin` khi chưa login → redirect /login | Manual navigate |
| Build sạch: tsc --noEmit 0 lỗi, eslint 0 warning | `npm run build` |

## Steps
- [x] Bước 1: Tạo `.env.example` + `src/config/env.ts` (Zod validate VITE_API_BASE_URL) — 2026-05-15
- [x] Bước 2: Tạo `src/shared/types/api.types.ts` (CommonResponse\<T\>, ErrorEntity) + `src/shared/types/session.types.ts` (SessionUser, JwtPayload, UserRole, decodeToken) — 2026-05-15
- [x] Bước 3: Tạo `src/shared/lib/axios.ts` (instance + interceptors + `saveTokens` helper + refresh queue với timeout 10s + finally reset) — 2026-05-15
- [x] Bước 4: Tạo `src/shared/lib/errors.ts` (HttpError, EntityError, handleErrorApi) — 2026-05-15
- [x] Bước 4b: Tạo `src/shared/lib/authz.ts` (RBAC — P constants + checkPermission + checkRole) — 2026-05-15
- [x] Bước 5: Tạo `src/shared/stores/sessionStore.ts` (Zustand: setSession, clearSession — bắt buộc có clearSession) — 2026-05-15
- [x] Bước 6: Tạo `src/shared/context/authContext.tsx` (isHydrating state + 3 cases boot logic) — 2026-05-15
- [x] Bước 7: Tạo `src/shared/utils/endpoints.ts` (toàn bộ endpoint constants) — 2026-05-15
- [x] Bước 7b: Tạo `src/shared/utils/queryKeys.ts` (skeleton KEY + QUERY_KEY) — 2026-05-15
- [x] Bước 8: Tạo `src/shared/components/layout/AuthLayout.tsx` — 2026-05-15
- [x] Bước 9: Tạo `src/router/ProtectedRoute.tsx` (check isHydrating → loader | !auth → /login) + `src/router/RoleRoute.tsx` (allowedRoles: UserRole[]) — 2026-05-15
- [x] Bước 10: Tạo `src/router/index.tsx` (createBrowserRouter full route tree) — 2026-05-15
- [x] Bước 11: Rewrite `src/App.tsx` (QueryClient + ThemeProvider + AuthProvider + RouterProvider + Toaster) — 2026-05-15
- [x] Bước 12: Tạo `src/features/auth/types/auth.types.ts` + tất cả schemas — 2026-05-15
- [x] Bước 13: Tạo `src/features/auth/services/auth.service.ts` — 2026-05-15
- [x] Bước 14: Tạo tất cả hooks (useLogin, useLogout, useRegister, useVerifyOtp, useResendOtp, useResendResetOtp, useForgotPassword, useVerifyResetOtp, useResetPassword) — 2026-05-15
- [x] Bước 15: Tạo auth components (LoginForm, RegisterForm, OtpVerifyForm, ForgotPasswordForm, ResetOtpVerifyForm, ResetPasswordForm) — 2026-05-15
- [x] Bước 16: Tạo auth pages (LoginPage, RegisterPage, OtpVerifyPage, ForgotPasswordPage, GoogleCallbackPage) — 2026-05-15
- [x] Bước 17: `tsc --noEmit` + `eslint . --max-warnings=0` + `npm run build` → PASS — 2026-05-15

## Câu hỏi đã giải đáp
- **Register flow có trong web app không?** → Có, web app cần trang Register.
- **Accept invite có trong scope không?** → Không, ticket riêng khi Admin feature sẵn sàng.
- **Google OAuth cần không?** → Có.
- **Project setup có nằm trong ticket này không?** → Có, App.tsx vẫn là Vite boilerplate nên setup luôn tại đây.
- **shadcn components path:** Giữ nguyên `src/components/ui/` (khớp `components.json`). Migration là task riêng sau Sprint 1.
- **XSS / httpOnly cookie:** Acknowledged — js-cookie là JavaScript-accessible, acceptable cho capstone scope. Thêm comment `// SECURITY` tại mỗi điểm set cookie.

## ✅ Đã confirm với BE

| # | Câu hỏi | Kết quả |
|---|---------|---------|
| Q1 | `refreshToken` TTL? | **7 ngày** — cookie `{ expires: 7 }` |
| Q2 | `resetToken` TTL (forgot password step 2)? | **Lấy động từ `expiresInSeconds`** trong response POST /verify-reset-otp. API doc: 900s (15 phút). Không hardcode — render countdown từ giá trị server trả về |
| Q3 | Google OAuth callback error param? | **Bỏ qua parse** — `catch` block: `console.error` + `toast.error` |
| Q4 | Google OAuth callback flow? | **BE trả JSON** — FE mount `/auth/google/callback`, đọc `?code&state` từ URL (Google redirect), gọi `GET /api/auth/google/callback` qua axios → nhận `data.tokens.{accessToken, refreshToken}` từ JSON response (GH-295 shape, `data.challenge` null). Confirmed từ Swagger/browser test: BE không redirect FE với token trong URL query param |
