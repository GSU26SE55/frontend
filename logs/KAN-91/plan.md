# Plan — KAN-91: [FE] ReactJS scaffold — Vite + Routing + Axios + shadcn/ui

## Mục tiêu

Hoàn thiện toàn bộ nền tảng kỹ thuật FE từ Vite cơ bản hiện tại. Đủ để các ticket feature tiếp theo có thể implement ngay mà không cần cấu hình thêm.

**5 subtask cần hoàn thành:**
- KAN-181 ✅ Vite + React 19 (đã có)
- KAN-182 — React Router DOM v7: createBrowserRouter, ProtectedRoute, RoleRoute
- KAN-185 — Axios + interceptors: auto-attach token + auto refresh khi 401
- KAN-186 — Tailwind CSS v4 + shadcn/ui (12 components)
- KAN-189 — Zustand v5 store + AuthProvider (hydrate từ cookie khi boot)

---

## Các file sẽ tạo/sửa

| File | Hành động | Subtask |
|------|-----------|---------|
| `package.json` | install thêm packages | tất cả |
| `vite.config.ts` | thêm path alias `@/` | - |
| `tsconfig.app.json` | thêm paths `@/*` | - |
| `src/config/env.ts` | Zod-validate env vars khi boot | - |
| `.env.example` | template env | - |
| `src/router/index.tsx` | createBrowserRouter — toàn bộ route tree | KAN-182 |
| `src/router/ProtectedRoute.tsx` | redirect /login nếu chưa auth | KAN-182 |
| `src/router/RoleRoute.tsx` | redirect /unauthorized nếu sai role | KAN-182 |
| `src/shared/lib/axios.ts` | Axios instance + interceptors | KAN-185 |
| `src/shared/lib/utils.ts` | shadcn cn() utility | KAN-186 |
| `src/shared/stores/sessionStore.ts` | Zustand: token, user, setToken, logout | KAN-189 |
| `src/shared/context/authContext.tsx` | AuthProvider: hydrate store từ cookie | KAN-189 |
| `src/shared/types/api.types.ts` | ResponseData, PaginationResponse, ErrorEntity | - |
| `src/shared/types/common.types.ts` | BaseFilterPagination | - |
| `src/shared/hooks/useDebounce.ts` | debounce hook | - |
| `src/shared/components/layout/AppLayout.tsx` | sidebar + header + Outlet | - |
| `src/shared/components/layout/AuthLayout.tsx` | centered card cho login | - |
| `src/shared/components/layout/Sidebar.tsx` | nav links theo role | - |
| `src/shared/components/layout/Header.tsx` | avatar, bell, logout | - |
| `src/shared/components/common/LoadingSpinner.tsx` | spinner | - |
| `src/shared/components/common/ErrorBoundary.tsx` | error boundary | - |
| `src/shared/components/common/EmptyState.tsx` | empty state | - |
| `src/App.tsx` | providers: QueryClient, Auth, Theme, Router, Toaster | - |
| `src/main.tsx` | giữ nguyên | - |
| `src/features/auth/pages/LoginPage.tsx` | stub | - |
| `src/features/auth/pages/ForgotPasswordPage.tsx` | stub | - |
| `src/features/admin/pages/` | 4 page stubs | - |
| `src/features/manager/pages/` | 4 page stubs | - |
| `src/features/staff/pages/` | 2 page stubs | - |
| `eslint.config.js` | thêm no-restricted-imports rule | - |

---

## Approach

### 1. Install packages
```bash
npm install react-router-dom @tanstack/react-query zustand axios \
  react-hook-form @hookform/resolvers zod sonner js-cookie jwt-decode \
  next-themes recharts date-fns
npm install -D @types/js-cookie
```

### 2. Tailwind v4 + shadcn/ui
- Tailwind v4 config via `vite.config.ts` plugin (khác v3 — không dùng tailwind.config.js)
- `npx shadcn@latest init` → thêm 12 components vào `src/shared/components/ui/`

### 3. Axios interceptors (KAN-185)
- Request interceptor: attach `Authorization: Bearer {accessToken}` từ cookie
- Response interceptor: nếu 401 → gọi `/auth/refresh` → retry request gốc
- Nếu refresh fail → logout + redirect `/login`

### 4. Zustand + AuthProvider (KAN-189)
- `sessionStore`: lưu `{ user, accessToken }` — init từ `undefined`
- `AuthProvider`: đọc cookie `accessToken` khi mount → decode JWT → hydrate store
- Chỉ hydrate 1 lần khi boot, không re-fetch

### 5. Router (KAN-182)
```
/                       → redirect theo role
/login                  → AuthLayout > LoginPage
/forgot-password        → AuthLayout > ForgotPasswordPage
/admin/*                → ProtectedRoute(Admin) > AppLayout
/manager/*              → ProtectedRoute(Manager) > AppLayout
/staff/*                → ProtectedRoute(Staff) > AppLayout
/unauthorized           → 403 page
```

---

## Dependencies & Edge Cases

- Tailwind v4: không dùng `tailwind.config.js` — import CSS trực tiếp trong `index.css`
- shadcn/ui init: cần `@/` alias trước khi chạy
- Axios refresh loop: dùng flag `isRefreshing` + queue để tránh gọi refresh nhiều lần đồng thời
- AuthProvider: nếu token expired (check `exp` bằng jwt-decode) → logout ngay, không redirect

---

## Ước tính

- **Size:** Large
- **Thời gian:** ~5–6 giờ
- **Branch:** `feature/KAN-91-fe-scaffold`
