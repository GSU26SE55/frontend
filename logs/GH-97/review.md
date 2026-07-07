## BÁO CÁO CODE REVIEW — feat/GH-97-wire-notification-settings-page — 2026-06-22
### Scope: FE (Web)
### Effort: Standard

### TÓM TẮT
Wire trang Notification Settings vào `GET`/`PUT /api/notification-preferences`, theo đúng pattern `DeviceTokensSection` (shared service/hook/types/schema + section mount tab vào `AccountSettingsPage`). Code sạch, đúng convention; 1 rủi ro runtime ở pre-work axios normalize đã được harden ngay trong review.

### PHÂN TÍCH

#### Architecture
- ✅ Không có business logic trong component — chỉ UI + form state; API đi qua `service` → `hook` TanStack Query.
- ✅ File đặt ở `shared/` hợp lý — preference cross-cut role (mọi role `[Authorize]`), nhất quán với `device-tokens` đã ở shared.
- ✅ Không cross-feature import; không tạo Axios instance mới (dùng `shared/lib/axios.ts`).
- ✅ Zustand không bị dùng làm server-state cache.

#### Code Quality
- ✅ Component PascalCase (`NotificationPreferencesSection`).
- ✅ Không hardcode URL — qua `ENDPOINTS.NOTIFICATION_PREFERENCES`; endpoint thêm vào `endpoints.ts` trước.
- ✅ Loading (`isLoading` → spinner) + error (`isError` → thông báo + nút "Thử lại" gọi `refetch`) đều xử lý.
- ✅ Không còn `console.log`.

#### Error Handling
- ✅ `queryKey` dùng factory `QUERY_KEY.notificationPreferences.me()`; root là string đơn `notificationPreferences` (khớp pattern `deviceTokens`).
- ✅ `invalidateQueries` dùng factory, không hardcode string.
- ✅ Form submit dùng `try-catch` + `handleErrorApi({ error, setError })` (đúng rule form FE), không chỉ toast.
- ✅ Không tự `toast.error` trong hook — delegate `handleErrorApi`.
- ✅ Zod schema mirror đầy đủ rule BE (HHMM regex + timezone min1/max100 + `.refine()` cặp quiet hours) → lỗi field bắt client-side, camelCase đúng.

#### UI / UX
- ✅ Dùng primitive shadcn có sẵn (`Button`/`Input`/`Label`/`Checkbox`/`Select`); không custom lại; không thêm shadcn Switch mới.
- ✅ Layout render giống `DeviceTokensSection` (cùng slot content), tab "Tùy chọn thông báo" thêm vào `MENU as const` đúng cách — `MenuKey` tự suy ra.
- ✅ Quiet hours toggle derive qua `useWatch` (không state song song) → tránh `react-hooks/set-state-in-effect`; effect chỉ `reset(data)`.

#### Auth & Security
- ✅ Không tạo route mới — chỉ là tab trong `AccountSettingsPage` (đã wrap `ProtectedRoute` ở route `/account`). Không cần auth wrap bổ sung.
- ✅ Không dùng `localStorage`; không render sensitive data.
- ✅ PUT không gửi `userId` (BE `[JsonIgnore]`, lấy từ JWT claim).

🟡 Warning (ĐÃ FIX trong review) — `src/shared/lib/axios.ts:183` — normalize `e.field.charAt(0)` sẽ **throw** nếu key JSON là `Field` (PascalCase) → `e.field` undefined. Interceptor app-wide nên throw sẽ phá error-handling **mọi form**. → Đã thêm guard `typeof e.field === "string" ? … : e` (giữ nguyên item nếu không có `field`). `tsc` + `eslint` PASS lại sau fix.

### RỦI RO & LƯU Ý
- **Runtime chưa verify (Bước 9 — để `/kltn-test`):** cần submit 1 request 400 thật (vd timezone sai/HH:mm sai bypass UI) để xác nhận (a) key JSON validation-pipeline là `field` camelCase, (b) interceptor normalize + `setError` map đúng xuống input end-to-end. Guard đã chặn crash nếu key là `Field`, nhưng nếu thế thì lỗi sẽ không map xuống field (no-op) — cần biết để quyết có chuẩn hoá BE hay không.
- **axios.ts là thay đổi cross-cutting** (sửa toàn app): hành vi mới chỉ là hạ chữ đầu `field` — không đổi luồng 401/refresh/queue. Các form khác chỉ được lợi (lỗi BE giờ map đúng), không có regression về shape.
- Edge clear 1 ô time khi quiet hours bật → map thành `""` (không null) → giữ block mở + báo "Định dạng phải là HH:mm" (không collapse). Hành vi hợp lý.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**.
Tất cả Critical: không có. Warning duy nhất (axios throw-safety) đã fix trong review. Còn 1 verify runtime để dành `/kltn-test` (Bước 9).
