# Plan — GH-145: Sync FE theo Sprint Bonus NS-* (wire enums · aggregate min/max · env incident thủ công · IoT full key · AI feedback · SSE stats)

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-07-17 | **Cập nhật lần cuối:** 2026-07-17
- **Issue:** #145 — https://github.com/GSU26SE55/frontend/issues/145
- **Sprint:** Sprint 5 (deadline 2026-07-25)
- **Dev:** Trần Minh Trí (SE183109, @Shu1237)

## Mục tiêu
Đồng bộ FE theo đợt BE Sprint Bonus NS-* (đã merge BE `dev` — commit `881da50`, PR #689): mirror 3 wire-value enum + `AlertDto.siteId`, bổ sung min/max nạp-xả cho sensor aggregate + endpoint `/aggregate/hourly` + chart "Nạp/Xả đỉnh", form report sự cố môi trường thủ công, reveal full API key IoT, data layer AI classification feedback, và wire SSE event `stats`.

## Verify BE (đã kiểm tra trực tiếp trong `backend/`, không suy đoán)
| Hạng mục | Bằng chứng BE | Trạng thái |
|---|---|---|
| 1 | `AnomalyTypeEnum.cs:34 Undertemp = 16` · `TicketOriginEnum.cs` System=4 · `AlertDto.cs:20 string? SiteId` | ✅ có |
| 2 | `SensorReadingAggregateDto.cs` đủ min/max + avgCharge/Discharge + sampleCount · `SensorReadingsController.cs:256` route `aggregate/hourly` | ✅ có |
| 3 | `EnvironmentalIncidentsController.cs:107` `[HttpPost("manual")]` | ✅ có |
| 4 | `IotDeviceMapper.cs:37 ToDetailDto` · `IotDeviceQueryHandlers.cs:60 GetIotDeviceByIdQueryHandler → CommonResponse<IotDeviceDetailDto>` | ✅ có |
| 5 | `AnomalyClassificationsController.cs:55` **chỉ** `POST {id}/feedback` — **KHÔNG có GET nào** | ⚠️ data layer only |
| 6 | `RedisTelemetryStream.cs:91` emit `SseMessage("stats", …)` | ✅ có code (chờ deploy env) |

### ⚠️ 3 điểm issue body #145 ghi SAI — plan này dùng bản đúng
1. **`AlertTypeEnum` không tồn tại** → tên đúng là **`AnomalyTypeEnum`** (BE `AnomalyTypeEnum.cs`, FE `shared/enums/alert.enum.ts`).
2. **`NotificationTypeEnum` KHÔNG ở `features/staff/enums/`** → thực tế ở **`shared/enums/notification.enum.ts`** (dòng 16 có comment `// 15 bị skip ở BE` — thay bằng `CascadeRiskHigh: 15`).
3. **`TicketOriginEnum` là string enum ở FE, không phải int.** `TicketService.Api/Program.cs:22` add `JsonStringEnumConverter` → origin serialize **string** ⇒ FE thêm `System: "System"` (KHÔNG phải `4`). BatteryService **không** có converter này ⇒ enum của nó là int — khớp `AnomalyTypeEnum`/`AlertSeverityEnum` int hiện tại.

## Scope
**Trong scope:**
- **1** — `NotificationTypeEnum.CascadeRiskHigh=15` · `AnomalyTypeEnum.Undertemp=16` · `TicketOriginEnum.System="System"` · `AlertDto.siteId` + label/route alert cấp site.
- **2** — mở rộng `SensorReadingAggregateDto` (additive) · endpoint + service + hook `/aggregate/hourly` · chart "Nạp/Xả đỉnh" trên `BatteryAssetDetailPage`.
- **3** — `POST /environmental-incidents/manual` + Zod schema + form dialog trong `EnvironmentalIncidentsView` (RBAC Admin/Manager/Staff).
- **4** — `IotDeviceDetailDto` + reveal full API key trên `IoTDeviceDetailPage` (chỗ đã render `apiKeyLastFour`).
- **5** — **CHỈ data layer**: 2 enum + DTO + endpoint + service + mutation hook.
- **6** — wire SSE event `stats`: schema + parse + `useSensorStream` + hiển thị min/max trên `LiveTelemetryCard`.

**Ngoài scope:**
- UI hiển thị/lọc AI classification + nút feedback (**BE chưa có GET endpoint** — xem "Rủi ro" bên dưới).
- Không tạo trang IoT device detail mới (đã có `IoTDeviceDetailPage.tsx`).
- Không refactor `SensorChart` hiện có — chart "Nạp/Xả đỉnh" là component riêng.
- Không sửa `/aggregate` behavior cũ (chỉ thêm field vào DTO).
- Không đụng file thuộc #72/#73/#113/#114/#116/#132 ngoài các dòng liệt kê ở bảng Files.

## Endpoints
| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/sensor-readings/{assetId}/aggregate/hourly` | JWT | `from`, `to` | `CommonResponse<SensorReadingAggregateDto[]>` (bucket 1h, sort `time` tăng dần) |
| POST | `/api/environmental-incidents/manual` | JWT A/M/S | `{ siteId, incidentType, severity, note? }` | `CommonResponse<EnvironmentalIncidentDto>` — **200 + incident cũ** khi dedup |
| GET | `/api/admin/iot-devices/{id}` | Admin | — | `CommonResponse<IotDeviceDetailDto>` (= `IotDeviceDto` + `apiKey: string \| null`) |
| POST | `/api/v1/anomaly-classifications/{id}/feedback` | JWT A/M/S | `{ feedback: 1\|2\|3 }` | `CommonResponse<AnomalyClassificationDto>` |

> `GET /{id}` IoT: endpoint **đã được FE gọi sẵn** qua `iotDeviceService.getById` — chỉ đổi kiểu trả về, không thêm endpoint mới.

## Enums
| Enum | File nguồn | Action |
|------|-----------|--------|
| `NotificationTypeEnum` | `shared/enums/notification.enum.ts` | modify — `CascadeRiskHigh: 15` |
| `AnomalyTypeEnum` | `shared/enums/alert.enum.ts` | modify — `Undertemp: 16` |
| `TicketOriginEnum` | `shared/enums/ticket.enum.ts` | modify — `System: "System"` |
| `AnomalyClassificationEnum`, `StaffFeedbackEnum` | `shared/enums/anomaly-classification.enum.ts` | **create** — int enum (BatteryService = int) |

## Types
```ts
// shared/types/alert.types.ts (modify)
siteId: string | null;   // NS-21 — non-null cho alert cấp site; batteryAssetId = "" khi đó

// features/admin/types/sensor-reading.types.ts (modify — additive, avg* cũ giữ non-null)
minVoltage: number | null; maxVoltage: number | null;
minTemperature: number | null; maxTemperature: number | null;
maxChargeCurrent: number | null; minChargeCurrent: number | null; avgChargeCurrent: number | null;
maxDischargeCurrent: number | null; minDischargeCurrent: number | null; avgDischargeCurrent: number | null;
chargeSampleCount: number; dischargeSampleCount: number;
export interface SensorReadingAggregateHourlyParams { from?: string; to?: string }

// shared/types/environmental.types.ts (modify)
interface ManualIncidentPayload { siteId: string; incidentType: EnvironmentalIncidentTypeEnum; severity: AlertSeverityEnum; note?: string }

// shared/types/iot.types.ts (modify)
interface IotDeviceDetailDto extends IotDeviceDto { apiKey: string | null }

// shared/types/anomaly-classification.types.ts (create)
interface AnomalyClassificationDto { id, alertId: string|null, batteryAssetId, classification, anomalyScore, confidence, modelVersion, classifiedAt, latencyMs, staffFeedback: StaffFeedbackEnum|null, staffFeedbackByUserId: string|null, staffFeedbackAt: string|null }
interface SubmitFeedbackPayload { feedback: StaffFeedbackEnum }

// shared/types/sensor-stream.types.ts (modify)
interface LiveStatsDto { batteryAssetId, customerId, window: "1h"|"today", windowStart, updatedAt,
  siteId?: string|null, maxChargeCurrent?: number|null, minChargeCurrent?: number|null,
  maxDischargeCurrent?: number|null, minDischargeCurrent?: number|null,
  chargeSampleCount: number, dischargeSampleCount: number }
interface SensorStreamState { …; stats?: LiveStatsDto }   // thêm field
```

## Schema (Zod)
```ts
// shared/schemas/environmental-incident.schema.ts (create) — manualIncidentSchema
siteId:       z.string().uuid("Site không hợp lệ")
incidentType: z.nativeEnum(EnvironmentalIncidentTypeEnum)
severity:     z.nativeEnum(AlertSeverityEnum)
note:         z.string().max(500).optional()

// shared/lib/sse.ts (modify) — liveStatsSchema
window: z.enum(["1h","today"]) · min/max*: z.number().nullish() · *SampleCount: z.number()
```

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/notification.enum.ts` | modify | `CascadeRiskHigh: 15` — thay comment dòng 16 |
| `src/shared/enums/alert.enum.ts` | modify | `AnomalyTypeEnum.Undertemp: 16` |
| `src/shared/enums/ticket.enum.ts` | modify | `TicketOriginEnum.System: "System"` |
| `src/shared/types/alert.types.ts` | modify | `siteId: string \| null` |
| `src/shared/components/alerts/AlertsView.tsx` | modify | `ANOMALY_LABELS[Undertemp]`; alert cấp site (`batteryAssetId === ""`) → hiện site, không link pin |
| `src/features/admin/components/CreateNotificationForm.tsx` | modify | `TYPE_OPTIONS` += CascadeRiskHigh |
| `src/features/admin/types/sensor-reading.types.ts` | modify | +12 field aggregate + `…HourlyParams` |
| `src/features/admin/services/sensor-reading.service.ts` | modify | `getAggregateHourly` |
| `src/features/admin/hooks/useReadingAggregateHourly.ts` | create | theo pattern `useReadingAggregate.ts` |
| `src/features/admin/components/ChargeDischargePeakChart.tsx` | create | Recharts — min/max nạp/xả + ngưỡng tham chiếu |
| `src/features/admin/pages/BatteryAssetDetailPage.tsx` | modify | wire chart mới (cạnh `SensorChart`, dòng ~271) |
| `src/shared/types/environmental.types.ts` | modify | `ManualIncidentPayload` |
| `src/shared/schemas/environmental-incident.schema.ts` | create | `manualIncidentSchema` |
| `src/shared/services/environmental-incident.service.ts` | modify | `reportManual` |
| `src/shared/hooks/useReportManualIncident.ts` | create | useMutation + invalidate `KEY.environmentalIncidents` |
| `src/shared/components/environmental/ManualIncidentDialog.tsx` | create | RHF + Zod + `handleErrorApi({error,setError})` |
| `src/shared/components/environmental/EnvironmentalIncidentsView.tsx` | modify | nút "Report thủ công" + dialog |
| `src/shared/types/iot.types.ts` | modify | `IotDeviceDetailDto` |
| `src/features/admin/services/iot-device.service.ts` | modify | `getById` → `IotDeviceDetailDto` |
| `src/features/admin/pages/IoTDeviceDetailPage.tsx` | modify | reveal full key cạnh field "API key (4 cuối)" (~dòng 146) |
| `src/shared/enums/anomaly-classification.enum.ts` | create | 2 enum int |
| `src/shared/types/anomaly-classification.types.ts` | create | DTO + payload |
| `src/shared/services/anomaly-classification.service.ts` | create | `submitFeedback` |
| `src/shared/hooks/useSubmitClassificationFeedback.ts` | create | useMutation + `handleErrorApi({error})` |
| `src/shared/types/sensor-stream.types.ts` | modify | `LiveStatsDto` + `SensorStreamState.stats` |
| `src/shared/lib/sse.ts` | modify | `liveStatsSchema` + `parseStats` + `addEventListener("stats")` |
| `src/shared/hooks/useSensorStream.ts` | modify | nhánh `event === "stats"` |
| `src/shared/components/dashboard/LiveTelemetryCard.tsx` | modify | hiện min/max nạp-xả từ `stats` |
| `src/shared/utils/endpoints.ts` | modify | `AGGREGATE_HOURLY` · `ENVIRONMENTAL_INCIDENTS.MANUAL` · `ANOMALY_CLASSIFICATIONS.FEEDBACK` |
| `src/shared/utils/queryKeys.ts` | modify | `sensorReadings.aggregateHourly(assetId, params)` |

## Approach
- **Enum trước, consumer sau** — hạng mục 1 là nền; `tsc` sẽ chỉ ra mọi chỗ cần guard sau khi đổi `AlertDto`.
- **Alert cấp site**: `batteryAssetId === ""` (chuỗi rỗng, **không** null) ⇒ dùng `siteId`. Không dùng falsy-check chung vì `""` và `null` mang nghĩa khác nhau.
- **Chart**: `useReadingAggregate` (range ≤ 7 ngày, interval linh hoạt) vs `useReadingAggregateHourly` (range dài / 1h cố định) — chọn theo range đang xem, đúng khuyến nghị docs §Nhóm 2.
- **Min/max luôn dương cả 2 chiều** (chiều nằm trong tên field) → FE **không** xử lý dấu; `null` = window/bucket chưa có mẫu chiều đó.
- **SSE `stats`**: `openSse` là transport generic, chỉ cần `addEventListener("stats")` + parse riêng; `stats` không thay thế `reading` — 2 state độc lập trong `SensorStreamState`.

## Edge Cases
- `AlertDto.batteryAssetId === ""` → render theo site; **không** fetch pin. `siteId = null` với alert cấp pin.
- `NotificationTypeEnum`: 15 vốn là lỗ hổng có comment — điền `CascadeRiskHigh`, **không** đụng `16 BatteryAlertEscalationPending` đã có.
- `aggregate`: `min*/max*/avgCharge*/avgDischarge*` **nullable** (bucket không có mẫu chiều đó) — guard trước khi vẽ; `*SampleCount = 0` → bỏ điểm khỏi chart.
- `POST manual` dedup → **200** kèm incident **cũ** (không phát event lần 2): toast "đã tồn tại incident active", không báo lỗi.
- `POST manual` 400 → `listErrors` field-level → `setError` xuống input.
- `IotDeviceDetailDto.apiKey = null` (device cũ chỉ có hash) → hiện hint "rotate-key để sinh key mới", **không** hiện ô trống.
- Full API key là secret → mặc định che, chỉ hiện khi bấm; không log, không đưa vào URL/query.
- SSE `stats`: `Realtime:Enabled=false` hoặc BE chưa deploy → không có event `stats` ⇒ card min/max trống, **không** phải lỗi; backfill bằng REST `/aggregate`.
- SSE: field null bị lược khỏi JSON → `.nullish()`, coi field vắng = null; JSON hỏng → drop (không throw), theo `parseReading` sẵn có.

## Rủi ro / Blocker đã biết
- **Hạng mục 5 — BE thiếu GET endpoint.** `AnomalyClassificationsController` chỉ có `POST {id}/feedback`; không có `GET` list/detail, và không DTO nào expose `classificationId` để FE lấy `id`. ⇒ UI feedback **không thể** implement ở sprint này (đã chốt: chỉ data layer). Cần issue BE bổ sung `GET /anomaly-classifications?alertId=…` trước khi làm UI. Bảng cũng đang trống tới khi Sprint AI wire.
- **Hạng mục 6 — chờ BE deploy env.** Code BE đã merge; nếu env chưa deploy thì chỉ là không có data (EventSource bỏ qua event lạ) — không lỗi.
- **Chồng lấn**: #114 sở hữu `sse.ts`/`useSensorStream`/`LiveTelemetryCard`; #113 sở hữu IoT; #72/#73 sở hữu alerts/env. Cả 6 đang `status: reviewing` → **rebase `dev` trước khi bắt đầu**; nếu chưa merge, phối hợp tránh conflict.

## Acceptance Criteria
- [ ] `NotificationTypeEnum.CascadeRiskHigh === 15`, `AnomalyTypeEnum.Undertemp === 16`, `TicketOriginEnum.System === "System"`.
- [ ] `AlertDto.siteId` khai báo; alert cấp site (`batteryAssetId === ""`) render theo site, không link/fetch pin; alert cấp pin giữ nguyên hành vi cũ.
- [ ] `SensorReadingAggregateDto` có đủ 12 field mới; các field `avg*` cũ giữ non-null (không phá `SensorChart`).
- [ ] `GET /aggregate/hourly` gọi được qua service + hook; chart "Nạp/Xả đỉnh" hiển thị min/max 2 chiều trên `BatteryAssetDetailPage`, bỏ bucket có `sampleCount = 0`.
- [ ] Form report thủ công: submit thành công → incident mới xuất hiện trong list; dedup → toast báo incident đang tồn tại; lỗi 400 → hiện dưới đúng input.
- [ ] `IoTDeviceDetailPage` reveal được full API key (mặc định che, copy được); `apiKey = null` → hiện hint rotate-key.
- [ ] Data layer AI feedback: `submitFeedback` gọi đúng `POST /api/v1/anomaly-classifications/{id}/feedback`, type-safe, không UI.
- [ ] `sse.ts` đăng ký event `stats`; `useSensorStream` trả `stats`; `LiveTelemetryCard` hiện min/max; không có `stats` → card trống, không lỗi.
- [ ] `npx tsc --noEmit` sạch · `npx eslint . --max-warnings=0` sạch · `npm run build` PASS.

## Steps
- [x] **Bước 1 — Enums:** notification (15), alert (16), ticket (System), + `anomaly-classification.enum.ts` — 2026-07-17
- [x] **Bước 2 — Types:** alert(siteId) · sensor-reading(12 field) · environmental(ManualIncidentPayload) · iot(IotDeviceDetailDto) · anomaly-classification · sensor-stream(LiveStatsDto) — 2026-07-17
- [x] **Bước 3 — Endpoints + queryKeys:** `AGGREGATE_HOURLY` · `ENV.MANUAL` · `ANOMALY_CLASSIFICATIONS.FEEDBACK` · `sensorReadings.aggregateHourly` — 2026-07-17
- [x] **Bước 4 — Schemas:** `manualIncidentSchema` · `liveStatsSchema` — 2026-07-17
- [x] **Bước 5 — Services:** sensor-reading(`getAggregateHourly`) · environmental(`reportManual`) · iot-device(`getById` → Detail) · anomaly-classification(`submitFeedback`) — 2026-07-17
- [x] **Bước 6 — Hooks:** `useReadingAggregateHourly` · `useReportManualIncident` · `useSubmitClassificationFeedback` · `useSensorStream`(stats) — 2026-07-17
- [x] **Bước 7 — Components + Pages:** `ChargeDischargePeakChart` + wire `BatteryAssetDetailPage` · `ManualIncidentDialog` + wire `EnvironmentalIncidentsView` · reveal key `IoTDeviceDetailPage` · `LiveTelemetryCard`(min/max) · `AlertsView`(Undertemp + site-level) · `CreateNotificationForm` — 2026-07-17
- [x] **Bước 8 — Quality gate:** `tsc --noEmit` ✅ · `eslint --max-warnings=0` ✅ · `npm run build` ✅ — 2026-07-17

## Thay đổi so với plan (phát sinh khi implement)
| # | Plan ban đầu | Thực tế | Lý do |
|---|---|---|---|
| 1 | `SensorStreamState.stats?: LiveStatsDto` (1 slot) | `stats?: Partial<Record<StatsWindow, LiveStatsDto>>` | **Bug tránh được:** BE `RedisTelemetryStatsService.cs:86` chạy `foreach (var window in StatsWindows.All)` → đẩy **cả 2 window** (`1h`+`today`) qua **cùng event `stats`**. Lưu 1 slot ⇒ 2 window ghi đè lẫn nhau, card hiện số của window đến sau. |
| 2 | Tạo `shared/schemas/environmental-incident.schema.ts` | Gộp `manualIncidentSchema` vào `shared/schemas/environmental.schema.ts` sẵn có | Tránh 2 file schema cho cùng domain. |
| 3 | Tạo `shared/hooks/useReportManualIncident.ts` | Thêm vào `shared/hooks/useEnvironmentalIncidents.ts` sẵn có | Khớp pattern: mọi hook incident đều ở file đó. |
| 4 | Service tên `environmental-incident.service.ts` | File thật tên `environmental.service.ts` | Plan ghi sai tên file. |
| 5 | Dedup nhận biết qua… (plan không nói rõ) | Phân biệt bằng **HTTP status: 201 = tạo mới · 200 = dedup** | BE handler set `StatusCode` 201/200 (`EnvironmentalIncidentCommandHandlers.cs`), controller `return StatusCode(result.StatusCode, result)`. Docs chỉ ghi "200 dedup", không nói create là 201. |
| 6 | Chart wire "cạnh SensorChart" | Thêm **tab riêng "Nạp/Xả đỉnh"** trong Tabs sẵn có | Layout trang là Tabs — thêm tab hợp hơn là nhét cạnh. |
| 7 | (không có) | **+2 file mới:** `features/staff/services/site.service.ts` · `features/staff/hooks/useSites.ts` | Staff cần site list để chọn `siteId`; không được import từ `features/manager` (ESLint chặn). |
| 8 | (không có) | **+1 thay đổi BE** (repo khác, branch `fix/GH-146-open-sites-list-staff`) | Xem "Blocker BE" bên dưới. |
| 9 | `MESSAGES` mới cho copy key | Dùng `ADMIN_MESSAGES.iot.apiKeyCopied` sẵn có | Đã tồn tại, không tạo trùng. |
| 10 | `note?: string` trong `ManualIncidentPayload` | **`notes?: string`** + schema `max(500)` → `max(1000)` | 🔴 **Critical** do `/kltn-reviewcode` bắt: BE khai `Notes` (số nhiều, `EnvironmentalIncidentCommands.cs:28`) → FE gửi `note` bị BE **bỏ qua im lặng**, incident mất ghi chú, không lỗi. BE cho `Notes` ≤ 1000 nên nới theo. |
| 11 | (không có) | Bỏ hàng `Nạp / Xả` khỏi `LiveTelemetryCard` + xoá `CHARGING_LABELS` + field `chargingState` | User yêu cầu sau khi chạy thật — hàng luôn hiện `—` vì không có data. `BatteryRealtimeCard.tsx:81` có `chargingLabel` riêng nên không ảnh hưởng; `sse.ts` vẫn parse → data không mất. |
| 12 | (không có) | Legend thủ công + title `(A)` cho `ChargeDischargePeakChart` | User báo thiếu chú thích. Dùng legend thủ công vì 4 series phân biệt bằng **màu + kiểu nét**, `<Legend>` Recharts chỉ chú thích theo màu. |
| 13 | ReferenceLine ngưỡng `strokeDasharray="4 4"` | **`"1 3"`** (nét chấm) + label "Ngưỡng nạp"/"Ngưỡng xả" | Tự phát hiện: ngưỡng và đường min vẽ **nét đứt cùng màu** → không phân biệt được, đúng cái docs cảnh báo *"không nhầm với min/max thực đo"*. |

## ✅ Cập nhật: rủi ro hạng mục 6 đã hết
Screenshot môi trường thật cho thấy block ĐỈNH 1 GIỜ hiện **số liệu thật** (`84 mẫu`, Nạp `0.07–0.68 A`) ⇒ **BE đã deploy SSE `stats`**, FE parse đúng. Mục "chờ BE deploy" ở trên **không còn đúng** — hạng mục 6 đã verify runtime.

## ⚠️ Blocker BE phát sinh — Staff không list được site
`POST /api/environmental-incidents/manual` cho phép **Staff**, `siteId` là field **bắt buộc**, nhưng `GET /api/sites` là `[Authorize(Roles = "Admin,Manager")]` → **Staff nhận 403**, không có cách nào lấy `siteId`.

Đã verify không có đường vòng: `/api/sites/me` = Customer-only · `GET /api/battery-assets` = Admin,Manager · `GET /api/sites/{id}` cho Staff nhưng **phải biết id trước**. Hai list Staff đọc được (`/api/alerts`, `/api/environmental-incidents`) chỉ trả site **đã có** sự cố — ngược với tình huống cần report.

`/api/sites/assigned` **không khả thi**: không tồn tại quan hệ Staff–Site (`Site` chỉ có `CustomerId`; `StaffProfile` ở **AuthService** — service/DB khác, chỉ có `StaffSkillTier`).

**Đã sửa BE** (theo yêu cầu user, branch `fix/GH-146-open-sites-list-staff` trên repo `backend`, **chưa commit**):
```csharp
// BatteryService.Api/Controllers/SitesController.cs:71
- [Authorize(Roles = "Admin,Manager")]
+ [Authorize(Roles = "Admin,Manager,Staff")]
```
- ⚠️ **Chưa build được** — máy không có `dotnet` (`command not found`). Cần chạy `dotnet build` trước khi ship BE.
- ⚠️ Chưa có issue BE thật (số `GH-146` là đặt tạm).
- ⚠️ Hệ quả: **mọi Staff thấy toàn bộ site của mọi customer**. Chấp nhận được vì Staff vốn đọc được từng site qua `GET /{id}` (A,M,S,C) — đây chỉ thêm enumeration. Nhưng `BatteryRealtimeAuthorizationTests.cs:51` assert `CanAccessSite(["Staff"]) == false` cho kênh realtime → team **có chủ đích** không cho Staff tầm nhìn site-wide. Nếu chủ đích đó áp cho cả REST thì lời giải đúng là entity assignment (sprint sau), không phải mở list.
- FE degrade an toàn: `useSiteList` (staff) `retry: false`; BE chưa deploy → 403 → `sites` undefined → nút "Report thủ công" **tự ẩn**.

## Câu hỏi đã giải đáp
| Câu hỏi | Quyết định |
|---|---|
| Hạng mục 5 làm tới đâu? | **Chỉ data layer.** Ban đầu chọn "data + UI đầy đủ", nhưng verify BE cho thấy chỉ có `POST {id}/feedback`, không GET nào ⇒ UI không implement được (không có cách lấy `id`, bảng trống). Đã chốt lại data layer. |
| Hạng mục 6 wire ngay hay defer? | **Wire ngay** — BE đã có code emit `stats`; env chưa deploy chỉ là không có data, không lỗi; có REST `/aggregate` backfill. |
| Chart đặt ở đâu, endpoint nào? | **`BatteryAssetDetailPage`, dùng cả 2** — `/aggregate` cho range ≤ 7 ngày (interval linh hoạt), `/aggregate/hourly` cho range dài. |
| Reveal API key đặt ở đâu? | Ban đầu chọn "dialog từ row action" **dựa trên tiền đề sai của tôi** rằng không có trang detail. Thực tế `IoTDeviceDetailPage.tsx` đã tồn tại và đã gọi đúng `GET /{id}` + đã render `apiKeyLastFour` ⇒ **reveal ngay trên detail page**, không tạo dialog từ table. |
