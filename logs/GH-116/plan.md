# Plan — GH-116: Battery Monitoring Extras (Cascade Risk + Audit Logs + Sensor Stream)

## Metadata
- **Status:** IN_PROGRESS | **Role:** FE | **Ngày:** 2026-06-28
- **Issue:** #116 — https://github.com/GSU26SE55/frontend/issues/116
- **Sprint:** Sprint 4 (due 2026-07-11)
- **Dev:** Trần Minh Trí (Shu1237)

## Mục tiêu
Bổ sung 3 mảng monitoring (Admin/Manager) consume 6 endpoint BatteryService, mỗi mảng nhỏ nên gộp 1 issue:
- **3a Cascade Risk** — xem rủi ro lan truyền 1 pin/1 site + Admin gán electrical topology.
- **3b Audit Logs** — tra cứu audit log thao tác trên Pin & Cảnh báo (Admin only, forensic fallback).
- **3c Sensor Stream** — telemetry live qua SSE (`EventSource`) cho asset (event `reading`) và site (event `summary`).

> ⚠️ **De-dup với GH-114 (Hướng A):** nền tảng SSE shared (`sse.ts`, `useSensorStream` nhánh asset, `LiveReadingDto`/`SensorStreamState`, `LiveTelemetryCard`, `SENSOR_READINGS.STREAM`, wire asset card vào admin `BatteryAssetDetailPage`) **do GH-114 sở hữu**. GH-116 (3c) **reuse**, chỉ thêm: nhánh `site:{id}` summary (`items`/`BatterySummaryDto`) trong `useSensorStream`, `SiteLiveTelemetryPanel`, wire Site detail (admin+manager). **Phụ thuộc: merge GH-114 trước** (hoặc phối hợp tránh đụng file).

Output: UI + service + TanStack Query hook (3a/3b) + SSE hook (3c), type-check sạch, lint 0 warning, build pass.

## Scope
**Trong scope:**
- 3a: GET cascade-risk (asset) · GET cascade-risk-summary (site) · POST topology (Admin). UI: card ở Asset detail + panel heat map ở Site detail (Admin **và** Manager).
- 3b: GET battery audit-logs · GET alert audit-logs. Trang riêng `/admin/battery-audit-logs` (2 tab Battery/Alert) + sidebar nav (Admin only).
- 3c: SSE `GET /api/sensor-readings/stream?scope=...`. Display: live telemetry card ở Asset detail (scope `asset:{id}`, event `reading`) + live panel ở Site detail (scope `site:{id}`, event `summary`) cho Admin & Manager.
- Shared: enums/types/endpoints/queryKeys + 1 SSE helper (`shared/lib/sse.ts`) + 1 hook (`shared/hooks/useSensorStream.ts`) + component presentational dùng chung trong `shared/components/common`.

**Ngoài scope:**
- POST `/api/sensor-readings/batch` (IoT gateway, API key — không thuộc web FE).
- Account/auth audit (`AuditLogsPage` hiện có) — không đụng tới.
- Cascade write nào khác ngoài set topology; không recompute on-demand ở FE (BE tự tính mỗi 5 phút).
- Chart lịch sử telemetry (đã có SensorChart) — 3c chỉ là live snapshot stream.
- Refetch/refactor các page lân cận ngoài 2 detail page + 1 trang audit mới.

## Endpoints
| Method | Path | Auth | Mục đích / I/O |
|--------|------|------|----------------|
| GET | `/api/battery-assets/{id}/cascade-risk` | All roles | → `CommonResponse<CascadeRiskDto>` |
| GET | `/api/sites/{id}/cascade-risk-summary` | Admin/Manager | → `CommonResponse<SiteCascadeRiskSummaryDto>` |
| POST | `/api/battery-assets/{id}/topology` | Admin | body `{ electricalTopology: 1..4 }` → `CommonResponse<CascadeRiskDto>` (đã recompute) |
| GET | `/api/admin/battery/audit-logs` | Admin | query `action?, batteryId?, from?, to?, pageNumber=1, pageSize=50(≤100)` → `CommonResponse<PaginationResponse<BatteryAuditLogDto>>` |
| GET | `/api/admin/alerts/audit-logs` | Admin | query `action?, alertId?, from?, to?, pageNumber, pageSize` → `CommonResponse<PaginationResponse<BatteryAuditLogDto>>` |
| GET (SSE) | `/api/sensor-readings/stream?scope=…` | All roles | `text/event-stream`; events: `reading` (asset, `LiveReadingDto`), `summary` (multi, `BatterySummaryDto`), `ping` (`{}`). Auth qua `?access_token=` |

> **scope grammar:** `asset:{id}` | `assets:{id1,id2}` | `customer:{id}` | `site:{id}` | `sites:{ids}` | `type:{id}` | `all` | `site:none` (mỗi list ≤ 50 id). FE chỉ dùng `asset:{id}` và `site:{id}` trong issue này.
> **Contract 3c đầy đủ:** `frontend/docs/battery-realtime-description.md` (FE-facing — connect/scope/event/payload/RBAC/REST-seed/error/setup). Đây là nguồn chuẩn cho 3c.

## Files
### Shared (cross-feature)
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/cascade.enum.ts` | create | `ElectricalTopologyEnum`, `CascadeRiskLevel` (`as const`) |
| `src/shared/types/cascade.types.ts` | create | `CascadeRiskDto`, `SiteCascadeRiskSummaryDto`, `SetTopologyPayload` |
| `src/shared/types/sensor-stream.types.ts` | **modify (reuse GH-114)** | GH-114 tạo `LiveReadingDto`+`SensorStreamState`. GH-116 **chỉ thêm** `BatterySummaryDto`, `SensorStreamScope` (site) + `items?` vào `SensorStreamState` |
| `src/shared/lib/sse.ts` | **reuse GH-114 (KHÔNG tạo lại)** | `openSse` generic đã có từ GH-114 — chỉ import |
| `src/shared/hooks/useSensorStream.ts` | **modify (reuse GH-114)** | GH-114 tạo (nhánh asset `reading`). GH-116 **thêm nhánh `items`/`summary`** cho scope `site:{id}` |
| `src/shared/components/common/LiveTelemetryCard.tsx` | **reuse GH-114 (KHÔNG tạo lại)** | dùng lại nguyên |
| `src/shared/components/common/SiteLiveTelemetryPanel.tsx` | create | (GH-116 sở hữu) presentational — render `summary.items` (nhiều pin) |
| `src/shared/components/common/CascadeRiskSummary.tsx` | create | presentational — heat map count Low/Med/High + top high-risk list, nhận `SiteCascadeRiskSummaryDto` prop |
| `src/shared/utils/endpoints.ts` | modify | `BATTERY_ASSETS.CASCADE_RISK(id)` + `.TOPOLOGY(id)`; `SITES.CASCADE_RISK_SUMMARY(id)`; `ADMIN.BATTERY_AUDIT_LOGS`, `ADMIN.ALERT_AUDIT_LOGS`. **`SENSOR_READINGS.STREAM` do GH-114 thêm — reuse** |
| `src/shared/utils/queryKeys.ts` | modify | `KEY.batteryAssets.cascadeRisk(id)`, `sites.cascadeSummary(id)`, `admin.batteryAuditLogs`, `admin.alertAuditLogs` |

### 3a Cascade — Admin
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/admin/services/cascade.service.ts` | create | `getAssetRisk`, `getSiteSummary`, `setTopology` |
| `src/features/admin/hooks/useCascadeRisk.ts` | create | useQuery asset risk |
| `src/features/admin/hooks/useSiteCascadeSummary.ts` | create | useQuery site summary |
| `src/features/admin/hooks/useSetTopology.ts` | create | useMutation → invalidate cascadeRisk |
| `src/features/admin/components/CascadeRiskCard.tsx` | create | asset card: score, level badge, topology, updatedAt + nút "Set topology" (Admin) |
| `src/features/admin/components/SetTopologyDialog.tsx` | create | RHF + zod, select 1..4 |
| `src/features/admin/schemas/topology.schema.ts` | create | `electricalTopology` ∈ 1..4 |
| `src/features/admin/pages/BatteryAssetDetailPage.tsx` | modify | mount `CascadeRiskCard` (LiveTelemetryCard **do GH-114 wire** — không lặp) |
| `src/features/admin/pages/SiteDetailPage.tsx` | modify | mount `CascadeRiskSummary` (qua hook) + `SiteLiveTelemetryPanel` |

### 3a Cascade — Manager (summary + site stream only)
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/manager/services/cascade.service.ts` | create | `getSiteSummary` only |
| `src/features/manager/hooks/useSiteCascadeSummary.ts` | create | useQuery site summary |
| `src/features/manager/pages/SiteDetailPage.tsx` | modify | mount `CascadeRiskSummary` + `SiteLiveTelemetryPanel` |

### 3b Audit Logs — Admin only
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/audit.enum.ts` | create | `AuditSeverity`, `AuditActionCategory` — **cross-service shared** (api-audit.md §67/§76) |
| `src/features/admin/enums/battery-audit.enum.ts` | create | `BatteryAuditActionCode`, `AlertAuditActionCode` (battery-specific, `as const`) |
| `src/features/admin/types/battery-audit.types.ts` | create | `BatteryAuditLogDto`, `BatteryAuditLogParams`, `AlertAuditLogParams` |
| `src/features/admin/services/battery-audit-logs.service.ts` | create | `getBatteryLogs`, `getAlertLogs` |
| `src/features/admin/hooks/useBatteryAuditLogs.ts` | create | useQuery |
| `src/features/admin/hooks/useAlertAuditLogs.ts` | create | useQuery |
| `src/features/admin/components/BatteryAuditLogTable.tsx` | create | table render `BatteryAuditLogDto[]` |
| `src/features/admin/components/AuditLogFilterBar.tsx` | create | **Filter param BatteryService chỉ gồm:** `action` (dropdown từ enum action code — closed-set, KHÔNG gõ tay vì BE exact-match case-sensitive → sai hoa-thường = 400), `batteryId`/`alertId`, `from`/`to`, `pageNumber`/`pageSize`. **KHÔNG có filter `severity`/`category`** (2 endpoint này không nhận — api-battery.md:2763-2772) |
| `src/features/admin/pages/BatteryAuditLogsPage.tsx` | create | 2 tab Battery / Alert |
| `src/router/index.tsx` | modify | route `battery-audit-logs` dưới `/admin` |
| `src/shared/components/layout/AppLayout.tsx` | modify | sidebar nav "Battery Audit" (admin section) |

## Enums
| Enum | File nguồn | Giá trị |
|------|-----------|---------|
| `ElectricalTopologyEnum` | `shared/enums/cascade.enum.ts` | Independent=1, SeriesString=2, ParallelBank=3, SeriesParallel=4 |
| `CascadeRiskLevel` | `shared/enums/cascade.enum.ts` | Low=1, Medium=2, High=3 |
| `BatteryAuditActionCode` | `admin/enums/battery-audit.enum.ts` | BatteryCreated, BatteryUpdated, BatteryDeleted, AssignedToCustomer, UnassignedFromCustomer, ThresholdConfigChanged, SensorReadingEdited, StatusChanged, MaintenanceLogged, CalibrationApplied (api-battery.md:2774) |
| `AlertAuditActionCode` | `admin/enums/battery-audit.enum.ts` | AlertAcknowledged, AlertSuppressed, AlertRuleChanged, AlertSeverityOverridden, AlertManuallyResolved (api-battery.md:2790) |
| `AuditSeverity` | `shared/enums/audit.enum.ts` | Info, Warning, Critical, Security — **cross-service** (api-audit.md §67) |
| `AuditActionCategory` | `shared/enums/audit.enum.ts` | 9 category cố định: DataModification, Configuration, Security, … — **cross-service** (api-audit.md §76) |

> ⚠️ BE serialize enum **dạng string name** trong response (`"level": "High"`, `"electricalTopology": "SeriesString"`) nhưng POST topology nhận **int** (`{ "electricalTopology": 2 }`). Enum `as const` map name→int để build select + gửi int; DTO field `level`/`electricalTopology` typed bằng `keyof typeof Enum` (string name).
> 📌 `AuditSeverity`/`AuditActionCategory` đặt ở `shared/` vì doc xác nhận **dùng chung cross-service** (api-battery.md:2735 trỏ sang api-audit.md). Action code (battery/alert) là battery-specific nên giữ ở admin feature enum.
> ⚠️ **`AuditSeverity`/`AuditActionCategory` ở 3b CHỈ dùng để DISPLAY** (render + tô màu cột `severity`/`actionCategory` từ response `BatteryAuditLogDto`), **KHÔNG phải filter param** — 2 endpoint BatteryService (`/battery/audit-logs`, `/alerts/audit-logs`) chỉ filter `action`/`batteryId`|`alertId`/`from`/`to`/`page` (api-battery.md:2763-2772). Đừng thêm dropdown filter severity/category (endpoint không nhận → vô tác dụng/400). *(Endpoint aggregator `/api/admin/audit/search` mới có filter severity/category — ngoài scope issue này.)*
> ⚠️ **Closed-set filter phải dùng dropdown, không gõ tay** (api-audit.md:65 — BE đối chiếu exact-match, phân biệt hoa-thường): `action` filter render dropdown từ enum action code; chọn sai hoa-thường = 400.

## Types
```ts
// cascade.types.ts
interface CascadeRiskDto {
  batteryAssetId: string;
  serialNumber: string | null;
  siteId: string | null;             // null nếu asset chưa gán site
  cascadeRiskScore: number;          // 0.0–1.0
  level: keyof typeof CascadeRiskLevel;            // "Low" | "Medium" | "High"
  electricalTopology: keyof typeof ElectricalTopologyEnum; // "Independent" | ...
  cascadeRiskUpdatedAt: string | null;             // null nếu chưa tính
}
interface SiteCascadeRiskSummaryDto {
  siteId: string;
  totalAssets: number;
  highRiskCount: number; mediumRiskCount: number; lowRiskCount: number;
  maxScore: number;
  highRiskAssets: CascadeRiskDto[];  // sort score desc, có thể rỗng
}
interface SetTopologyPayload { electricalTopology: number; } // 1..4

// sensor-stream.types.ts (parity với SSE reading payload §5.3 = 18 field; KHÁC SensorReadingDto REST 8 field)
// ⚠️ SSE LƯỢC field null khỏi JSON → field vắng = null. JSON.parse cho `undefined`, KHÔNG phải `null`.
//    → mọi field nullable parse defensive: `x ?? null`; check bằng `== null` (KHÔNG dùng `=== null`).
//    Zod (nếu validate): `.optional().nullable()` cho field có thể vắng.
interface LiveReadingDto {
  batteryAssetId: string; customerId: string; siteId: string | null; batteryTypeId: string | null;
  time: string; voltage: number; current: number; temperature: number; socPercent: number;
  sohPercent: number | null; cycleCount: number | null; chargingState: number | null;
  internalResistanceMilliohm: number | null; cellVoltageDeltaMv: number | null;
  bmsErrorCode: string | null; sourceDeviceId: string | null; sourceType: number;
  sensorSourceCode: string | null; // "primary"|"redundant"|"external-temp" (null≈primary) — RedisTelemetryStream.cs:32-72
}
// scopeType ∈ "asset"|"customer"|"site"|"type"|"all"|"site:none" — TelemetryScope.cs Label (40-46)
interface BatterySummaryDto { scopeType: string; items: LiveReadingDto[]; }
type SensorStreamScope = `asset:${string}` | `site:${string}`;
// status "live" = đã nhận reading/summary; "open-idle" = kết nối OK nhưng mới chỉ có ping (Realtime:Enabled=false / chưa có data) — coi là hợp lệ
type SensorStreamState = { status: "connecting" | "open-idle" | "live" | "error" | "closed"; reading?: LiveReadingDto; items?: LiveReadingDto[]; lastPingAt?: number; };

// battery-audit.types.ts
interface BatteryAuditLogDto {
  id: string; eventId: string; actionCode: string; actionCategory: string; severity: string;
  targetId: string | null; targetDisplay: string | null; actorAccountId: string | null;
  isSuccess: boolean; reason: string | null; occurredAt: string;
}
interface BatteryAuditLogParams { action?: string; batteryId?: string; from?: string; to?: string; pageNumber?: number; pageSize?: number; }
interface AlertAuditLogParams { action?: string; alertId?: string; from?: string; to?: string; pageNumber?: number; pageSize?: number; }
```

## Schema (Zod)
```ts
// topology.schema.ts
electricalTopology: z.number().int().min(1).max(4)   // hoặc z.nativeEnum(ElectricalTopologyEnum)
```

## Approach
- **3a**: service → TanStack Query hook (cascade-risk staleTime mặc định; BE refresh 5 phút nên không cần refetchInterval gắt). `useSetTopology` mutation → `onSuccess` invalidate `cascadeRisk(id)` + toast; `onError` → `handleErrorApi({ error })`. `CascadeRiskCard` hiện score + level badge màu (Low/Med/High), nút "Set topology" gate bằng `checkRole(user,'ADMIN')`. Site panel dùng `CascadeRiskSummary` presentational nhận data từ hook mỗi feature.
- **3b**: 2 query hook độc lập (battery/alert), key gồm params để cache theo filter. `BatteryAuditLogsPage` dùng `useState` cho tab active + filter state; `AuditLogFilterBar` đẩy params lên (filter `action` = dropdown closed-set, KHÔNG free-text). Pagination kiểu pageNumber (BE trả `PaginationResponse`). `severity`/`actionCategory` chỉ render badge có màu trong `BatteryAuditLogTable` (display-only, không filter).
- **3c (transport = native `EventSource`, KHÔNG thêm package)**: `shared/lib/sse.ts` mở `new EventSource(`${VITE_API_BASE_URL}${STREAM}?scope=…&access_token=${Cookies.get('accessToken')}`)` — base = `VITE_API_BASE_URL` (REST gateway, giống axios; **không** dùng `VITE_WS_URL` — cái đó chỉ cho SignalR hub). `addEventListener('reading'|'summary'|'ping')`, parse JSON `data` defensive (field vắng = null). `useSensorStream(scope)` quản `SensorStreamState` + `close()` trong cleanup; scope đổi → đóng & mở lại. Không qua axios. **Asset stream: chỉ nhận `reading` có `sensorSourceCode` ∈ {`primary`, null} làm `state.reading` chính** (bỏ qua redundant/external-temp cho headline). Summary: BE đã coalesce primary, FE render thẳng `items`.
- **3c seed (reconnect không replay)**: asset card on-mount + sau mỗi (re)connect gọi `sensorReadingService.getLatest(assetId)` (REST `/latest`, type **`SensorReadingDto` 8-field sẵn có** — KHÔNG ép vào `LiveReadingDto`) để hiện giá trị ban đầu, rồi SSE `reading` đắp tiếp. Site summary panel KHÔNG seed (chờ tick `summary` ~4s).
- **3c error (native EventSource)**: không đọc được HTTP status/body khi lỗi → chỉ phân biệt connected/disconnected. `onerror` → state `error`, badge "Mất kết nối"; EventSource tự reconnect (vẫn expose `close()`). Lỗi trước khi mở (403/400 scope sai) cũng chỉ thấy `error` chung — chấp nhận theo §8 (không cần phân biệt 403 vs mạng trong scope này).
- **Routing/nav**: thêm route `/admin/battery-audit-logs` + 1 nav item admin trong `AppLayout.tsx`.

## Edge Cases
- Enum string-in-response vs int-in-request (xem cảnh báo ở Enums) — map cẩn thận khi gửi POST topology.
- `siteId`/`serialNumber`/`cascadeRiskUpdatedAt` null → hiện "—" / "Chưa tính".
- Site rỗng: `maxScore=0`, `highRiskAssets=[]` → empty state.
- **SSE null-omitted (§5.3)**: field null bị lược khỏi JSON → `JSON.parse` cho `undefined`. Parse `?? null`, check `== null`, KHÔNG `=== null`. Áp dụng mọi field nullable của `LiveReadingDto` (`sohPercent`, `chargingState`, `bmsErrorCode`, `siteId`, …).
- **SSE chỉ có `ping` (Realtime:Enabled=false / chưa có data) là HỢP LỆ (§5/§9.2)**: state `open-idle`, badge "Đã kết nối — chưa có dữ liệu", KHÔNG treo loading vô hạn.
- **Reconnect không replay (§3/§10)**: sau reconnect có khoảng trống data → asset seed lại bằng `/latest`; site chờ tick summary kế. `ping` mỗi 30s chỉ giữ kết nối, không update data.
- **SSE error (native EventSource, §8)**: chỉ phân biệt connected/disconnected (không đọc được status/body). 403/400 trước khi mở cũng chỉ ra `error` chung. Token hết hạn giữa stream → BE đóng → `error` (không có refresh-queue cho SSE trong scope này).
- **Multi-source 1 pin (§5.4) — QUAN TRỌNG cho event `reading`**: simulator gửi 3 source/pin/tick lên CÙNG asset channel; `RedisTelemetryStream` forward **MỌI** message thành event `reading` (single-asset KHÔNG coalesce — chỉ `summary` mới ưu tiên primary). → asset card sẽ nhận reading **một phần**: `redundant` chỉ có `voltage`+`current`; `external-temp` chỉ có `temperature` (field còn lại bị lược = null). FE **chỉ cập nhật số liệu chính từ reading `primary` (hoặc `sensorSourceCode == null`)**; bỏ qua redundant/external-temp cho headline (có thể show V/I redundant + temp external như dòng "đối chiếu" nếu muốn). KHÔNG render mù mỗi reading → tránh nhấp nháy/mất field.
- Cleanup bắt buộc: unmount/đổi scope phải `close()` để không rò kết nối.
- REST 401/403 (cascade/audit, qua axios) → toast; 404 (asset/site không tồn tại) → empty/not-found state.
- Cascade-risk (asset) tuy là **All roles** (api-battery.md:2449), nhưng issue này **chỉ mount** card ở Admin Asset detail (Manager chỉ xem site summary). Phạm vi UI hẹp hơn auth là chủ ý — không phải lỗi quyền.
- Audit filter `from > to`: chặn ở UI (date range) trước khi gọi; `pageSize` clamp ≤ 100.

## Acceptance Criteria
- [ ] Asset detail (Admin) hiện cascade risk card (score + level + topology + updatedAt); Admin set topology → recompute phản ánh ngay, toast thành công.
- [ ] Site detail (Admin **và** Manager) hiện heat map summary (count Low/Med/High, maxScore, top high-risk).
- [ ] Trang `/admin/battery-audit-logs` có 2 tab Battery/Alert, lọc theo action/target/date + phân trang, có nav sidebar (Admin only).
- [ ] Live telemetry: asset detail nhận event `reading`, site detail nhận event `summary`; badge trạng thái kết nối; đóng kết nối khi rời trang.
- [ ] `npx tsc --noEmit` sạch + `npx eslint . --max-warnings=0` 0 warning + `npm run build` pass.
- [ ] Không cross-feature import (admin↔manager); type/enum dùng chung đặt ở `shared/`.

## Steps
- [ ] Bước 1 — Types/Enums: `shared/enums/cascade.enum.ts`, `shared/enums/audit.enum.ts` (AuditSeverity/Category cross-service), `shared/types/cascade.types.ts`, `admin/enums/battery-audit.enum.ts`, `admin/types/battery-audit.types.ts`; thêm `endpoints.ts` (cascade/audit) + `queryKeys.ts`. **`sensor-stream.types.ts`: reuse GH-114, chỉ thêm `BatterySummaryDto`+`items?`.**
- [ ] Bước 2 — Services: `admin/cascade.service.ts`, `manager/cascade.service.ts`, `admin/battery-audit-logs.service.ts`. **`shared/lib/sse.ts`: reuse GH-114 (không tạo lại).**
- [ ] Bước 3 — Hooks: `useCascadeRisk`, `useSiteCascadeSummary` (admin+manager), `useSetTopology`, `useBatteryAuditLogs`, `useAlertAuditLogs`. **`useSensorStream`: reuse GH-114, thêm nhánh site `summary`.**
- [ ] Bước 4 — Components + Pages: shared presentational `SiteLiveTelemetryPanel`, `CascadeRiskSummary` (**`LiveTelemetryCard`: reuse GH-114**); admin `CascadeRiskCard`, `SetTopologyDialog`, `topology.schema`, `BatteryAuditLogTable`, `AuditLogFilterBar`, `BatteryAuditLogsPage`; mount vào Asset/Site detail (admin+manager).
- [ ] Bước 5 — Wire router (`/admin/battery-audit-logs`) + sidebar nav (`AppLayout.tsx`).
- [ ] Bước 6 — `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS.

## Nguồn & xác minh (source-of-truth)
| Phần | Nguồn xác minh | Trạng thái |
|------|----------------|-----------|
| 3a Cascade (3 ep) | `docs/api-battery.md` §Nhóm 12 (2433-2540) + enum (222-241) + bảng (2718-2720) | ✅ Verify được bằng doc — field-level đầy đủ |
| 3b Audit (2 ep) | `docs/api-battery.md` §Audit (2733-2794); Severity/Category: `docs/api-audit.md` §67/§76 | ✅ Verify được bằng doc |
| 3c SSE (1 ep) | ✅ **`frontend/docs/battery-realtime-description.md`** (FE-facing contract, đầy đủ: §3 connect, §4-5 scope/event/payload, §6 RBAC, §7 REST seed, §8 error, §9-10 setup/checklist). Cross-check BE source: `SensorTelemetryStreamController.cs`, `RedisTelemetryStream.cs`, `LiveReadingDto.cs` | ✅ Verify được bằng doc FE (+ BE source khớp) |

**Ghi chú nguồn 3c (đã đọc codebase thật BE + iot_simulator):**
- 3c **CÓ doc chính chủ** trong repo FE (`docs/battery-realtime-description.md`) — không phải chỉ BE source. `api-battery.md` (doc REST) không chứa SSE là đúng thiết kế (SSE tách doc riêng). Concern "drift/không verify được" đã đóng.
- **Serialization xác nhận** (`RedisTelemetryPublisher.JsonOptions`): `CamelCase` + `DefaultIgnoreCondition = WhenWritingNull` → field camelCase, **null bị lược** (khớp §5.3:145). camelCase khớp interface FE.
- **iot_simulator (Python) gửi 3 source/pin/tick:** `primary` (BMS, full) · `redundant` (INA226, chỉ V/I) · `external-temp` (DS18B20, chỉ temp). Field thiếu = `None` → omitted. ⇒ event `reading` single-asset nhận reading một phần → FE phải lọc primary (xem Edge Cases).
- **Publisher fan-out** mỗi reading tới channel asset/customer/site(|site:none)/type/all → scope nào cũng subscribe được. Publish sau `SaveChangesAsync`, soft-dependency (lỗi Redis không chặn ingest), no-op khi `Realtime:Enabled=false`.
- **Field count:** §5.3 table = **18 field**; BE `LiveReadingDto.cs` cũng **18 property** → FE dùng 18. (Doc §7.2 ghi "19 field" là **mâu thuẫn nội bộ doc** — nên báo BE sửa thành 18. KHÔNG follow con số 19.)
- **Field null bị lược khỏi JSON SSE** (§5.3:145) → parse `?? null`, check `== null`. **REST `SensorReadingDto` (8 field) ≠ SSE reading (18 field)** (§7.2:197) → seed dùng type REST riêng, không ép `LiveReadingDto`.
- Vẫn nên nhắc BE đồng bộ con số 18/19 giữa §5.3 và §7.2 (cross-team nit, không block FE).

## Câu hỏi đã giải đáp
- **3c stream contract?** Không defer — có **doc FE chính chủ** `frontend/docs/battery-realtime-description.md` (đã đọc đầy đủ). Verify được, không phải drift. Field count = **18** (§5.3 table + BE DTO; doc §7.2 ghi 19 là nit nội bộ).
- **3c transport?** → **native `EventSource`** (không thêm package). Lỗi chỉ phân biệt connected/disconnected (§8 — chấp nhận). Base URL = `VITE_API_BASE_URL` (REST gateway), không phải `VITE_WS_URL`.
- **3c reconnect/seed?** → asset card seed bằng REST `/latest` (type `SensorReadingDto` 8-field riêng) on-mount + sau reconnect; site summary chờ tick kế. Field null bị lược → parse `?? null`, check `== null`. Trạng thái chỉ-`ping` = hợp lệ.
- **AuditSeverity/Category đặt đâu?** → `shared/enums/audit.enum.ts` (cross-service, api-audit.md §67/§76; 9 category: Authentication, Authorization, AccountManagement, DataModification, DataAccess, Configuration, Security, Communication, System). Action code battery/alert giữ ở admin feature.
- **Portal scope?** → **Admin + Manager** (cascade summary + site stream cho cả 2; topology + asset stream + audit chỉ Admin).
- **3b UI?** → Trang riêng `/admin/battery-audit-logs` (2 tab) + sidebar; tách khỏi account audit (`AuditLogsPage`).
- **3a UI?** → Asset detail (card + topology dialog) + Site detail (heat map panel).
