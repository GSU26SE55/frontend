# Plan — KAN-91: [FE] ReactJS scaffold — Vite + Routing + Axios + shadcn/ui

## Mục tiêu

Dựng toàn bộ nền tảng kỹ thuật cho Web App (ReactJS). Output là một repo có thể chạy được với:
- Cấu trúc folder chuẩn (feature-based + shared)
- Routing có protected route theo role
- Axios instance với interceptors (auto-attach token + refresh)
- shadcn/ui + Tailwind CSS v4
- Zustand store cho auth session
- Placeholder pages cho Admin / Manager / Staff portal
- Env validation qua Zod

Bao gồm 5 subtasks: KAN-181, KAN-182, KAN-185, KAN-186, KAN-189.

---

## Các file sẽ tạo/sửa

### Project root
| File | Hành động | Mô tả |
|------|-----------|-------|
| `package.json` | create | Dependencies theo tech-defaults |
| `vite.config.ts` | create | Vite config (path alias `@/` → `src/`) |
| `tsconfig.json` | create | TS config với path alias |
| `tsconfig.node.json` | create | TS config cho Vite |
| `index.html` | create | HTML entry |
| `.env.example` | create | Template biến môi trường |
| `components.json` | create | shadcn/ui config |
| `tailwind.config.ts` | create | Tailwind v4 config |
| `postcss.config.mjs` | create | PostCSS config |

### src/
| File | Hành động | Mô tả |
|------|-----------|-------|
| `src/main.tsx` | create | ReactDOM render + QueryClientProvider wrap |
| `src/App.tsx` | create | Providers: QueryClient, AuthProvider, ThemeProvider, RouterProvider, Toaster |
| `src/config/env.ts` | create | Zod-validate import.meta.env, throw nếu thiếu |
| `src/index.css` | create | Tailwind directives + shadcn CSS vars |

### src/router/
| File | Hành động | Mô tả |
|------|-----------|-------|
| `src/router/index.tsx` | create | createBrowserRouter — toàn bộ route tree |
| `src/router/ProtectedRoute.tsx` | create | Redirect `/login` nếu chưa auth |
| `src/router/RoleRoute.tsx` | create | Redirect `/unauthorized` nếu sai role |

### src/shared/
| File | Hành động | Mô tả |
|------|-----------|-------|
| `src/shared/stores/sessionStore.ts` | create | Zustand: token, user, setToken, logout |
| `src/shared/context/authContext.tsx` | create | AuthProvider: hydrate sessionStore từ cookie khi boot |
| `src/shared/lib/axios.ts` | create | Axios instance + interceptors |
| `src/shared/lib/utils.ts` | create | shadcn cn() utility |
| `src/shared/types/api.types.ts` | create | ResponseData\<T\>, PaginationResponse\<T\>, ErrorEntity |
| `src/shared/types/common.types.ts` | create | BaseFilterPagination, shared query types |
| `src/shared/components/layout/AppLayout.tsx` | create | Sidebar + Header + \<Outlet /\> |
| `src/shared/components/layout/AuthLayout.tsx` | create | Centered card layout |
| `src/shared/components/layout/Sidebar.tsx` | create | Nav links render theo role |
| `src/shared/components/layout/Header.tsx` | create | Avatar, notification bell, logout |
| `src/shared/components/common/LoadingSpinner.tsx` | create | Spinner component |
| `src/shared/components/common/ErrorBoundary.tsx` | create | React error boundary |
| `src/shared/components/common/EmptyState.tsx` | create | Empty state component |
| `src/shared/hooks/useDebounce.ts` | create | Debounce hook |

### src/features/ (placeholder pages)
| File | Hành động | Mô tả |
|------|-----------|-------|
| `src/features/auth/pages/LoginPage.tsx` | create | Trang đăng nhập (placeholder) |
| `src/features/auth/pages/ForgotPasswordPage.tsx` | create | Trang quên mật khẩu (placeholder) |
| `src/features/auth/types/index.ts` | create | LoginPayload, AuthUser types |
| `src/features/admin/pages/index.tsx` | create | Admin placeholder page |
| `src/features/manager/pages/index.tsx` | create | Manager placeholder page |
| `src/features/staff/pages/index.tsx` | create | Staff placeholder page |
| `src/pages/UnauthorizedPage.tsx` | create | Trang 403 |

---

## Approach

### 1. Khởi tạo project (KAN-181)
Dùng `npm create vite@latest` với template `react-ts`. Cài toàn bộ packages theo `tech/fe.md`.
Cấu hình path alias `@/` → `src/` trong vite.config.ts và tsconfig.json.

### 2. Routing (KAN-182)
Dùng `createBrowserRouter` (React Router DOM v7):
```
/                → redirect theo role
/login           → AuthLayout > LoginPage
/forgot-password → AuthLayout > ForgotPasswordPage
/admin/*         → ProtectedRoute(Admin) > AppLayout > AdminPages
/manager/*       → ProtectedRoute(Manager) > AppLayout > ManagerPages
/staff/*         → ProtectedRoute(Staff) > AppLayout > StaffPages
/unauthorized    → UnauthorizedPage
```
`ProtectedRoute` kiểm tra `sessionStore.token` — nếu null redirect `/login`.
`RoleRoute` kiểm tra `sessionStore.user.role` — nếu sai redirect `/unauthorized`.

### 3. Axios interceptors (KAN-185)
`shared/lib/axios.ts` — 1 instance duy nhất:
- **Request interceptor:** attach `Authorization: Bearer <token>` từ sessionStore
- **Response interceptor:** nếu 401 → gọi refresh endpoint → retry request gốc → nếu refresh fail → logout + redirect `/login`
- Queue pending requests trong lúc refresh để không gọi refresh nhiều lần song song

### 4. shadcn/ui + Tailwind CSS v4 (KAN-186)
- Init shadcn với `npx shadcn@latest init`
- Cấu hình theme CSS variables trong `src/index.css`
- Cài sẵn các component hay dùng: Button, Card, Input, Label, Badge, Spinner

### 5. Zustand store (KAN-189)
`sessionStore.ts` — source of truth duy nhất cho auth:
```ts
{ token, refreshToken, user } — state
{ setSession, logout, setToken } — actions
```
`authContext.tsx` — khi app boot, đọc cookie (js-cookie) → populate sessionStore nếu token còn hạn (jwt-decode check exp).

---

## Dependencies & Edge Cases

- **Token refresh race condition:** Nếu nhiều request 401 cùng lúc, chỉ gọi refresh 1 lần — queue các request còn lại.
- **Cookie vs Memory:** Token lưu trong cookie (js-cookie), sessionStore giữ in-memory copy — sync khi boot và khi set/clear.
- **Route redirect on root `/`:** Cần đọc role từ sessionStore để redirect đúng portal, nếu chưa auth → `/login`.
- **Tailwind v4 + shadcn:** shadcn dùng CSS variables, cần đảm bảo `@layer base` có `--background`, `--foreground` etc.
- **Path alias:** Cả vite.config.ts và tsconfig.json đều phải có alias `@/` cùng nhau — thiếu 1 trong 2 sẽ lỗi.

---

## Ước tính

- **Size:** Large
- **Thời gian:** ~6 giờ (tạo ~35 file, cấu hình nhiều layer)
- **Theo workflow:** Cần hỏi Leader trước khi code vì Size = Large
