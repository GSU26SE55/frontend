## BÁO CÁO CODE REVIEW — feat/GH-113-iot-device-management — 2026-06-28
### Scope: FE (Web)
### Effort: Deep (PR nhiều file, cross-feature — admin/staff/manager)

### TÓM TẮT
Module IoT Device Management (~30 files mới, 4 file sửa) — devices CRUD + key + command, calibration, firmware OTA, 3 portal. Review phát hiện **1 Critical (cross-feature import)** đã được fix ngay trong review. Sau fix: `tsc`, `eslint --max-warnings=0`, `npm run build` đều PASS. Kết luận PASS.

### PHÂN TÍCH

🔴 Critical (ĐÃ FIX trong review):
- `src/features/staff/pages/IoTCalibrationsPage.tsx:7` — Staff page import `IoTDeviceStatusBadge` từ `@/features/admin/components/` → vi phạm feature isolation (staff → admin). **Ẩn vì `eslint.config.js` thực tế KHÔNG cấu hình `no-restricted-imports`** (dù docs nói có) nên lint không bắt được.
  - **Fix đã áp dụng:** chuyển `IoTDeviceStatusBadge` → `src/shared/components/iot/IoTDeviceStatusBadge.tsx` (dùng bởi admin + staff = cross-feature → shared); cập nhật 3 importer (IoTDeviceTable, IoTDeviceDetailPage, IoTCalibrationsPage). Re-verify: tsc + eslint + build PASS, scan lại cross-feature → NONE.

🟡 Warning:
- `src/features/admin/components/IoTDeviceForm.tsx` — dropdown "Target firmware OTA" dùng `useIotFirmware({ publishedOnly: true })` với pageSize mặc định 20 → nếu >20 release đã publish, dropdown truncate. Gợi ý: tăng pageSize khi dùng cho selector (chấp nhận được ở scope hiện tại, ít release).
- `IotApiKeyScopeEnum` re-export ở `iot.types.ts` nhưng `apiKeyScopes` đã đổi sang `number` (bitmask) — enum vẫn cần cho ApiKeyScopesField nên giữ lại là đúng, không phải dead code.

✅ Pass:
- **Architecture:** không có business logic trong component; mọi API call qua `services/` → hook TanStack Query; file đặt đúng chỗ (cross-feature calibration + badge ở `shared/`, admin-only ở `features/admin/`).
- **Feature isolation:** sau fix, không còn admin↔staff↔manager import; shared/ không import từ features/.
- **Axios:** mọi service dùng `shared/lib/axios` + `ENDPOINTS` — không hardcode URL, không tạo instance mới.
- **Query:** queryKey dùng `QUERY_KEY` factory; invalidate dùng `KEY` root (broad) — đúng convention (giống `useCreateBatteryAsset`).
- **Error handling:** form (device/firmware/calibration/command) dùng `try-catch mutateAsync` + `handleErrorApi({ error, setError })`; non-form (delete/rotate/revoke/publish/archive) dùng `onError → handleErrorApi({ error })`. Không tự toast trong hook.
- **UI:** chỉ dùng shadcn primitives từ `@/components/ui` — không custom Button/Input/Dialog/Table/Badge/Skeleton.
- **Auth:** routes mới nằm trong `RoleRoute` đúng role (admin trong ADMIN block, staff/manager tương ứng); secrets reveal cảnh báo 1 lần, không cache.
- **Loading/error state:** pages có Skeleton loading; Staff lookup có isError → "không tìm thấy".
- **Naming:** component PascalCase, hook `use*`, service `*.service.ts`, schema `*.schema.ts`.
- **No console.log / debugger.**
- **Bitmask type:** `apiKeyScopes: number` (combo không phải member enum) — đúng, build `tsc -b` đã xác nhận.

### RỦI RO & LƯU Ý
- **Cross-feature isolation không có lưới an toàn lint** — `eslint.config.js` thiếu `no-restricted-imports`. Reviewer/dev phải tự kiểm bằng mắt. (Ngoài scope GH-113 — nên có issue riêng để thêm rule.)
- **Staff dùng `by-code` lookup** (BE mới thêm) thay vì browse list — đúng nghiệp vụ, không cần device list cho Staff.
- **Working tree có file untracked KHÔNG thuộc GH-113** (cascade-risk, battery-audit, topology…) + `docs/api-battery.md` modified. `/kltn-ship` phải chỉ add file IoT/Calibration của GH-113.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**.
(Critical phát hiện đã fix + re-verify build/lint/tsc PASS. Không còn blocker.)
