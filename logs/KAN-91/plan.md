# Plan — KAN-91: [FE] ReactJS scaffold — Vite + Routing + Axios + shadcn/ui

## Mục tiêu
Scaffold toàn bộ nền tảng kỹ thuật cho Web App (React 19 + TypeScript). Repo hiện tại trống sau khi PR #4 xóa `code/` folder. Cần tạo lại từ đầu theo đúng cấu trúc feature-based định nghĩa trong `rules/tech/fe.md`.

Covers toàn bộ 5 subtask:
- KAN-181: Khởi tạo React project với Vite
- KAN-182: Cấu hình routing (React Router DOM v7)
- KAN-185: Setup HTTP client với auto token refresh (Axios interceptors)
- KAN-186: Cài đặt shadcn/ui + Tailwind CSS v4
- KAN-189: Setup Zustand store

---

## Các file sẽ tạo

| File | Hành động | Mô tả |
|------|-----------|-------|
| `package.json`, `vite.config.ts`, `tsconfig*.json` | create | Vite + React 19 + TypeScript config |
| `index.html`, `public/` | create | Entry HTML |
| `components.json` | create | shadcn/ui config |
| `eslint.config.js` | create | ESLint + no-restricted-imports cho feature isolation |
| `tailwind.config.ts` | create | Tailwind v4 config |
| `src/main.tsx` | create | Entry point render `<App />` |
| `src/App.tsx` | create | Providers: QueryClient, AuthProvider, ThemeProvider, Router, Toaster |
| `src/config/env.ts` | create | Zod-validate `import.meta.env` khi boot |
| `src/router/index.tsx` | create | `createBrowserRouter` — toàn bộ route tree |
| `src/router/ProtectedRoute.tsx` | create | Redirect `/login` nếu chưa auth |
| `src/router/RoleRoute.tsx` | create | Redirect `/unauthorized` nếu sai role |
| `src/shared/lib/axios.ts` | create | Axios instance + interceptors (attach token + refresh) |
| `src/shared/lib/utils.ts` | create | shadcn `cn()` utility |
| `src/shared/stores/sessionStore.ts` | create | Zustand: token, user, setToken, logout |
| `src/shared/context/authContext.tsx` | create | AuthProvider: hydrate sessionStore từ cookie khi boot |
| `src/shared/types/api.types.ts` | create | `ResponseData<T>`, `PaginationResponse<T>`, `ErrorEntity` |
| `src/shared/types/common.types.ts` | create | `BaseFilterPagination`, shared query types |
| `src/shared/components/layout/AppLayout.tsx` | create | Sidebar + Header + `<Outlet />` |
| `src/shared/components/layout/AuthLayout.tsx` | create | Centered card layout |
| `src/shared/components/layout/Sidebar.tsx` | create | Nav links render theo role |
| `src/shared/components/layout/Header.tsx` | create | Avatar, notification bell, logout |
| `src/shared/components/common/` | create | LoadingSpinner, ErrorBoundary, EmptyState |
| `src/shared/hooks/useDebounce.ts` | create | Debounce hook |
| `src/features/auth/pages/LoginPage.tsx` | create | Login screen (shell — form logic sau) |
| `src/features/auth/types/index.ts` | create | `LoginPayload`, `AuthUser` types |
| `src/features/admin/pages/`, `src/features/manager/pages/`, `src/features/staff/pages/` | create | Page shells (placeholder) |
| `.env.example` | create | Template biến môi trường |

---

## Approach

### 1. Init project
```bash
npm create vite@latest . -- --template react-ts
```
Cài tại root repo (không dùng subfolder `code/` như trước).

### 2. Cài packages
```bash
npm install react-router-dom @tanstack/react-query zustand axios \
  zod react-hook-form @hookform/resolvers \
  sonner js-cookie jwt-decode next-themes recharts date-fns
npm install -D @types/js-cookie
```

### 3. Tailwind v4 + shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button input label form card dialog dropdown-menu table badge avatar separator sheet skeleton
```

### 4. Cấu trúc `src/`
Tạo toàn bộ folder tree theo `fe.md`. Các feature pages chỉ là shell (placeholder `<div>`) — logic nghiệp vụ làm ở ticket sau.

### 5. Axios interceptors
- Request: attach `Authorization: Bearer {accessToken}` từ `sessionStore`
- Response 401: gọi `POST /auth/refresh` → update token → retry request gốc
- Response 401 sau retry: redirect `/login`

### 6. Router
```
/ → redirect theo role
/login, /forgot-password → AuthLayout
/admin/* → ProtectedRoute(Admin) > AppLayout
/manager/* → ProtectedRoute(Manager) > AppLayout
/staff/* → ProtectedRoute(Staff) > AppLayout
/unauthorized → 403 page
```

### 7. QueryClient defaults
```ts
staleTime: 2 phút, gcTime: 10 phút, retry: 1, refetchOnWindowFocus: false
```

### 8. env validation
`src/config/env.ts` — Zod schema validate `import.meta.env`, throw khi thiếu `VITE_API_BASE_URL`.

---

## Dependencies & Edge Cases

- **Tailwind v4** dùng `@import "tailwindcss"` trong CSS thay vì `@tailwind` directives
- **shadcn/ui** generate source vào `src/shared/components/ui/` (override default path khi init)
- **Token refresh race condition**: dùng `isRefreshing` flag + queue các request đang pending để không gọi refresh nhiều lần đồng thời
- **Zustand hydration**: `authContext.tsx` đọc cookie khi mount → set sessionStore → tránh flash unauthenticated

---

## Estimate

- **Size:** Large (> 4 giờ)
- **Thời gian:** ~5–6 giờ (scaffold + config đầy đủ)
- **Hành động:** Code sau khi user xác nhận plan
