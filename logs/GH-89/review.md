## BÁO CÁO CODE REVIEW — feat/GH-89-notification-api-integration — 2026-06-20
### Scope: FE (Web)
### Effort: Deep (nhiều file, cross-layer: enums/services/hooks/UI/router/nav)

### TÓM TẮT
Tích hợp NotificationService API (POST notifications admin + 3 device-token endpoint) + promote enum lên shared + UI cơ bản. Code đúng pattern repo (service→hook→component, error handling, queryKeys factory, RBAC role-gate). `tsc`/`eslint`/`build` đều PASS. Không có Critical trong phạm vi code GH-89. Rủi ro chính nằm ở **branch dirty** (chứa thay đổi không thuộc ticket) — cần xử lý trước `/kltn-ship`.

### PHÂN TÍCH

✅ **Pass — Architecture**
- API chỉ qua `services/` → hook TanStack Query: `deviceTokenService`+`useDeviceTokens`, `adminNotificationService`+`useCreateNotification`. Không fetch trong component.
- Enum promote `shared/enums/notification.enum.ts`; admin + staff import từ shared (không lặp định nghĩa). `staff/types/notification.types.ts` re-export → file staff khác không phải đổi.
- Device-token data layer ở `shared/` (domain role-agnostic); admin create ở `features/admin/`. Không có cross-feature import (`features/A` → `features/B`).
- Dùng `shared/lib/axios` (không tạo instance mới). DELETE truyền body qua `{ data }`.

✅ **Pass — Error Handling**
- `useDeviceTokens` dùng `QUERY_KEY.deviceTokens.list()` (factory, không inline).
- `invalidateQueries` dùng `QUERY_KEY.deviceTokens.list()`.
- Form (register + create) dùng `try/catch` + `handleErrorApi({ error, setError })`; revoke (non-form) dùng `onError` → `handleErrorApi({ error })`.
- Axios interceptor map 400/422+listErrors → `EntityError`, còn lại → `HttpError` → handleErrorApi hoạt động đúng cho 409/404.

✅ **Pass — Auth & Security**
- Route `/admin/notifications` khai báo trong `router/index.tsx`, nằm dưới `ProtectedRoute > RoleRoute([ADMIN])`.
- Nav item trong `ADMIN_NAV` (chỉ render cho admin) — gate role ADMIN, không P speculative.
- Device-token UI trong `AccountSettingsPage` (đã dưới ProtectedRoute). Không lưu token vào localStorage. List device không lộ raw token.

✅ **Pass — Code Quality / UI**
- Component PascalCase; UI primitive từ `shared/components/ui` (Button/Input/Select/Textarea/Checkbox/Card/Label) — không custom lại shadcn.
- Không hardcode URL (ENDPOINTS), không `console.log`.
- Loading/error/empty state xử lý trong `DeviceTokensSection`; `isPending` trong cả 2 form.

🟡 **Warning — Branch không sạch (ship risk)** — `git diff dev` lộ thay đổi KHÔNG thuộc GH-89: `ReactivatePage`, `CrossDeviceConfirmPage`, route `/reactivate` + `/2fa/cross-device-confirm`, `TrustedDevicesSection` trong AccountSettingsPage, `logs/GH-90/plan.md`, `docs/api-*.md`. Đây là working-tree dirty có sẵn trước khi tạo branch.
  - _Gợi ý:_ Khi `/kltn-ship`, chỉ `git add` đúng file GH-89 (xem danh sách dưới). KHÔNG `git add -A`. Nếu không, PR sẽ lẫn code ticket khác.

🟡 **Warning — Validation field-name casing** — `CreateNotificationForm`/register form truyền `setError` cho `handleErrorApi`. BE trả `listErrors[].field` dạng PascalCase (`"Title"`, `"Body"`, `"UserId"` — theo api-notification.md) nhưng RHF field là camelCase (`title`/`body`/`userId`) → `setError("Title")` không map xuống đúng input.
  - _Mức độ:_ Thấp — Zod validate client-side trước (min/max/uuid) nên hầu hết lỗi không tới BE. Đây là pattern chung toàn app, không riêng GH-89.

🟡 **Warning — `DeviceTokensSection` ở `shared/` nhưng 1 consumer** — hiện chỉ `AccountSettingsPage` (feature auth) dùng. Data layer ở shared là hợp lý (role-agnostic), nhưng component có thể đặt `features/auth/components/`. Giữ ở shared theo plan đã chốt (device-token domain dùng chung mọi role) — chấp nhận được.

🟡 **Warning — `entityId` không có input** — payload hỗ trợ `entityId` nhưng form chỉ có `entityType`. Deep-link thường cần cả 2. Minimal admin tooling nên chấp nhận; ghi nhận nếu cần mở rộng.

### RỦI RO & LƯU Ý
- **Ship:** chỉ stage 19 file GH-89 — created: `shared/enums/notification.enum.ts`, `shared/types/device-token.types.ts`, `shared/schemas/device-token.schema.ts`, `shared/services/device-token.service.ts`, `shared/hooks/useDeviceTokens.ts`, `shared/components/device-tokens/DeviceTokensSection.tsx`, `features/admin/{types,schemas,services,hooks}/...notification...`, `features/admin/components/CreateNotificationForm.tsx`, `features/admin/pages/NotificationAdminPage.tsx`; modified: `staff/types/notification.types.ts`, `shared/utils/endpoints.ts`, `shared/utils/queryKeys.ts`, `features/auth/pages/AccountSettingsPage.tsx`, `shared/components/layout/AppLayout.tsx`, `router/index.tsx`; deleted: `staff/enums/notification.enum.ts`. (Lưu ý: AccountSettingsPage + router còn lẫn hunk của ticket khác — cần review hunk khi add.)
- **Web-push thật chưa wire** (đúng scope) — UI device-token dùng token nhập tay; production cần FCM/service worker ở issue sau.
- **Revoke-từ-list không khả thi** do API: `GET` không trả token, `DELETE` cần token → UI dùng ô "hủy theo token". Ràng buộc API, không phải lỗi code.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
Code GH-89 đạt chuẩn, không Critical. Warning đều low-severity hoặc thuộc process (branch dirty) — xử lý ở `/kltn-ship` bằng cách stage chọn lọc.
