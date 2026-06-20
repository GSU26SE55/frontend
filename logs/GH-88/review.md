## BÁO CÁO CODE REVIEW — feat/GH-88-auth-advanced-features — 2026-06-20
### Scope: FE (Web)
### Effort: Deep (PR ~36 file, cross-feature admin + auth)

### TÓM TẮT
Implement 5 nhóm tính năng auth nâng cao (Trusted Devices, 2FA SMS/cross-device, Reactivate, GDPR export, Admin merge) đúng plan. Kiến trúc sạch: component → hook (TanStack Query) → service → axios; không cross-feature import; tsc/eslint/build đều PASS. Một rủi ro phi-code cần xử lý ở bước ship (working tree chứa thay đổi không thuộc GH-88).

### PHÂN TÍCH

✅ **Pass — Architecture**
- API call đều qua `services/` → hook TanStack Query, không fetch trực tiếp trong component.
- File mới đặt đúng feature: trusted-device/cross-device/reactivate/export → `features/auth/`; merge → `features/admin/`; `deviceId.ts` → `shared/lib/` (dùng cross-cutting qua axios — hợp lệ).
- Không có cross-feature import (admin↔auth↔manager↔staff) — đã grep xác minh.
- Không tạo axios instance mới — `X-Device-Id` chèn vào request interceptor của `shared/lib/axios.ts`.
- Zustand không bị dùng cho server state.

✅ **Pass — Error handling**
- queryKey/invalidate dùng `QUERY_KEY.trustedDevices.list()` + `KEY.trustedDevices`/`KEY.admin.accounts` — không inline string.
- Form submit (`ReactivatePage`, `CrossDeviceConfirmPage`, `MergeAccountDialog`) dùng `try-catch` + `handleErrorApi({ error, setError })`.
- Mutation non-form (revoke device, export, send SMS, refresh) dùng `onError: handleErrorApi({ error })`.
- Hooks không tự `toast.error` — delegate cho component/handleErrorApi.

✅ **Pass — Auth & Security**
- Route mới khai báo trong `router/index.tsx`: `/reactivate` (public, AuthLayout — đúng vì BE không yêu cầu token), `/2fa/cross-device-confirm` (dưới `ProtectedRoute` — auth-gated, mọi role — khớp BE `[Authorize]`).
- `X-Device-Id` lưu localStorage là device id (KHÔNG phải token) → không vi phạm rule token-cookie-only.
- Merge dialog cảnh báo tombstone không hoàn tác; secondary chọn từ combobox (loại trừ primary) thay vì gõ UUID.

✅ **Pass — Code quality / UI**
- UI primitive đều từ `@/components/ui` (Button/Input/Dialog/Select/Textarea/Checkbox/Badge/AlertDialog) — không custom lại.
- Không `console.log`; không hardcode URL (qua `ENDPOINTS`).
- GDPR export đọc `res.data.data` (axios không unwrap) → Blob → download — khớp BE thực tế.
- Component PascalCase, hook `use*`, service `*.service.ts`, schema `*.schema.ts` — đúng convention.

🟡 **Warning — TwoFactorSetup.tsx:~70 (countdown effect)**
- `useEffect([crossData, crossRemaining])` tạo lại `setInterval` mỗi giây (vì `crossRemaining` đổi mỗi tick). Hoạt động đúng nhưng hơi kém tối ưu.
- Gợi ý (không bắt buộc): dùng functional update + dependency `[crossData]`, hoặc `setInterval` với clear khi reach 0. Không block ship.

🟡 **Warning — useExportMyData.ts:~30**
- Nếu `res.data.data` undefined (case bất thường), không tải file nhưng component vẫn toast "Đã tải". Edge hiếm (BE 200 luôn có data). Có thể return/throw khi thiếu data để toast chính xác hơn. Không block ship.

### RỦI RO & LƯU Ý
- 🔶 **Working tree chứa thay đổi KHÔNG thuộc GH-88** — phải loại khi ship:
  - `src/shared/utils/endpoints.ts` đã `M` từ đầu session (trước GH-88) — diff `dev` hiển thị việc **xóa `NOTIFICATIONS.MARK_READ` + `MARK_ALL_READ`** → đây là thay đổi của task notification khác, KHÔNG được bundle vào PR GH-88.
  - `src/features/staff/enums/notification.enum.ts` (M), `src/features/staff/types/notification.enums.ts` (D), `docs/api-auth.md`, `docs/api-notification.md` — đều pre-existing, ngoài scope.
  - ⚠️ Khi `/kltn-ship`: chỉ stage 20 file mới + các file GH-88 đã sửa; **không** `git add -A`. Cân nhắc tách/khôi phục phần NOTIFICATIONS trong `endpoints.ts` nếu vô tình lẫn vào.
- Cross-device Device A dùng **refresh tay** (đã chốt) — BE có comment gợi ý poll/SignalR; chấp nhận trong scope.
- Chưa chạy thử runtime với BE thật (không trong scope review tĩnh) — `/kltn-test` sẽ chạy lại tsc/eslint/build.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
Không có Critical. 2 Warning đều minor, không block. Lưu ý bắt buộc: cô lập file ngoài scope khi ship (đặc biệt `endpoints.ts` NOTIFICATIONS).
