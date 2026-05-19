# Plan — GH-11: [FE] Flow Authentication

## Metadata
- **Status:** TESTING | **Role:** FE | **Ngày:** 2026-05-18
- **Issue:** #11 — https://github.com/GSU26SE55/frontend/issues/11
- **Sprint:** Sprint 1 (deadline 2026-05-30)

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
interface RegisterPayload       { fullName: string; email: string; password: string; confirmPassword: string; phoneNumber: string; }
interface OtpVerifyPayload      { email: string; otp: string; }
interface ResendOtpPayload      { email: string; }               // dùng chung cho resend-otp + resend-reset-otp
interface ForgotPasswordPayload { email: string; }
interface VerifyResetOtpPayload { email: string; otp: string; }
interface ResetPasswordPayload  { resetToken: string; newPassword: string; confirmPassword: string; }

// Responses
interface LoginResponseData          { accessToken: string; refreshToken: string; }
interface VerifyResetOtpResponseData { resetToken: string; }
interface AccountDto                 { id: string; email: string; fullName: string; role: string; phoneNumber?: string; avatarUrl?: string; }
```

## Schema (Zod)

```ts
// login.schema.ts
email:    z.string().email()
password: z.string().min(8)

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
| POST | `/api/auth/login` | `{ email, password }` | `CommonResponse<LoginResponseData>` |
| POST | `/api/auth/register` | `{ fullName, email, password, confirmPassword, phoneNumber }` | `CommonResponse<null>` |
| POST | `/api/auth/verify-otp` | `{ email, otp }` | `CommonResponse<null>` |
| POST | `/api/auth/resend-otp` | `{ email }` | `CommonResponse<null>` |
| POST | `/api/auth/forgot-password` | `{ email }` | `CommonResponse<null>` |
| POST | `/api/auth/verify-reset-otp` | `{ email, otp }` | `CommonResponse<VerifyResetOtpResponseData>` |
| POST | `/api/auth/resend-reset-otp` | `{ email }` | `CommonResponse<null>` |
| POST | `/api/auth/reset-password` | `{ resetToken, newPassword, confirmPassword }` | `CommonResponse<null>` |
| POST | `/api/auth/refresh-token` | `{ refreshToken }` | `CommonResponse<LoginResponseData>` |
| POST | `/api/auth/logout` | `{ refreshToken }` | `CommonResponse<null>` |
| GET | `/api/auth/google/login` | — | redirect 302 → Google |
| GET | `/api/auth/google/callback` | — | redirect → `/auth/google/callback?accessToken=&refreshToken=` |
| POST | `/api/auth/accept-invite` | — | ngoài scope — ticket Admin riêng |
| GET | `/api/auth/me` | — | `CommonResponse<AccountDto>` |
| PUT | `/api/auth/me/profile` | `{ fullName, phoneNumber }` | `CommonResponse<AccountDto>` — ngoài scope |
| POST | `/api/auth/me/avatar` | `FormData` | `CommonResponse<{ avatarUrl }>` — ngoài scope |

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

## Approach

**Token storage:** `js-cookie` lưu `accessToken` và `refreshToken` trong cookie.
- `accessToken`: expires **90 phút**
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
    const { accessToken, refreshToken } = res.data.data;
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
→ Backend callback → redirect FE: /auth/google/callback?accessToken=...&refreshToken=...

GoogleCallbackPage — thứ tự bắt buộc (trong try-catch bao toàn bộ):
  try {
    1. Đọc searchParams (accessToken, refreshToken, error)
    2. window.history.replaceState({}, '', '/auth/google/callback')  ← xóa token khỏi URL NGAY
    3. saveTokens(accessToken, refreshToken)
    4. const user = decodeToken(accessToken)   // capture rõ return value
    5. sessionStore.getState().setSession(user)
    6. navigate(redirectByRole(user.role), { replace: true })
  } catch (err) {
    console.error('[GoogleCallback]', err);  // confirmed Q3: không parse error param
    toast.error('Đăng nhập Google thất bại');
    navigate('/login', { replace: true })
  }
```

**Known Limitations (document, không fix trong Sprint 1):**
- **Multi-tab logout:** Cookie bị xóa không có native event. Tab khác sẽ phát hiện khi gọi API tiếp theo → 401 → redirect /login. Nếu cần sync ngay: dùng `BroadcastChannel` (task riêng).
- **Multi-tab refresh race:** `isRefreshing` là in-memory, không share giữa tabs. Nếu 2 tabs đồng thời refresh với token rotation → tab 2 fail → tự logout. Acceptable cho capstone scope.

**Forgot Password multi-step (single page, internal state):**
```
Step 1: nhập email → POST /forgot-password → lưu email trong component state → next step
Step 2: nhập OTP → POST /verify-reset-otp → nhận resetToken → next step
Step 3: nhập mật khẩu mới → POST /reset-password (với resetToken) → navigate('/login') + toast
// resetToken TTL = 5 phút (confirmed Q2)
// UX: hiển thị countdown 5 phút ở step 3, nếu hết hạn → toast "Mã đã hết hạn, vui lòng thử lại" → reset về step 1
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

  USERS: {
    LIST:               '/api/users',
    CREATE:             '/api/users',
    DETAIL:             (id: string) => `/api/users/${id}`,
    UPDATE:             (id: string) => `/api/users/${id}`,
    DEACTIVATE:         (id: string) => `/api/users/${id}/deactivate`,
    RESET_PASSWORD:     (id: string) => `/api/users/${id}/reset-password`,
    INVITE:             '/api/users/invite',
  },

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

  TICKETS: {
    LIST:               '/api/tickets',
    CREATE:             '/api/tickets',
    DETAIL:             (id: string) => `/api/tickets/${id}`,
    UPDATE_STATUS:      (id: string) => `/api/tickets/${id}/status`,
    ASSIGN:             (id: string) => `/api/tickets/${id}/assign`,
    ESCALATE:           (id: string) => `/api/tickets/${id}/escalate`,
    CLOSE:              (id: string) => `/api/tickets/${id}/close`,
    CLOSE_REJECT:       (id: string) => `/api/tickets/${id}/close-reject`,
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
- **Google callback token leakage:** `replaceState` ngay ở bước 2 trước khi xử lý token
- **Customer login vào web:** block sớm trong `useLogin onSuccess` — `toast.error('Vui lòng dùng Mobile App')` + `clearTokens()` (không navigate — user ở lại /login)
- **Google callback lỗi:** không parse error param — `catch` block: `console.error` + `toast.error` + `navigate('/login')`
- **resetToken hết hạn (5 phút):** countdown hiển thị ở step 3, hết giờ → toast + reset về step 1
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
| Q2 | `resetToken` TTL (forgot password step 2)? | **5 phút** — countdown UI ở step 3, hết hạn → reset step 1 |
| Q3 | Google OAuth callback error param? | **Bỏ qua parse** — `catch` block: `console.error` + `toast.error` |
