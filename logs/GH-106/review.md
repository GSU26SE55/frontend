## BÁO CÁO CODE REVIEW — feat/GH-106-fix-rbac-permissions — 2026-06-22
### Scope: FE (Web)
### Effort: Deep (auth/RBAC cross-cutting, 8 files)

### TÓM TẮT
Refactor catalog `P.*` khớp đúng 40 permission code BE + wire `GET /api/auth/me/permissions` để lấy permission server-resolved vào `sessionStore` (perm[] JWT giữ fallback). Code sạch, đúng convention FE, 3 quality gate PASS. Không phát hiện Critical. 1 rủi ro phụ thuộc hành vi logout (hiện đang an toàn) — ghi nhận để theo dõi.

### PHÂN TÍCH

✅ **Pass — Architecture**
- API qua service → hook đúng layer: `permission.service.ts` (axiosInstance) → `useMyPermissions` (TanStack Query) → consume ở `authContext`. Không fetch trực tiếp trong component.
- File đặt đúng chỗ: `permission.{types,service}.ts` + `useMyPermissions.ts` trong `features/auth/`; `authz.ts`/`endpoints.ts`/`queryKeys.ts`/`sessionStore.ts` trong `shared/`.
- Không tạo Axios instance mới — `permission.service.ts:1` dùng `@/shared/lib/axios`.
- `setPermissions` chỉ cập nhật `user.permissions` (auth session) — không biến Zustand thành server-state cache; server state vẫn nằm ở React Query.

✅ **Pass — Code Quality**
- Endpoint không hardcode: `ENDPOINTS.AUTH.ME_PERMISSIONS` (endpoints.ts:21).
- queryKey dùng factory `QUERY_KEY.currentUser.permissions()` — không inline array (useMyPermissions.ts:13).
- Không `console.log`, không hardcode token/URL.
- `setPermissions` immutable (`{...state.user, permissions}`) — components subscribe `user` re-render đúng (sessionStore.ts).
- Optional-chain an toàn: `response.data.data?.permissions.map(...) ?? []` — null-safe khi role không active/chưa gán (tsc xác nhận).

✅ **Pass — Auth & Security**
- Không thêm route/page mới → không cần `ProtectedRoute`/`RoleRoute`.
- Token vẫn cookie-only; không đụng `localStorage`.
- `/me/permissions` đúng endpoint cho RBAC (subset theo role), không dùng catalog `/api/permissions`.

✅ **Pass — Correctness (đã kiểm chứng)**
- 40 code `P.*` khớp 2 nguồn BE (`PermissionCodes.cs` + `PermissionSeed.cs`).
- `P.TICKET_SAGA_VIEW/REPROCESS` giữ nguyên → `SagaDebugPage.tsx:55-56` không vỡ. Không component nào dùng các `P.*` đã xóa.
- Không vòng lặp re-render: `data` của React Query ổn định reference + `setPermissions` là action zustand ổn định → deps `[permissions, setPermissions]` không đổi sau sync.
- Thứ tự effect đúng: effect session (setSession) chạy trước effect permissions (setPermissions) → khi permissions về thì `user` đã tồn tại (setPermissions không no-op).

🟡 **Warning — `authz.ts` (shared) ↔ `features/auth` import**
- `authContext.tsx` (shared) import `useMyPermissions` từ `features/auth/hooks`. Đây KHÔNG vi phạm `no-restricted-imports` (rule chỉ chặn feature→feature) và **đã là pattern sẵn có** (authContext vốn import `useHydrateSession` cùng kiểu). ESLint PASS. Ghi nhận để nhất quán, không cần sửa.

🟡 **Warning — `useMyPermissions` không xử lý error tường minh**
- Khi `/me/permissions` lỗi → `data` undefined → `setPermissions` không chạy → giữ perm[] JWT (fallback đúng thiết kế). Không toast (tránh nhiễu cho background sync). Chấp nhận được; nếu sau này cần phân biệt "permission stale do fetch fail" thì thêm xử lý.

### RỦI RO & LƯU Ý
- **Query key tĩnh `[currentUser, "permissions"]` không scope theo accountId.** Hiện AN TOÀN vì: `useLogout` dùng `window.location.href` (full reload → wipe React Query cache in-memory); `useLogin`/`useVerify2faLogin` cũng reload; `useAcceptInvite`/`GoogleCallbackPage` (SPA) xuất phát từ trạng thái chưa auth. ⟹ Không có đường chuyển user-này-sang-user-khác mà giữ cache. **Theo dõi:** nếu sau này logout đổi sang SPA (không reload), phải `queryClient.removeQueries(QUERY_KEY.currentUser.permissions())` lúc logout HOẶC scope key theo accountId để tránh rò permissions giữa user.
- **Invalidate khi admin đổi quyền** (đổi quyền → áp ngay không cần login lại) là out-of-scope ticket này; query key đã sẵn sàng để wire ở follow-up.
- `P.*` mới (38 code ngoài 2 saga) hiện chưa gắn vào button/route nào — đúng plan; việc gắn feature-gate UI là ticket sau.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
- tsc --noEmit: No errors · eslint --max-warnings=0: No issues · npm run build: OK.
- Không Critical. 2 Warning đều là ghi nhận, không chặn ship.
- Tiếp theo: `/kltn-test GH-106`.
