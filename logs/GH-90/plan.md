# Plan — GH-90: [FE] Tích hợp SMS Gateway — Admin management

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-06-20
- **Issue:** #90 — https://github.com/GSU26SE55/frontend/issues/90
- **Sprint:** Sprint 1 (deadline 2026-05-30)
- **Dev:** Trần Minh Trí (SE183109)

## Mục tiêu
Xây màn hình **quản lý thiết bị SMS Gateway** trong admin portal (web): admin đăng ký 1 điện thoại Android (chạy app Flutter `sms_fowarder`) làm "máy gửi SMS", nhận `apiKey` (hiện 1 lần) để cấu hình vào điện thoại, xem trạng thái các thiết bị, và thu hồi thiết bị khi mất/lộ key. FE chỉ consume nhóm endpoint **Admin** của SmsService.

## Scope
**Trong scope (3 endpoint Admin — quản lý thiết bị):**
- Tạo gateway device + modal khoe `apiKey` 1 lần (copy có fallback + cảnh báo)
- Bảng danh sách device + trạng thái (online ≤10', sentToday, active/revoked) + toggle `includeRevoked`
- Thu hồi (revoke) device — confirm dialog
- Wire route `/admin/sms-gateway` + mục sidebar (section "Hệ thống")

**Ngoài scope (đã loại bỏ):**
- Endpoint của app Flutter trên điện thoại: `GET /messages/pending`, `POST /messages/report`, `POST /heartbeat` — không phải web
- SignalR Hub `/hubs/sms-gateway` — realtime channel cho Flutter
- **Cancel SMS** (`POST /messages/{id}/cancel`) — endpoint CÓ tồn tại trong controller (trả HTTP 409 nếu terminal), nhưng BE chưa có endpoint **list SMS** nên admin không lấy được `smsId` trên web → tách sang issue sau khi BE có màn hình list SMS đang chờ

## Endpoints (đã verify source BE — `AdminGatewayDevicesController.cs`)
| Method | Path | Request | Response | HTTP status |
|--------|------|---------|----------|-------------|
| GET | `/api/admin/sms-gateway/devices` | query `includeRevoked?: bool` (BE default `true`; FE gửi `false`) | `CommonResponse<GatewayDeviceDto[]>` (không paginate, order CreatedAt DESC) | 200 |
| POST | `/api/admin/sms-gateway/devices` | `{ deviceName, deviceCode, dailyLimit }` | `CommonResponse<CreateGatewayDeviceResponseDto>` (`apiKey` plaintext 1 lần) | **201** ok · **400** validation (listErrors) · **409** DeviceCode trùng |
| DELETE | `/api/admin/sms-gateway/devices/{id}` | — | `CommonResponse<string>` (`data` = deviceCode đã revoke) | 200 idempotent · **404** không tồn tại |

> **Quan trọng (verify):** Controller map status thật: `return StatusCode(resp.StatusCode == 0 ? 200 : resp.StatusCode, resp);` → 409/404 là **HTTP status thật**, KHÔNG phải 200+isSuccess:false. Vì vậy FE axios interceptor reject đúng → `errors.ts` phân loại được (xem Edge Cases).

**Auth:** JWT Bearer + role `Admin` (`[Authorize(Roles="Admin")]`) — đã được bảo vệ thêm bởi `RoleRoute(['ADMIN'])` ở FE.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/admin/types/sms-gateway.types.ts` | create | DTOs + payloads + params |
| `src/features/admin/schemas/sms-gateway.schema.ts` | create | Zod `createGatewayDeviceSchema` |
| `src/features/admin/services/admin-sms-gateway.service.ts` | create | getDevices / createDevice / revokeDevice |
| `src/features/admin/hooks/useAdminSmsGateway.ts` | create | 1 query + 2 mutation hook |
| `src/features/admin/pages/SmsGatewayPage.tsx` | create | Page: table + toolbar (toggle revoked, refresh, nút Thêm) |
| `src/features/admin/components/sms-gateway/CreateSmsDeviceDialog.tsx` | create | Form tạo device (RHF + Zod) |
| `src/features/admin/components/sms-gateway/ApiKeyRevealDialog.tsx` | create | Modal khoe apiKey 1 lần + copy (có fallback) + cảnh báo |
| `src/features/admin/components/sms-gateway/SmsDeviceTable.tsx` | create | Bảng device + badge trạng thái (online/active/revoked) + nút Thu hồi |
| `src/shared/utils/endpoints.ts` | modify | Thêm `ADMIN.SMS_GATEWAY` (đã verify không trùng key trong block ADMIN) |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `KEY.admin.smsGateway` + `QUERY_KEY.admin.smsGateway` |
| `src/router/index.tsx` | modify | Import + route `sms-gateway` trong nhánh `/admin` |
| `src/shared/components/layout/AppLayout.tsx` | modify | Thêm nav item "SMS Gateway" vào section "Hệ thống" (ADMIN_NAV) |

## Enums
Không tạo enum mới — `GatewayDeviceDto` chỉ dùng `isActive: boolean`, không có status enum. (SmsStatus/SmsAuditEvent chỉ cần khi làm Cancel SMS — đã ngoài scope.)

## Types
```ts
// sms-gateway.types.ts — field names verify từ GatewayDeviceDto record (BE)
export interface GatewayDeviceDto {
  id: string;
  deviceName: string;
  deviceCode: string;
  isActive: boolean;
  revokedAt: string | null;
  dailyLimit: number;
  sentToday: number;
  sentTodayDate: string | null;   // DateOnly → "yyyy-MM-dd"
  lastSeenAt: string | null;      // dùng tính badge online (<10')
  lastSeenIp: string | null;
  createdAt: string;
}
export interface CreateGatewayDeviceResponseDto {
  id: string;
  deviceCode: string;
  apiKey: string;                 // plaintext — chỉ trả 1 lần
}
export interface CreateGatewayDevicePayload {
  deviceName: string;
  deviceCode: string;
  dailyLimit: number;             // FE LUÔN gửi (default 100) — không để optional/null
}
export interface GetDevicesParams { includeRevoked?: boolean }
```

## Schema (Zod)
```ts
// sms-gateway.schema.ts
deviceName: z.string().trim().min(1, "Bắt buộc").max(64, "Tối đa 64 ký tự")
deviceCode: z.string().trim().min(1, "Bắt buộc").max(64, "Tối đa 64 ký tự")
dailyLimit: z.coerce.number().int().min(1, "Tối thiểu 1").max(10000, "Tối đa 10000")
// form defaultValues.dailyLimit = 100 → luôn gửi số hợp lệ (tránh BE 400 do null→int)
```

## Approach
- **Service** import `axiosInstance` + `ENDPOINTS` (không hardcode URL); `getDevices(params)`, `createDevice(payload)`, `revokeDevice(id)`.
- **Hooks** (tên export chốt cứng, theo pattern hành động như `useAdminCreateAccount`):
  - `useAdminSmsDevices(params)` — query, `staleTime: 30s`, refresh tay (không auto-poll)
  - `useAdminCreateSmsDevice()` — mutation, `onSuccess` invalidate `KEY.admin.smsGateway`
  - `useAdminRevokeSmsDevice()` — mutation, `onSuccess` invalidate `KEY.admin.smsGateway` + toast `"Đã thu hồi {deviceCode}"`
- **Create flow**: submit form trong `try-catch` + `handleErrorApi({ error, setError })`; `onSuccess` → lưu `CreateGatewayDeviceResponseDto` vào state của page → mở `ApiKeyRevealDialog` → invalidate list.
- **Copy apiKey (có guard)**: thử `navigator.clipboard.writeText` trong `try-catch` (chỉ chạy ở secure context HTTPS/localhost); nếu reject/undefined → fallback select text trong `<input readonly>` + `document.execCommand("copy")`; **luôn** render apiKey trong ô monospace selectable để admin copy tay nếu cả 2 fail. Toast báo "Đã copy" / "Copy thủ công nếu cần".
- **Online badge**: device "online" nếu `lastSeenAt != null` và `now - lastSeenAt < 10 phút` (ngưỡng theo controller remark); ngược lại "offline". Khi `isActive=false` → badge "Đã thu hồi" + dòng muted hiển thị `revokedAt` ("Thu hồi lúc {date}") — tận dụng field `revokedAt` thay vì để khai báo thừa.
- **Revoke flow**: confirm dialog → `mutate(id)`; `onSuccess` → invalidate list + toast `"Đã thu hồi {deviceCode}"`; `onError: handleErrorApi({ error })` (toast). **UX (chốt):** vì FE default `includeRevoked=false`, sau revoke device **biến mất khỏi bảng** (đúng filter active-only) — KHÔNG "đổi badge tại chỗ". Muốn xem device đã thu hồi (cùng badge + `revokedAt`) → admin bật toggle "Hiện đã thu hồi".
- **Toolbar**: toggle `includeRevoked` (FE **default false** = chỉ hiện active; bật để xem cả revoked), nút Refresh (`refetch`), nút "Thêm thiết bị".

## Edge Cases (verify từ handler BE)
- **Validation 400** (deviceName/deviceCode rỗng/>64, dailyLimit ∉ [1..10000]) → body có `listErrors` → axios interceptor tạo `EntityError` → lỗi dưới từng field. Zod chặn client trước; BE là lớp 2.
- **409 DeviceCode đã tồn tại** (`message:"DeviceCode đã tồn tại."`, `listErrors:null`, HTTP 409 thật) → `HttpError` → toast lỗi (không map field, không crash form).
  - **Verify `axios.ts`:** `EntityError` CHỈ được tạo khi `status === 400 || status === 422` **và** có `listErrors` (dòng 179–181); mọi status khác (gồm 409) rơi vào nhánh `status !== undefined` (dòng 188) → **luôn `HttpError`**. Phân loại theo HTTP status, KHÔNG phải "mọi 4xx có body" → 409 không thể rơi nhầm `EntityError`. ✅
- **dailyLimit**: FE luôn gửi số (default 100) — KHÔNG gửi `null`/omit để tránh BE 400 (DailyLimit là non-nullable int, validation chặn <1).
- **apiKey hiển thị 1 lần**: đóng `ApiKeyRevealDialog` là mất vĩnh viễn — modal phải cảnh báo rõ + nút copy có fallback + ô text selectable; mất key → phải revoke + tạo mới.
- **404 khi revoke** (device đã soft-delete) → `HttpError` → toast "Device không tồn tại."
- **Idempotent revoke**: gọi revoke 2 lần vẫn 200 — không xử lý đặc biệt.
- **List rỗng** → EmptyState "Chưa có thiết bị nào".
- **List không paginate**: render thẳng mảng (BE order CreatedAt DESC) — chấp nhận vì quy mô < 100 device.
- `sentTodayDate`/`lastSeenAt`/`lastSeenIp`/`revokedAt` có thể `null` → hiển thị "—"; format `date-fns` khi có giá trị.

## Manual QA (luồng KHÔNG khôi phục — FE không có test suite tự động)
> Theo `workflow.md`: FE quality gate = `tsc` + `eslint` + `build` (không có unit test). Luồng "apiKey 1 lần" là rủi ro nghiêm trọng nhất → bắt buộc QA tay ở `/kltn-test`:
- [ ] Tạo device → modal hiện apiKey; bấm Copy → clipboard có đúng key (test cả HTTPS/localhost)
- [ ] Tắt secure context (mở qua IP HTTP) → Copy fallback hoạt động / vẫn select-copy tay được
- [ ] Đóng modal → mở lại GET /devices → KHÔNG còn thấy apiKey (chỉ thấy device trong list)
- [ ] Tạo trùng DeviceCode → toast "DeviceCode đã tồn tại.", form không vỡ
- [ ] Revoke device (toggle đang chỉ active) → toast "Đã thu hồi {deviceCode}" + device biến mất khỏi bảng; bật toggle "Hiện đã thu hồi" → device xuất hiện lại với badge "Đã thu hồi" + "Thu hồi lúc {revokedAt}"

## Acceptance Criteria
- [ ] `/admin/sms-gateway` hiển thị bảng device từ `GET /devices` (deviceName, deviceCode, online/offline, sentToday/dailyLimit, lastSeenAt)
- [ ] Badge "online" khi `lastSeenAt < 10 phút`, "offline" ngược lại, "Đã thu hồi" + "Thu hồi lúc {revokedAt}" khi `isActive=false`
- [ ] Tạo device qua form → BE trả `apiKey` → modal hiện apiKey 1 lần + nút copy (có fallback) + cảnh báo
- [ ] Validation form (required, max 64, dailyLimit 1..10000) hiện lỗi dưới field; FE luôn gửi dailyLimit hợp lệ
- [ ] 409 DeviceCode trùng → toast lỗi (không crash form)
- [ ] Thu hồi device qua confirm → toast "Đã thu hồi {deviceCode}" → device biến mất khỏi bảng (default chỉ active); bật toggle "Hiện đã thu hồi" thấy lại device với badge "Đã thu hồi" + revokedAt
- [ ] Toggle `includeRevoked` (default chỉ active) ẩn/hiện device đã thu hồi
- [ ] Sidebar (ADMIN_NAV) có mục "SMS Gateway", điều hướng đúng `/admin/sms-gateway`
- [ ] Manual QA checklist (luồng apiKey 1 lần) PASS
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS

## Steps
- [x] Bước 1: Types (`sms-gateway.types.ts`) + Schema (`sms-gateway.schema.ts`) — 2026-06-20
- [x] Bước 2: Endpoints (`ADMIN.SMS_GATEWAY`) + queryKeys (`admin.smsGateway`) — 2026-06-20
- [x] Bước 3: Service (`admin-sms-gateway.service.ts`) — 2026-06-20
- [x] Bước 4: Hooks (`useAdminSmsGateway.ts` — `useAdminSmsDevices` + `useAdminCreateSmsDevice` + `useAdminRevokeSmsDevice`) — 2026-06-20
- [x] Bước 5: Components + Page (`SmsGatewayPage`, `CreateSmsDeviceDialog`, `ApiKeyRevealDialog` clipboard fallback, `SmsDeviceTable` online badge) — 2026-06-20
- [x] Bước 6: Wire router (`/admin/sms-gateway`) + sidebar nav (section "Hệ thống") — 2026-06-20
- [x] Bước 7: `tsc --noEmit` ✅ + `eslint --max-warnings=0` ✅ + `npm run build` ✅ — 2026-06-20 (Manual QA chạy ở `/kltn-test`)

> **Lưu ý implement (lệch nhỏ so với plan):** schema `dailyLimit` dùng `z.number()` + `register(..., { valueAsNumber: true })` thay vì `z.coerce.number()` — vì `z.coerce` gây lệch input(`unknown`)/output(`number`) với RHF resolver (build TS2322). Theo đúng pattern `BatteryTypeFormDialog`. Hành vi không đổi: FE vẫn luôn gửi `dailyLimit` là số (default 100).
> Clipboard fallback dùng `<textarea>` tạm + `execCommand` (không ref vào shadcn `Input` vì base-ui không forward ref kiểu cũ).

## Câu hỏi đã giải đáp
- **Cancel SMS có làm không?** → **KHÔNG** trong issue này. Endpoint tồn tại nhưng BE không có list SMS → admin không lấy được `smsId` trên web. Tách sang issue sau.
- **Phần Flutter (pending/report/heartbeat + SignalR)?** → **KHÔNG**, dành cho app Flutter trên điện thoại.
- **Refresh danh sách device?** → Refresh tay + `staleTime 30s` (không auto-poll).
- **Chiều của apiKey?** → BE tự sinh apiKey khi tạo device → trả lên web hiện 1 lần → admin copy mang sang dán vào app Flutter (không nhập apiKey vào form web).

## Rủi ro thiết kế đã xử lý (review GH-90)
1. **includeRevoked default** → FE đổi sang **false** (hiện active trước), khác BE default true. ✅
2. **Shape lỗi 409** → verify source: SmsService **trả HTTP 409 thật** (controller `StatusCode(...)`), không phải 200+isSuccess:false như be.md §9. Nhánh `HttpError`→toast trigger đúng. ✅
3. **navigator.clipboard guard** → thêm fallback `execCommand` + ô text selectable; không phụ thuộc secure context. ✅
4. **Test luồng không khôi phục** → thêm **Manual QA checklist** (FE không có test tự động theo workflow.md). ✅
5. **Online threshold** → định nghĩa `lastSeenAt < 10 phút` (theo controller remark). ✅
6. **dailyLimit default** → verify: BE chặn `<1`, non-nullable int → FE **luôn gửi** (default 100), không optional/null. ✅
