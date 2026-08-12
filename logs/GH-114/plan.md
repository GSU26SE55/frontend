# Plan — GH-114: [FE] Battery Realtime Telemetry — shared SSE foundation + admin asset live card

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-06-28
- **Issue:** #114 — https://github.com/GSU26SE55/frontend/issues/114
- **Sprint:** Sprint 4 (due 2026-07-11) | **Priority:** P3
- **Dev:** Trần Minh Trí (SE183109)

## ⚠️ Ranh giới với GH-116 (de-dup — Hướng A)
GH-116 ("Battery Monitoring Extras") có section **3c Sensor Stream** trùng feature. Đã chốt **Hướng A**:
- **GH-114 SỞ HỮU nền tảng SSE shared** (các file `shared/` dưới đây) + wire vào **admin Asset detail** (scope `asset:{id}` → event `reading`).
- **GH-116 (3c) KHÔNG tạo lại** các file nền này — **reuse** và chỉ thêm: nhánh `site:{id}` summary (`items`) trong `useSensorStream`, `SiteLiveTelemetryPanel`, wire vào Site detail (admin+manager). Cascade Risk + Audit Logs của GH-116 độc lập, không liên quan.
- **Đặt tên theo GH-116 làm chuẩn** (để GH-116 ít sửa): `openSse` · `useSensorStream` · `LiveReadingDto` · `LiveTelemetryCard` · `SensorStreamState`.

## Mục tiêu
Xây **nền tảng tiêu thụ SSE telemetry pin** dùng chung (transport SSE, không phải SignalR) + wire **live card** vào section "Realtime" của admin `BatteryAssetDetailPage` — nâng polling 30s lên live SSE ~5s (scope `asset:{id}`), seed REST `/latest`, fallback polling khi lỗi.

> **Contract (nguồn chuẩn):** `frontend/docs/battery-realtime-description.md` (§3 connect · §5 events/field · §6 RBAC · §7 REST-seed · §8 error). BE: `SensorTelemetryStreamController.cs`, `RedisTelemetryStream.cs`, `LiveReadingDto.cs`. Doc FE chính chủ — verify được, không phải BE-source-only.

## Scope
**Trong scope:**
- `shared/lib/sse.ts` — `openSse(url, { onEvent, onError })` generic (addEventListener theo tên event, trả `close()`), native `EventSource`, token `?access_token=`, base `VITE_API_BASE_URL`.
- `shared/enums/telemetry.enum.ts` — `SensorSourceTypeEnum`, `SensorSourceCodeEnum`.
- `shared/types/sensor-stream.types.ts` — `LiveReadingDto` (18-field §5.3) + `SensorStreamState` + Zod `liveReadingSchema`. Tách hẳn REST `SensorReadingDto` (8-field).
- `shared/hooks/useSensorStream.ts` — `useSensorStream(scope)` → `SensorStreamState`. **Issue này chỉ implement nhánh `reading` (asset)**, ưu tiên `primary`; cấu trúc chừa chỗ cho nhánh `items`/summary (GH-116 thêm sau).
- `shared/components/common/LiveTelemetryCard.tsx` — presentational: render 1 `LiveReadingDto` + connection badge.
- Wire `LiveTelemetryCard` vào admin `BatteryAssetDetailPage` Realtime section (seed + fallback **tái dùng `useBatteryAssetRealtime` (`rt`) đã wire sẵn** — KHÔNG thêm wiring `/latest` mới).
- `SENSOR_READINGS.STREAM` trong `endpoints.ts`.

**Ngoài scope:**
- Scope `site`/`customer`/`type`/`all`/… + event `summary` + `SiteLiveTelemetryPanel` + manager wiring → **GH-116 (3c)**.
- Cascade Risk, Audit Logs → GH-116 (không liên quan).
- Thêm package · đụng REST đã có · chart history/aggregate · sửa BE.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | `SENSOR_READINGS.STREAM: "/api/sensor-readings/stream"` (chỉ path; wrapper ghép `?scope=&access_token=`). |
| `src/shared/enums/telemetry.enum.ts` | create | `SensorSourceTypeEnum` (1/2/3), `SensorSourceCodeEnum` (primary/redundant/external-temp). |
| `src/shared/types/sensor-stream.types.ts` | create | `LiveReadingDto` (18-field), `SensorStreamState`, re-export enum. |
| `src/shared/lib/sse.ts` | create | `openSse(url, { onEvent, onError })` + co-locate Zod `liveReadingSchema` (`safeParse`). |
| `src/shared/hooks/useSensorStream.ts` | create | `useSensorStream(scope)` — nhánh `reading` (asset), prefer `primary`; lifecycle + recreate-on-error có cap. |
| `src/shared/components/common/LiveTelemetryCard.tsx` | create | presentational reading + badge (open/reconnecting/error). |
| `src/features/admin/pages/BatteryAssetDetailPage.tsx` | modify | Realtime section: dùng `useSensorStream(asset:{id})` + `<LiveTelemetryCard>`; `reading = stream.reading ?? rt` (`rt` = `useBatteryAssetRealtime` đã có — vừa seed vừa fallback). KHÔNG thêm `useLatestReading`. |

## Endpoints
| Method | Path | Mục đích |
|--------|------|----------|
| GET (SSE) | `/api/sensor-readings/stream?scope=asset:{id}&access_token={JWT}` | `text/event-stream`, events `reading`(~5s)/`ping`(30s). Lỗi trước khi mở → 4xx + `CommonResponse` (EventSource không đọc được). |
| — | (seed/fallback) | KHÔNG thêm `/latest`: tái dùng `useBatteryAssetRealtime` (`/battery-assets/{id}/realtime`) đã wire sẵn trong page → vừa seed ban đầu vừa fallback polling 30s. |

## Enums
| Enum | File | Giá trị |
|------|------|---------|
| `SensorSourceTypeEnum` | `shared/enums/telemetry.enum.ts` (create) | BMS=1, IoTGateway=2, External=3 (§5.3) |
| `SensorSourceCodeEnum` | `shared/enums/telemetry.enum.ts` (create) | PRIMARY="primary", REDUNDANT="redundant", EXTERNAL_TEMP="external-temp" (§5.4) |
| `ChargingStateEnum` | `admin/enums/battery-asset.enum.ts` (đã có) | chỉ map hiển thị; `LiveReadingDto.chargingState` = `number\|null` (shared không import features) |

## Types
`LiveReadingDto` (§5.3, 18 field) — nullable bị lược khi null → khai `?`:
```ts
interface LiveReadingDto {
  batteryAssetId: string; customerId: string; time: string;          // non-null
  voltage: number; current: number; temperature: number; socPercent: number; // non-null
  sourceType: SensorSourceTypeEnum;                                  // non-null (1/2/3)
  siteId?: string | null; batteryTypeId?: string | null;
  sohPercent?: number | null; cycleCount?: number | null;
  chargingState?: number | null; internalResistanceMilliohm?: number | null;
  cellVoltageDeltaMv?: number | null; bmsErrorCode?: string | null;
  sourceDeviceId?: string | null; sensorSourceCode?: string | null; // known: SensorSourceCodeEnum
}
type SensorStreamState = { status: "connecting" | "open-idle" | "live" | "error" | "closed"; reading?: LiveReadingDto; lastPingAt?: number };
```
> KHÔNG chung với REST `SensorReadingDto` (REST thiếu customerId·siteId·sohPercent·chargingState·bmsErrorCode·sourceType·sensorSourceCode).

## Schema (Zod)
`liveReadingSchema` co-locate trong `sse.ts`, `safeParse` mỗi `reading`; non-null = required, nullable = `.nullish()`; `sourceType: z.number()` (rộng — tránh drop khi BE thêm giá trị); parse fail → drop message (không crash).

## Workflow
**`useSensorStream(scope)` (issue này: `asset:{id}`):**
```
mount/đổi scope → openSse(`${VITE_API_BASE_URL}/api/sensor-readings/stream?scope=${scope}&access_token=${cookie}`)
  onopen          → status "open-idle"
  event "reading" → safeParse(liveReadingSchema)
                     ok → nếu sensorSourceCode ∈ {primary, null/undefined} → reading=parsed, status "live"
                          (redundant/external-temp = số liệu một phần → bỏ qua cho headline)
                     fail → drop (không crash)
  event "ping"    → lastPingAt=now (giữ alive); nếu chưa có reading → vẫn "open-idle"
  onerror         → CONNECTING (transient) → status "connecting" (EventSource tự reconnect)
                    CLOSED (permanent)     → recreate đọc token mới, cap MAX_RECREATE=3 + backoff
                                             → hết retry → status "error", close() → fallback polling
unmount/đổi scope → close()
```
**Render (admin `BatteryAssetDetailPage`):** `reading = stream.reading ?? rt(useBatteryAssetRealtime)`; badge: live→green pulse, connecting→amber, error/open-idle→gray.

## Edge Cases
- `Realtime:Enabled=false` (chỉ `ping`) → status "open-idle", hiển thị `rt` (polling snapshot), không lỗi/treo.
- 4xx trước khi mở stream → EventSource không đọc status/body → **trade-off chủ ý P3**: fallback polling + status "error" generic.
- recreate có cap (tránh reconnect-loop khi 403): transient để tự reconnect; chỉ recreate khi CLOSED, ≤3 lần + backoff.
- Reconnect không replay (no `Last-Event-ID`) → `rt` polling 30s đắp gap (không cần `/latest` riêng).
- Token hết hạn → onerror CLOSED → recreate đọc token mới.
- Field null bị lược → optional + `.nullish()`; UI `!= null`.
- Đa nguồn 1 pin → ưu tiên `primary`.

## Acceptance Criteria
- [ ] `openSse` mở SSE `asset:{id}`, nghe `reading`+`ping`; trả `close()`.
- [ ] `liveReadingSchema` safeParse mỗi reading; payload lệch → drop, không crash.
- [ ] `useSensorStream("asset:{id}")` → `SensorStreamState` đúng (live/open-idle/connecting/error), ưu tiên `primary`.
- [ ] Admin `BatteryAssetDetailPage` Realtime hiển thị `<LiveTelemetryCard>` live ~5s, seed/fallback từ `rt` (`useBatteryAssetRealtime`), badge theo status.
- [ ] `Realtime:Enabled=false` → open-idle, hiển thị `rt`, không lỗi/treo.
- [ ] SSE lỗi CLOSED → recreate ≤3 → fallback polling; không loop/crash.
- [ ] `LiveReadingDto` tách hẳn REST `SensorReadingDto`. Tên/đặt chỗ khớp để GH-116 reuse.
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS.

## Steps
- [x] B1 Enums: `shared/enums/telemetry.enum.ts`. — 2026-06-28
- [x] B2 Types + endpoint: `shared/types/sensor-stream.types.ts` (`LiveReadingDto`, `SensorStreamState`) + `SENSOR_READINGS.STREAM`. — 2026-06-28
- [x] B3 Schema + Wrapper: `shared/lib/sse.ts` (`liveReadingSchema` + `parseReading` + `openSse` generic) — route BE verified (`/api/sensor-readings/stream`, Roles Admin/Manager/Staff/Customer, text/event-stream). — 2026-06-28
- [x] B4 Hook: `shared/hooks/useSensorStream.ts` (nhánh asset reading, prefer primary, recreate cap). — 2026-06-28
- [x] B5 Component: `shared/components/common/LiveTelemetryCard.tsx` + wire vào admin `BatteryAssetDetailPage` (thay block Realtime inline; gỡ helper StatTile/fmtNum/CHARGING_LABELS/color-logic không còn dùng). — 2026-06-28
- [x] B6 Gate: `npm run build` (`tsc -b` + vite) PASS + `eslint . --max-warnings=0` PASS. (`tsc --noEmit` no-op vì root tsconfig là solution file — type-check thật ở `tsc -b`.) — 2026-06-28

## Đối chiếu Backend
- BE: `SensorTelemetryStreamController.cs` (route), `RedisTelemetryStream.cs`, `LiveReadingDto.cs` (shape). Contract `frontend/docs/battery-realtime-description.md` §3/§5/§6/§7/§8.
- Seed/fallback dùng `useBatteryAssetRealtime` (`/battery-assets/{id}/realtime`) đã wire sẵn — KHÔNG thêm wiring `/latest`/`/history`/`/aggregate` (đã có ở `features/admin` nhưng ngoài scope issue này).

## Câu hỏi đã giải đáp
- **Scope FE?** → Nền tảng SSE shared + wire admin Asset detail (asset reading). Site/summary = GH-116.
- **Transport?** → native `EventSource` (không thêm package; token query). Base = `VITE_API_BASE_URL` (gateway), không `VITE_WS_URL`.
- **Trùng GH-116?** → Có (3c). Chốt **Hướng A**: 114 sở hữu nền tảng, 116 reuse + thêm site summary. Tên chuẩn theo GH-116.

## Cập nhật theo review (2026-06-28)
- recreate-on-error phân biệt transient/permanent + cap (tránh loop 403).
- 4xx-before-open = trade-off chủ ý P3.
- Bổ sung Enums/Types(18-field)/Schema(Zod)/Workflow.
- Bỏ `TelemetrySummary`/`scopeType` (→ GH-116).
- Path doc `frontend/docs/`. Field = 18.
- **De-dup GH-116 (Hướng A):** align tên `openSse`/`useSensorStream`/`LiveReadingDto`/`LiveTelemetryCard`/`SensorStreamState`, đặt foundation ở `shared/`; GH-116 reuse.
