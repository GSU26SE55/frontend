## BÁO CÁO CODE REVIEW — feat/GH-145-sync-sprint-bonus-ns — 2026-07-17
### Scope: FE (Web)
### Effort: Deep (33 file FE + 1 file BE, đụng `shared/`, 6 hạng mục)

> ⚠️ `git diff dev...HEAD` **trống** vì `/kltn-implement` cấm commit → review trên
> **working tree**: `git diff dev -- src/` (24 file modify) + đọc 9 file untracked.

---

## LƯỢT 1 — 2026-07-17

### TÓM TẮT
Kiến trúc, feature isolation, error handling, query key đều đạt. Nhưng có **1 Critical
gây mất dữ liệu âm thầm**: payload field `note` không khớp BE (`Notes`) → ghi chú người
dùng nhập bị BE bỏ qua, không lỗi, không cảnh báo. → **FAIL**.

### PHÂN TÍCH

🔴 **Critical** — `src/shared/types/environmental.types.ts:42` · `src/shared/schemas/environmental.schema.ts:11` · `src/shared/components/environmental/ManualIncidentDialog.tsx:178`
- **Vấn đề:** FE gửi field `note`; BE `ReportEnvironmentalIncidentCommand` khai `public string? Notes` (số nhiều) — `EnvironmentalIncidentCommands.cs:28`. ASP.NET camelCase ⇒ BE bind `notes`. FE gửi `note` → **BE bỏ qua im lặng**, `Notes` = null, incident lưu **mất ghi chú**. Không 400, không toast — user tưởng đã lưu.
- **Hệ quả phụ:** BE validate `nameof(Notes)` → axios interceptor normalize `"Notes"` → `"notes"` → `setError("notes")` không khớp field `note` đã register ⇒ lỗi server cho ghi chú **không hiện dưới input**.
- **Fix:** đổi `note` → `notes` ở cả 3 chỗ (type · schema · `register("notes")`).

🟡 **Warning** — `src/shared/schemas/environmental.schema.ts:11`
- Schema `max(500)`; BE cho phép `Notes?.Length > 1000` mới báo lỗi (`EnvironmentalIncidentCommands.cs:52`). FE chặn 501–1000 ký tự mà BE vẫn nhận. Gợi ý: nới lên 1000 cho khớp BE.

🟡 **Warning** — `src/shared/lib/sse.ts:53` (`liveStatsSchema.window`)
- Dùng `z.enum(["1h","today"])`. Chính file này (dòng 16–17) đặt convention ngược lại cho `sourceType`: dùng `z.number()` rộng thay literal *"→ BE thêm giá trị mới không làm drop cả reading"*. Nếu BE thêm window thứ 3, `safeParse` fail → **drop toàn bộ stats**, card trống không rõ lý do. Gợi ý: `z.string()` + narrow ở UI, hoặc chấp nhận vì docs ghi "chốt chỉ 2 window".

🟡 **Warning** — `src/shared/components/alerts/AlertsView.tsx:337`
- Alert cấp site hiện `siteId` dạng **GUID thô** — `AlertsView` không nhận prop `sites` nên không tra được tên (khác `EnvironmentalIncidentsView` có `siteName()`). UX kém. Ngoài scope ticket; ghi nhận để sau.

🟡 **Warning** — `src/features/admin/pages/IoTDeviceDetailPage.tsx:68`
- `navigator.clipboard.writeText` không `catch` → toast "Đã copy" kể cả khi copy fail (non-HTTPS / bị chặn quyền). Khớp pattern `DeviceKeyRevealDialog.tsx:24` sẵn có, nhưng `sms-gateway/ApiKeyRevealDialog.tsx:62` lại có try/catch → repo đang không nhất quán. Chấp nhận (theo sibling IoT).

🟡 **Warning** — BE `SitesController.cs:71` (repo `backend`, branch `fix/GH-146-open-sites-list-staff`)
- **Chưa build được** — máy không có `dotnet`. Chưa có issue BE thật. Mở list site cho Staff ⇒ mọi Staff thấy toàn bộ site của mọi customer; `BatteryRealtimeAuthorizationTests.cs:51` assert `CanAccessSite(["Staff"]) == false` cho realtime ⇒ có chủ đích chặn Staff tầm nhìn site-wide. Cần chủ repo BE quyết.

### ✅ Pass
- **Architecture:** không API call trong component; đều qua `services/` → hook TanStack Query. Không tạo Axios instance mới.
- **Feature isolation:** không có cross-feature import. `features/staff/{services,hooks}/site.*` tạo riêng thay vì import từ `features/manager` (đúng ESLint `no-restricted-imports`).
- **File placement:** `shared/` cho dùng ≥2 feature (alert/env/sse/anomaly-classification); `features/admin/` cho chart + sensor-reading; `features/staff/` cho site hook.
- **Query keys:** `QUERY_KEY.sensorReadings.aggregateHourly` factory; `invalidateQueries` dùng `[KEY.environmentalIncidents]` root — không hardcode string.
- **Error handling:** form (`ManualIncidentDialog`) dùng `try-catch` + `handleErrorApi({error,setError})`; non-form (`useSubmitClassificationFeedback`) dùng `onError: handleErrorApi({error})`. Không tự `toast.error` trong hook.
- **UI:** dùng shadcn primitives (`Button`/`Select`/`Dialog`/`Card`/`Textarea`/`Label`), không tự custom.
- **Auth/route:** không thêm route mới (chart = tab trong page đã protected; dialog trong page đã protected) → không cần `ProtectedRoute`/`RoleRoute` mới.
- **Security:** full API key mặc định che, chỉ hiện khi bấm; không log, không đưa vào URL. Token vẫn cookie-only.
- **Không có `console.log`.** Không hardcode URL — đều qua `ENDPOINTS`.
- **Enum pattern:** `as const` + type alias, không dùng TS native enum. `TicketOriginEnum.System = "System"` (string) đúng vì `TicketService.Api/Program.cs:22` có `JsonStringEnumConverter`; `AnomalyTypeEnum`/`NotificationTypeEnum` giữ int đúng vì BatteryService/NotificationService không có converter.
- **Bug thiết kế đã chặn được:** `SensorStreamState.stats` key theo window — BE `RedisTelemetryStatsService.cs:86` `foreach (var window in StatsWindows.All)` đẩy cả `1h` lẫn `today` qua cùng event.
- **Verify `/aggregate` cũ:** `GetSensorReadingAggregateQueryHandler.cs:92,98` **có** populate min/max + sampleCount ⇒ chart range 24h/7d có data thật, không rỗng.
- Quality gate lượt 1: `tsc --noEmit` ✅ · `eslint --max-warnings=0` ✅ · `npm run build` ✅ (không bắt được Critical — đây là lỗi contract runtime, type nào cũng hợp lệ).

### RỦI RO & LƯU Ý
- Critical trên **type-check không bắt được**: `note` là field FE tự định nghĩa, TS thấy hợp lệ. Chỉ lộ khi chạy thật + đọc BE. → `/kltn-test` cần verify ghi chú thực sự lưu xuống.
- Hạng mục 5 (AI feedback) chỉ data layer — không UI, không test runtime được; BE thiếu GET endpoint.
- Hạng mục 6 (SSE `stats`) chưa verify runtime được tới khi BE deploy.
- 6 issue liên quan (#72/#73/#113/#114/#116/#132) đang `reviewing` — rebase `dev` trước khi ship để tránh conflict `sse.ts`, `LiveTelemetryCard`, `AlertsView`.

### KẾT LUẬN — LƯỢT 1
**FAIL** — Độ tự tin: **Cao** (Critical verify trực tiếp từ BE source, không suy đoán)

---

## LƯỢT 2 — 2026-07-17 (sau khi sửa Critical)

### Đã sửa
| File | Thay đổi |
|------|----------|
| `src/shared/types/environmental.types.ts:46` | `note?: string` → **`notes?: string`** + comment giải thích tại sao tên field phải khớp `Notes` |
| `src/shared/schemas/environmental.schema.ts:12` | `note` → **`notes`**; đồng thời nới `max(500)` → **`max(1000)`** cho khớp BE (`Notes?.Length > 1000`) — xử lý luôn Warning #1 |
| `src/shared/components/environmental/ManualIncidentDialog.tsx:183–191` | `htmlFor`/`id`/`register`/`errors` đổi `note` → **`notes`** |

Verify: `grep` xác nhận **không còn** field `note` sót lại ở cả 3 file.

### Warning còn lại (chấp nhận, không chặn ship)
- `liveStatsSchema.window` dùng `z.enum` — giữ nguyên vì docs chốt chỉ 2 window; nếu BE thêm window thì sửa sau (đã ghi chú rủi ro).
- `AlertsView` hiện `siteId` GUID thô — ngoài scope ticket, cần prop `sites` mới tra được tên.
- `clipboard.writeText` không catch — theo đúng pattern `DeviceKeyRevealDialog.tsx:24` sibling.
- BE `SitesController.cs:71` **chưa build** (máy không có `dotnet`) + chưa có issue BE + cần chủ repo BE quyết về việc Staff thấy toàn bộ site.

### Quality gate — lượt 2
- `npx tsc --noEmit` → ✅ sạch
- `npx eslint . --max-warnings=0` → ✅ sạch
- `npm run build` → ✅ built in 5.97s

### KẾT LUẬN — LƯỢT 2
**PASS** — Độ tự tin: **Trung bình**

Lý do không phải "Cao": Critical vừa sửa là lỗi **contract runtime** mà `tsc`/`eslint`/`build`
đều không bắt được (lượt 1 pass cả 3 gate mà vẫn có bug mất dữ liệu). Fix `notes` mới chỉ
verify bằng đọc BE source + grep, **chưa chạy thật**. `/kltn-test 145` phải verify: submit
form report thủ công có ghi chú → incident lưu xuống **thực sự có `notes`**, không null.
Ngoài ra hạng mục 5 (không UI) và 6 (chờ BE deploy) không verify runtime được ở sprint này.

---

## LƯỢT 3 — 2026-07-17 (UI feedback từ user trên môi trường chạy thật)

> User chạy app thật và gửi screenshot → phát sinh 3 thay đổi UI **sau khi** lượt 2 đã PASS.
> Lượt này ghi lại để review.md khớp code hiện tại.

### 🔎 Thông tin mới quan trọng — rủi ro "chờ BE deploy" đã HẾT
Screenshot `BatteryAssetDetailPage` cho thấy block ĐỈNH 1 GIỜ hiện **số liệu thật**
(`84 mẫu` · Nạp `0.07 – 0.68 A` · Xả `0.07 – 2.65 A`) ⇒ **BE đã deploy event SSE `stats`**,
FE nhận và parse đúng. Hạng mục 6 coi như **verify được runtime**, không còn treo.
→ Cập nhật: mục "Hạng mục 6 chưa verify runtime" ở LƯỢT 1 **không còn đúng**.

### Thay đổi UI

**1. Bỏ hàng `Nạp / Xả —` khỏi `LiveTelemetryCard`** (user yêu cầu)
| File | Thay đổi |
|---|---|
| `src/shared/components/dashboard/LiveTelemetryCard.tsx` | Xoá hàng render `chargingState`; xoá `CHARGING_LABELS` (chỉ hàng đó dùng); xoá field `chargingState` khỏi `TelemetryDisplay` |

- Lý do: hàng luôn hiện `—` vì `chargingState` không có dữ liệu → vô dụng.
- Verify trước khi xoá (tránh phá chỗ khác): `BatteryRealtimeCard.tsx:81` **cũng** render charging state nhưng dùng `chargingLabel` **riêng của nó** → không ảnh hưởng. `sse.ts:34` vẫn parse `chargingState` từ payload → **dữ liệu không mất**, chỉ card này không render.
- ⚠️ Sự cố quy trình: lượt sửa đầu tôi **hiểu sai** yêu cầu ("phần nạp xả **trên** đỉnh 1 giờ" = hàng nằm *phía trên* block, không phải nội dung *trong* block) → xoá nhầm block ĐỈNH 1 GIỜ. User phát hiện qua screenshot → đã **khôi phục** block + prop `stats` + `stats={stream.stats?.["1h"]}` ở page. Trạng thái cuối: block ĐỈNH 1 GIỜ **còn**, hàng `Nạp / Xả` **đã xoá**.

**2. Thêm legend cho `ChargeDischargePeakChart`** (user báo "thiếu chú thích label")
| File | Thay đổi |
|---|---|
| `src/features/admin/components/ChargeDischargePeakChart.tsx:51` | `LEGEND` + `LegendItem` — legend thủ công 4 mục |
| `:135` | Title → `Nạp/Xả đỉnh (A)` (chart trước đó không nói đơn vị) |

- Dùng legend thủ công thay `<Legend>` của Recharts: 4 series phân biệt bằng **màu + kiểu nét**, `<Legend>` chỉ chú thích được theo màu ⇒ không đủ.
- 4 mục: Nạp đỉnh (xanh liền) · Nạp thấp nhất (xanh đứt) · Xả đỉnh (đỏ liền) · Xả thấp nhất (đỏ đứt) + "Ngưỡng cảnh báo" (chỉ hiện khi battery type có threshold).

**3. 🟡→✅ Sửa lỗi phân biệt nét vẽ (tự phát hiện khi xử lý #2, user không nêu)**
| File | Trước | Sau |
|---|---|---|
| `ChargeDischargePeakChart.tsx:212,226` | ReferenceLine ngưỡng dùng `strokeDasharray="4 4"` **cùng màu** với đường min (`"3 3"`) | Ngưỡng → `strokeDasharray="1 3"` (nét chấm) + `label` "Ngưỡng nạp"/"Ngưỡng xả" ngay trên đường |

- **Vấn đề:** đường *min thực đo* và đường *ngưỡng admin đặt* là 2 khái niệm khác hẳn nhau nhưng vẽ **nét đứt cùng màu** ⇒ trông y hệt; thêm legend vào cũng vẫn không phân biệt được trên chart. Docs `api-battery.md` cảnh báo đúng điểm này: *"Đường ngưỡng tham chiếu... **không** nhầm với min/max thực đo"*.

### Quality gate — lượt 3
- `npx tsc --noEmit` → ✅ sạch
- `npx eslint . --max-warnings=0` → ✅ sạch
- `npm run build` → ✅ built in 5.91s

### Quy mô cuối
**39 file** — 29 modify + 10 create (FE) · +1 file BE (`SitesController.cs`, repo khác).

### KẾT LUẬN — LƯỢT 3
**PASS** — Độ tự tin: **Trung bình**

Giữ "Trung bình" (không nâng lên Cao) dù hạng mục 6 giờ đã verify runtime, vì **rủi ro lớn
nhất vẫn chưa được kiểm chứng**: fix Critical `notes` (lượt 2) mới verify bằng đọc BE source
+ grep, **chưa từng chạy thật**. Đây đúng là loại lỗi mà 3 gate đều mù — lượt 1 pass sạch cả
3 mà vẫn mất dữ liệu.

**`/kltn-test 145` bắt buộc verify:**
1. Submit form report thủ công **có nhập ghi chú** → incident lưu xuống **thực sự có `notes`**, không null. (Ưu tiên cao nhất.)
2. Dedup: report trùng site+loại → toast "đã tồn tại" (HTTP 200), không phải toast "đã ghi nhận" (201).
3. Portal **Manager** (`manager/pages/AlertsPage.tsx`, `manager/pages/EnvironmentalIncidentsPage.tsx`) — 2 file này chưa từng được mở/đọc trong suốt quá trình implement, chỉ suy ra là bị ảnh hưởng qua shared view. `tsc` sạch nhưng hành vi runtime chưa kiểm chứng.
4. Alert cấp site (`batteryAssetId === ""`) → hiện "Cấp site", không fetch pin.

**Không verify được ở sprint này:** hạng mục 5 (AI feedback — data layer, không UI, BE thiếu GET endpoint, bảng trống).
