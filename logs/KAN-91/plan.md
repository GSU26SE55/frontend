# Plan — KAN-91: [FE] ReactJS scaffold — Vite + Routing + Axios + shadcn/ui

## Mục tiêu

Hoàn thiện nền tảng kỹ thuật cho Web App ReactJS trong thư mục `code/` để các ticket FE tiếp theo có thể triển khai trên cấu trúc chuẩn.

Output mong đợi:
- App boot qua provider composition thay vì render trực tiếp mock page.
- Routing có protected route và role route cho Admin / Manager / Staff.
- Axios instance tập trung, lấy base URL từ env và attach token.
- Zustand store là source of truth cho auth session.
- Auth bootstrap từ cookie, không dùng localStorage.
- Layout shell và placeholder pages cho các portal.
- Reuse shadcn/ui hiện có, không thêm dependency mới.

## Các file sẽ tạo/sửa

| File | Hành động | Mô tả |
|------|-----------|-------|
| `code/src/App.tsx` | modify | Compose QueryClient, AuthProvider, ThemeProvider, RouterProvider, Toaster |
| `code/src/main.tsx` | modify | Giữ bootstrap render App nếu cần cleanup |
| `code/src/App.css` | modify/remove use | Không dùng style demo/mock nếu app shell không cần |
| `code/src/config/env.ts` | create | Zod validate `VITE_API_BASE_URL` |
| `code/src/router/index.tsx` | create | createBrowserRouter route tree |
| `code/src/router/ProtectedRoute.tsx` | create | Redirect `/login` nếu chưa auth, chờ hydration |
| `code/src/router/RoleRoute.tsx` | create | Redirect `/unauthorized` nếu sai role |
| `code/src/shared/lib/axios.ts` | create | Axios instance duy nhất + Authorization interceptor |
| `code/src/shared/stores/sessionStore.ts` | create | Zustand auth session store |
| `code/src/shared/context/authContext.tsx` | create | Hydrate session từ cookie khi app boot |
| `code/src/shared/types/auth.types.ts` | create | UserRole, AuthUser, session types |
| `code/src/shared/types/api.types.ts` | create | Shared API response types |
| `code/src/shared/types/common.types.ts` | create | Shared pagination/filter types |
| `code/src/shared/components/layout/AppLayout.tsx` | create | Sidebar + Header + Outlet |
| `code/src/shared/components/layout/AuthLayout.tsx` | create | Centered auth card layout |
| `code/src/shared/components/layout/Sidebar.tsx` | create | Nav links theo role |
| `code/src/shared/components/layout/Header.tsx` | create | Role badge + logout |
| `code/src/shared/components/common/LoadingSpinner.tsx` | create | Loading state cho auth hydration |
| `code/src/shared/components/common/UnauthorizedPage.tsx` | create | Trang 403 |
| `code/src/features/auth/pages/LoginPage.tsx` | create | Login placeholder UI |
| `code/src/features/admin/pages/AdminDashboardPage.tsx` | create | Admin portal placeholder |
| `code/src/features/manager/pages/ManagerDashboardPage.tsx` | create | Manager portal placeholder |
| `code/src/features/staff/pages/StaffDashboardPage.tsx` | create | Staff portal placeholder |

## Approach

1. Giữ nguyên project Vite hiện có trong `code/`; không init lại project và không cài thêm package.
2. Reuse UI primitives hiện có tại `code/src/components/ui/*` và `cn()` tại `code/src/lib/utils.ts`; không move shadcn sang `shared/` trong ticket này để tránh churn.
3. Tạo auth foundation:
   - `sessionStore.ts` lưu `accessToken`, `refreshToken`, `user`, `isHydrated`.
   - `authContext.tsx` đọc cookie bằng `js-cookie`, decode JWT bằng `jwt-decode`, populate Zustand, expose logout.
   - Không lưu token trong localStorage.
4. Tạo `env.ts` validate `VITE_API_BASE_URL` bằng Zod và `axios.ts` dùng env đó.
5. Tạo route guards:
   - `ProtectedRoute` chờ hydration, redirect unauthenticated user về `/login`.
   - `RoleRoute` redirect user sai role về `/unauthorized`.
6. Tạo route tree:
   - `/` redirect theo role hoặc `/login`.
   - `/login` render trong `AuthLayout`.
   - `/admin`, `/manager`, `/staff` render trong `AppLayout` và guard theo role.
   - `/unauthorized` render 403 page.
7. Tạo placeholder pages cho auth/admin/manager/staff, không gọi API trực tiếp trong page.
8. Replace `App.tsx` để app boot bằng providers và router thay vì render `MockCrudPage` trực tiếp. Giữ files mock CRUD hiện có để không làm mất work KAN-418.

## Dependencies & Edge Cases

- Dependency: các package cần thiết đã có trong `code/package.json`.
- Edge case: route guard không được redirect trước khi auth hydration xong.
- Edge case: claim role trong JWT BE chưa confirm; logic decode phải centralized và conservative.
- Edge case: chưa có BE refresh contract nên không implement refresh queue giả định.
- Edge case: thiếu `VITE_API_BASE_URL` sẽ fail fast khi boot/build theo yêu cầu env validation.

## Ước tính

- Size: Large
- Thời gian: ~5–6 giờ
- Ghi chú workflow: Ticket Large cần được user/leader approve trước khi code. Plan đã được user approve trong Claude Code plan mode.
