# Plan — GH-97: Wire Notification Settings page to preference API (GET + PUT)

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-06-22
- **Issue:** #97 — https://github.com/GSU26SE55/frontend/issues/97
- **Sprint:** Sprint 3 (due 2026-06-27)
- **Dev:** Trần Minh Trí (SE183109)

## Mục tiêu
Wire UI web vào 2 endpoint `GET`/`PUT /api/notification-preferences` để user tự xem và cập nhật cài đặt thông báo: bật/tắt 4 channel (Push/Email/SMS/InApp), quiet hours (`HH:mm`, hỗ trợ qua đêm), và timezone IANA. BE đã sẵn sàng — chỉ thiếu phần web wiring.

## BE Contract (đã verify từ source — không phải giả định)
Đọc trực tiếp `backend/services/NotificationService/src/`:
- **DTO** (`DTOs/Response/Preference/NotificationPreferenceDto.cs`) — JSON camelCase: `pushEnabled` `bool`, `emailEnabled` `bool`, `smsEnabled` `bool`, `inAppEnabled` `bool`, `quietHoursStart` `string?`, `quietHoursEnd` `string?`, `timeZone` `string`.
- **Format quiet hours = `"HH:mm"`** (24h, 5 ký tự) — BE validate `TimeOnly.TryParseExact(x, "HH:mm")` + GET serialize `pref.QuietHoursStart?.ToString("HH:mm")`. **KHÔNG có giây** (`HH:mm:ss`).
- **`UpdateNotificationPreferenceCommand.UserId` có `[JsonIgnore]`** → FE tuyệt đối **không** gửi `userId` trong body.
- **Default (chưa cấu hình)** từ GET handler: `pushEnabled=true, emailEnabled=true, smsEnabled=false, inAppEnabled=true, quietHoursStart=null, quietHoursEnd=null, timeZone="Asia/Ho_Chi_Minh"`.
- ⚠️ **BE validate `QuietHoursStart`/`End` ĐỘC LẬP** — chỉ check format từng field, **không có cross-field**. Gửi 1 null + 1 có giá trị → BE chấp nhận và lưu lệch. → FE **bắt buộc** enforce cặp ở schema-level (`.refine()`), không chỉ dựa UI switch.

## Scope
**Trong scope:**
- Thêm tab mới **"Tùy chọn thông báo"** vào `AccountSettingsPage` (cạnh tab "Thiết bị thông báo").
- `NotificationPreferencesSection` — form load (GET) + save (PUT), theo đúng pattern `DeviceTokensSection` (shared service/hook/types/schema + section mount vào AccountSettingsPage).
- Timezone: `Select` với danh sách IANA curated (default `Asia/Ho_Chi_Minh`).
- Quiet hours: switch "Bật khung giờ yên tĩnh" → khi bật hiện 2 input `time`; khi tắt gửi `null/null`.

**Ngoài scope:**
- `NotificationFrequencyEnum` (Immediate/Daily) — BE chưa expose qua endpoint này, **không** đụng tới.
- Device tokens (đã có sẵn `DeviceTokensSection`).
- Logic Dispatcher / quiet-hours enforcement phía BE (Sprint 6+).
- Không tạo route/page độc lập — chỉ thêm tab vào trang Settings hiện có.

## Pre-work fix — Field-casing (BE↔FE) ✅ ĐÃ LÀM
**Vấn đề (toàn cục, không riêng GH-97):** BE gán `Errors.Field` PascalCase ở **225 chỗ / 4 service** (vd `QuietHoursStart`, `Email`, `CurrentPassword`). FE `errors.ts` gọi thẳng `setError(err.field)`, mọi form RHF register **camelCase** → `setError("QuietHoursStart")` không khớp `register("quietHoursStart")` → RHF no-op → **lỗi validation BE không hiện dưới input ở MỌI form** (login/register/change-password/… đều bị từ trước).

**Fix:** normalize 1 điểm tại `axios.ts` (nhánh 400/422) — hạ chữ cái đầu `field` trước khi tạo `EntityError`. Sửa luôn cho toàn app, **không đụng BE** (BE PascalCase nhất quán = convention, không sai).
```ts
const normalized = data.listErrors.map((e) => ({
  ...e, field: e.field.charAt(0).toLowerCase() + e.field.slice(1),
}));
return Promise.reject(new EntityError(normalized, status));
```
> ✅ `tsc --noEmit` PASS. ⚠️ **Chưa verify runtime:** *key* JSON là `field` (camel) hay `Field` — validation pipeline đi qua MVC formatter (`AddControllers()` không set naming policy), khác đường `CommonResponseWriter` (đã camelCase). Cần test 1 request 400 thật để chắc `e.field` không undefined trước khi đóng ticket.

## Endpoints
| Method | Path | Mục đích / Request / Response |
|--------|------|-------------------------------|
| GET | `/api/notification-preferences` | Load preference user hiện tại. Chưa cấu hình → BE trả default (không ghi DB). Response: `CommonResponse<NotificationPreferenceDto>` |
| PUT | `/api/notification-preferences` | Upsert preference. Body = `NotificationPreferenceDto` (không gửi `userId`). Response: `CommonResponse<NotificationPreferenceDto>` (shape giống GET) |

> Cả 2 đều `[Authorize]` — `UserId` lấy từ JWT claim, không nhận từ body. Mỗi user 1 record (1-1 Account).

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/lib/axios.ts` | ✅ modified | **(Đã làm)** Normalize `listErrors[].field` PascalCase → camelCase trước khi tạo `EntityError`. Xem §Pre-work fix. |
| `src/shared/utils/endpoints.ts` | modify | Thêm block `NOTIFICATION_PREFERENCES: { GET, UPDATE }` |
| `src/shared/utils/queryKeys.ts` | modify | Root **string đơn** `notificationPreferences: "notificationPreferences"` trong `KEY` (khớp pattern `deviceTokens: "deviceTokens"`, KHÔNG lồng mảng như admin/manager) + factory `QUERY_KEY.notificationPreferences.me: () => [KEY.notificationPreferences, "me"] as const` (khớp `profile.me` / `deviceTokens.list`) |
| `src/shared/types/notification-preference.types.ts` | create | `NotificationPreferenceDto`, `UpdateNotificationPreferencePayload` |
| `src/shared/schemas/notification-preference.schema.ts` | create | Zod schema (HH:mm regex, timezone) |
| `src/shared/services/notification-preference.service.ts` | create | `get()`, `update()` |
| `src/shared/hooks/useNotificationPreferences.ts` | create | `useNotificationPreferences()` (query), `useUpdateNotificationPreferences()` (mutation) |
| `src/components/ui/switch.tsx` | create (shadcn) | `npx shadcn add switch` (base-nova, base-ui) — không package mới |
| `src/shared/components/notification-preferences/NotificationPreferencesSection.tsx` | create | Form UI (Switch channels + Switch quiet-hours toggle + Select timezone + time inputs) |
| `src/features/auth/pages/AccountSettingsPage.tsx` | modify | (a) import 1 icon `Bell` từ `lucide-react`; (b) thêm object `{ key: "notifications", label: "Tùy chọn thông báo", icon: Bell, desc: ... }` vào mảng `MENU as const` (dòng ~32-72) — `MenuKey` tự suy ra từ `(typeof MENU)[number]["key"]`, không sửa type thủ công; (c) thêm nhánh `{active === "notifications" && <NotificationPreferencesSection />}` |

## Enums
Không cần enum mới. Channel là 4 boolean (`pushEnabled`/`emailEnabled`/`smsEnabled`/`inAppEnabled`), không dùng `NotificationChannelEnum`. Không đụng `NotificationFrequencyEnum`.

## Types
```ts
// notification-preference.types.ts
export interface NotificationPreferenceDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart?: string | null; // "HH:mm" | null = không quiet hours
  quietHoursEnd?: string | null;
  timeZone: string;                // IANA, vd "Asia/Ho_Chi_Minh"
}
export type UpdateNotificationPreferencePayload = NotificationPreferenceDto;
```

## Schema (Zod)
```ts
// notification-preference.schema.ts — HH:mm 24h
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
pushEnabled:     z.boolean()
emailEnabled:    z.boolean()
smsEnabled:      z.boolean()
inAppEnabled:    z.boolean()
quietHoursStart: z.string().regex(HHMM, "Định dạng phải là HH:mm").nullable()
quietHoursEnd:   z.string().regex(HHMM, "Định dạng phải là HH:mm").nullable()
timeZone:        z.string().min(1, "TimeZone không được trống").max(100, "TimeZone tối đa 100 ký tự")

// ⚠️ Cross-field invariant — BE KHÔNG check cặp, nên enforce ở FE schema-level:
.refine(
  (v) => (v.quietHoursStart == null) === (v.quietHoursEnd == null),
  { message: "Phải nhập cả giờ bắt đầu và kết thúc, hoặc bỏ trống cả hai", path: ["quietHoursEnd"] },
)
```
> `.refine()` ở schema chặn state lệch (1 null 1 có) **trước khi** gửi BE — không chỉ dựa UI switch. UI switch là lớp UX, `.refine()` là lớp đảm bảo invariant.

## Workflow

**Load preferences flow:**
```
AccountSettings → tab "Tùy chọn thông báo" → NotificationPreferencesSection → useNotificationPreferences() (GET)
  → isLoading: render spinner/skeleton
  → data về: reset(toFormValues(data)) fill form (quiet hours null → switch off)
  → GET lỗi (400 thiếu claim / network): trạng thái lỗi + nút thử lại (không crash tab)
```

**Save preferences flow:**
```
Toggle 4 channel + quiet hours (switch + 2 input time) + Select timezone → form dirty → "Lưu" → useUpdateNotificationPreferences.mutateAsync(values)
  (tắt quiet hours → gửi quietHoursStart/End = null; không gửi userId)
  → OK:   invalidate QUERY_KEY.notificationPreferences.me() → toast "Đã lưu cài đặt thông báo"
  → FAIL: handleErrorApi({ error, setError }) (EntityError sai HH:mm/timezone → dưới field camelCase; HttpError → toast)
Bật quiet hours nhưng chỉ điền 1/2 ô → .refine() chặn submit client-side → lỗi dưới field (không gửi BE state lệch)
```

## Approach
- **Data flow load (pattern MỚI vs DeviceTokensSection):** `DeviceTokensSection` là form đăng-ký nên dùng `defaultValues` tĩnh. GH-97 là **load+edit** nên cần load-then-reset: `useNotificationPreferences()` (`useQuery`, staleTime 5 phút) → khi `data` về thì fill form bằng:
  ```ts
  const { reset } = useForm({ resolver: zodResolver(schema), defaultValues: DEFAULT_PREF });
  useEffect(() => { if (data) reset(toFormValues(data)); }, [data, reset]);
  ```
  `isLoading` → render spinner/skeleton (không render form rỗng). `toFormValues` chỉ map DTO → form shape (giữ nguyên field, quiet hours null → switch off).
- **Data flow save:** submit → `try { await mutateAsync(values) } catch { handleErrorApi({ error, setError }) }` (form pattern theo `fe.md`). `EntityError` (vd sai HH:mm, timezone rỗng) → map xuống field; `HttpError` → toast.
- **Quiet hours toggle:** state UI `quietHoursEnabled` (derive từ `quietHoursStart != null`). Tắt → submit gửi `quietHoursStart: null, quietHoursEnd: null`. Bật → gửi 2 input time.
- **onSuccess:** `invalidateQueries(QUERY_KEY.notificationPreferences.me())` + `toast.success("Đã lưu cài đặt thông báo")`.
- **Timezone Select:** danh sách curated (`Asia/Ho_Chi_Minh` default + vài IANA APAC/UTC phổ biến).

## Edge Cases
- **User chưa cấu hình:** GET trả default (`smsEnabled=false`, quiet hours `null`) — form hiển thị default, không lỗi. Lưu ý `smsEnabled=false` là giá trị thật, không phải thiếu.
- **Quiet hours một phía null:** ràng buộc cặp ở **2 lớp** — UI switch (UX) + `.refine()` schema (đảm bảo, vì BE không cross-check).
- **Validation (HH:mm format / timezone rỗng / >100 ký tự / cặp lệch):** **bắt client-side bằng Zod trước submit** → lỗi hiện đúng field (camelCase). Đây là đường chính. Xem §Rủi ro field-casing.
- **GET lỗi (400 thiếu claim / network):** hiện trạng thái lỗi + nút thử lại, không crash tab.
- **`smsEnabled` (số 0/false):** không treat false như "thiếu" — luôn render theo giá trị BE trả.

## Rủi ro field-casing (bug hệ thống có sẵn — ✅ ĐÃ FIX ở §Pre-work fix)
- **Gốc rễ:** BE trả `listErrors[].field` **PascalCase** (`QuietHoursStart`, `Email`, `CurrentPassword`…) — verify toàn bộ 4 service, **225 chỗ** gán `Field = "Pascal..."`. RHF register **camelCase** (`quietHoursStart`). `handleErrorApi` (`errors.ts:34`) gọi thẳng `setError(err.field)` → no-op im lặng → lỗi không hiện dưới field. **Mọi form toàn app đều bị**, không riêng GH-97.
- **Status = `400`:** interceptor (`axios.ts`) map `status === 400 || 422` + có `listErrors` → `EntityError`. Lỗi validation đi nhánh `EntityError`, không toast. (Plan ghi "BE 400" đúng — Controller `BadRequest(result)`.)
- **✅ Đã fix (interceptor, 1 điểm):** normalize `field` PascalCase → camelCase trong `axios.ts` trước khi tạo `EntityError` (chi tiết §Pre-work fix). Fix cho **toàn app**, không đụng BE. `tsc --noEmit` PASS.
- **Phòng tuyến 2 (vẫn giữ):** FE Zod schema mirror đầy đủ rule BE (HHMM regex + timezone min1/max100 + `.refine()` cặp) ⇒ phần lớn lỗi bắt client-side trước khi gọi BE. Interceptor fix lo nốt các lỗi chỉ BE biết.
- **⚠️ Còn cần verify runtime:** *key* JSON là `field` (camel) hay `Field` — xem cảnh báo §Pre-work fix. Test 1 request 400 thật trước khi đóng ticket.

## Acceptance Criteria
- [ ] Mở tab "Tùy chọn thông báo" trong Settings → form load đúng preference hiện tại (hoặc default nếu chưa cấu hình).
- [ ] Toggle 4 channel + đặt quiet hours + chọn timezone → Lưu → PUT thành công, toast success, form giữ giá trị mới.
- [ ] Tắt switch quiet hours → Lưu → gửi `quietHoursStart/End = null`.
- [ ] Bật quiet hours nhưng chỉ điền 1 trong 2 ô → `.refine()` chặn submit client-side, lỗi hiện dưới field (không gửi BE state lệch).
- [ ] Sai HH:mm / timezone rỗng / >100 ký tự → Zod chặn client-side, lỗi hiện đúng field (camelCase) — không phụ thuộc BE field-mapping (xem §Rủi ro field-casing).
- [ ] Không gửi `userId` trong body PUT.
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS.

## Steps
- [x] Bước 0 — **(Pre-work, đã làm)** Fix field-casing tại `axios.ts` (normalize PascalCase→camelCase) — §Pre-work fix. `tsc` PASS.
- [x] Bước 1 — Types: `notification-preference.types.ts` (`NotificationPreferenceDto`, `UpdateNotificationPreferencePayload`) — 2026-06-22
- [x] Bước 2 — Schema: `notification-preference.schema.ts` (4 boolean + HHMM regex + timezone + `.refine()` cặp quiet hours) — 2026-06-22
- [x] Bước 3 — Endpoints (`NOTIFICATION_PREFERENCES`) + queryKeys (`KEY.notificationPreferences` + `QUERY_KEY.notificationPreferences.me()`) — 2026-06-22
- [x] Bước 4 — Service: `notification-preference.service.ts` (`get()`, `update()` — không gửi `userId`) — 2026-06-22
- [x] Bước 5 — Hooks: `useNotificationPreferences.ts` (query staleTime 5′ + mutation invalidate) — 2026-06-22
- [x] Bước 6 — Component: `NotificationPreferencesSection.tsx` — RHF + zodResolver, `useEffect(reset)` khi data về + spinner `isLoading`, Checkbox×4, toggle quiet hours (derive qua `useWatch`) → 2 input `time`, Select timezone — 2026-06-22
- [x] Bước 7 — Wire `AccountSettingsPage.tsx`: import icon `Bell`; thêm object vào mảng `MENU as const`; thêm nhánh render `{active === "notifications" && <NotificationPreferencesSection />}` — 2026-06-22
- [x] Bước 8 — `tsc --noEmit` ✅ + `eslint --max-warnings=0` ✅ + `npm run build` ✅ — 2026-06-22
- [ ] Bước 9 — **Verify runtime** (để `/kltn-test`): submit sai HH:mm → confirm lỗi hiện đúng dưới input (xác nhận key JSON là `field` camelCase + interceptor fix hoạt động end-to-end).

## Câu hỏi đã giải đáp
1. **Vị trí UI?** → Tab mới "Tùy chọn thông báo" trong `AccountSettingsPage` (cùng pattern device-tokens), không tạo route độc lập.
2. **Timezone input?** → `Select` danh sách IANA curated, default `Asia/Ho_Chi_Minh`.
3. **Toggle component?** → ~~Checkbox~~ → **Switch** (shadcn `base-nova`, thêm qua `npx shadcn@latest add switch` → `src/components/ui/switch.tsx`, base-ui variant, **không kéo package mới**). Áp dụng cho 4 channel toggle + toggle quiet hours. (User yêu cầu 2026-06-22, sau review.)

## Gaps đã chốt (review vòng 2)
1. **"Thêm menu item" = sửa `MENU as const`** — ghi rõ ở Files §AccountSettingsPage + Bước 7: thêm object `{ key, label, icon: Bell, desc }` vào mảng (`MenuKey` tự suy ra), import icon `Bell` từ `lucide-react`.
2. **Load+edit pattern** — chốt `useEffect(() => { if (data) reset(...) }, [data, reset])` + spinner `isLoading` (pattern mới so với `defaultValues` tĩnh của DeviceTokensSection). Ghi ở Approach + Bước 6.
3. **Cross-field quiet hours** — thêm `.refine()` ở schema-level (BE không check cặp). Ghi ở Schema + Bước 2.
4. **BE contract verify** — đọc trực tiếp backend source (DTO/Command/Handler), confirm field names + format `"HH:mm"` (không phải `HH:mm:ss`) + `[JsonIgnore] UserId`. Ghi ở §BE Contract. → khoảng trống "shape chờ BE confirm" đã đóng.

## Gaps đã chốt (review vòng 3 — contract matching)
5. **Field-casing BE↔RHF** — verify toàn bộ `Field = "..."` ở BE là **PascalCase**, RHF register camelCase, `errors.ts` không normalize → BE field-mapping no-op. Mitigation: FE Zod mirror đủ rule → bắt client-side. Ghi ở §Rủi ro field-casing. Không sửa `errors.ts` (cross-cutting, ngoài scope).
6. **Status code** — verify interceptor `axios.ts:179-181` xử lý `400 || 422` + `listErrors` → `EntityError(status thật)`. BE ValidationBehavior trả `400`. Plan ghi `400` (không phải `422` default của constructor).
7. **queryKeys root** — chốt string đơn `notificationPreferences: "notificationPreferences"` + `me()` factory (khớp `deviceTokens`/`profile`, không lồng mảng).
