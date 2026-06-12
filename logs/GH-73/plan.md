# Plan — GH-73: Ambient & Environmental Incidents — data layer + UI (13 endpoints)

## Metadata
- **Status:** TESTING | **Role:** FE | **Ngày:** 2026-06-12
- **Issue:** #73 — https://github.com/GSU26SE55/frontend/issues/73
- **Sprint:** Sprint 1 (due 2026-05-30)
- **Branch base:** `feat/GH-72-alerts-feature` (phụ thuộc #72 — tái dùng `AlertSeverityEnum`, `DataPagination`, `useUrlFilters`, pattern `AlertsView`)

## Mục tiêu
FE integration cho Nhóm 8 (Ambient Readings) + Nhóm 9 (Environmental Incidents) của BatteryService — 13 endpoints (11 endpoint FE gọi, 2 endpoint IoT API Key chỉ tham chiếu DTO). Cung cấp **data layer** (enums/types/services/hooks) + **UI** (incident list/detail + lifecycle actions theo RBAC, ambient threshold config + readings) theo đúng pattern feature Alerts (#72).

## Scope
**Trong scope:**
- Data layer cho 11 endpoint FE gọi: enums, types, services, hooks (TanStack Query), endpoints.ts, queryKeys.ts
- UI Environmental Incidents: shared `EnvironmentalIncidentsView` + page wrapper cho **Admin + Manager + Staff**; actions gate RBAC (ack/resolve = A/M/S, false-alarm = A/M)
- UI Ambient: trang riêng `AmbientConfigPage` (Admin + Manager) — threshold config form (upsert) + ambient latest/history theo site selector
- Wire routes vào `router/index.tsx` (+ Sidebar nav entries)

**Ngoài scope:**
- 2 endpoint IoT ingest (`POST /ambient/readings/batch`, `POST /environmental-incidents`) — API Key, FE không gọi
- KHÔNG sửa `SiteDetailPage`/site feature (tránh đụng scope #38)
- Realtime websocket/push cho incident (chỉ polling)
- Customer-facing page

## Endpoints
| Method | Path | FE gọi? | Mục đích |
|--------|------|---------|----------|
| POST | `/api/ambient/readings/batch` | ❌ IoT | (chỉ tham chiếu DTO) |
| GET | `/api/ambient/readings/history` | ✅ | History theo site (offset pagination, `from`/`to`/`pageNumber`/`pageSize`) |
| GET | `/api/ambient/readings/latest` | ✅ | Reading mới nhất theo `siteId` (404 nếu chưa có) |
| PUT | `/api/ambient/threshold-configs` | ✅ | Upsert threshold config 1 site |
| GET | `/api/ambient/threshold-configs/by-site/{siteId}` | ✅ | Lấy config hiện tại (404 nếu chưa cấu hình) |
| GET | `/api/ambient/threshold-configs` | ✅ | List config (offset pagination) |
| POST | `/api/environmental-incidents` | ❌ IoT | (chỉ tham chiếu DTO) |
| POST | `/api/environmental-incidents/{id}/acknowledge` | ✅ | `Open → Acknowledged` (A/M/S) |
| POST | `/api/environmental-incidents/{id}/resolve` | ✅ | `→ Resolved` + `resolutionNote` (A/M/S) |
| POST | `/api/environmental-incidents/{id}/false-alarm` | ✅ | `→ FalseAlarm` + `falseAlarmReason` (A/M) |
| GET | `/api/environmental-incidents` | ✅ | List (filter site/status/type/from/to + paging) |
| GET | `/api/environmental-incidents/{id}` | ✅ | Detail (lifecycle timestamps) |
| GET | `/api/environmental-incidents/by-site/{siteId}/active` | ✅ | Active (`Open`/`Acknowledged`) theo site |

## Enums
| Enum | File nguồn | Giá trị |
|------|-----------|---------|
| EnvironmentalIncidentTypeEnum | `shared/enums/environmental.enum.ts` (create) | Smoke=1, FireDetected=2, GasLeak=3, Flood=4, OverheatHazard=5, Other=99 |
| EnvironmentalIncidentStatusEnum | `shared/enums/environmental.enum.ts` (create) | Open=1, Acknowledged=2, Resolved=3, FalseAlarm=4 |
| AmbientReadingSourceEnum | `shared/enums/ambient.enum.ts` (create) | IotSensor=1, WeatherApi=2 |
| AlertSeverityEnum | `shared/enums/alert.enum.ts` (reuse #72) | Info=1, Warning=2, Critical=3 |

## Types
```ts
// shared/types/ambient.types.ts
interface AmbientReadingDto { time:string; siteId:string; ambientTemperature:number;
  humidity?:number|null; solarIrradiance?:number|null; source:AmbientReadingSourceEnum; sourceDeviceId?:string|null }
interface AmbientThresholdConfigDto { id:string; siteId:string; highAmbientTempWarning?:number|null;
  highAmbientTempCritical?:number|null; highHumidityWarning?:number|null; highHumidityCritical?:number|null;
  comboTempThreshold?:number|null; comboHumidityThreshold?:number|null; enabled:boolean; createdAt:string }
interface AmbientHistoryParams { siteId:string; from?:string; to?:string; pageNumber?:number; pageSize?:number }
interface AmbientThresholdUpsertPayload { siteId:string; highAmbientTempWarning?:number|null; ...; enabled?:boolean }
interface AmbientThresholdListParams { pageNumber?:number; pageSize?:number }

// shared/types/environmental.types.ts
interface EnvironmentalIncidentDto { id:string; siteId:string; incidentType:EnvironmentalIncidentTypeEnum;
  status:EnvironmentalIncidentStatusEnum; severity:AlertSeverityEnum; reportedBy?:string|null; detectedAt:string;
  acknowledgedAt?:string|null; resolvedAt?:string|null; resolutionNote?:string|null;
  falseAlarmAt?:string|null; falseAlarmReason?:string|null; createdAt:string }
interface IncidentListParams { pageNumber?:number; pageSize?:number; siteId?:string;
  status?:EnvironmentalIncidentStatusEnum; incidentType?:EnvironmentalIncidentTypeEnum; from?:string; to?:string }
interface ResolveIncidentPayload { resolutionNote:string }
interface FalseAlarmIncidentPayload { falseAlarmReason:string }
```

## Schema (Zod)
```ts
// shared/schemas/ambient.schema.ts
ambientThresholdSchema: siteId(uuid), các threshold field number().optional().nullable(),
  refine: highAmbientTempCritical >= highAmbientTempWarning (nếu cả 2 có), tương tự humidity

// shared/schemas/environmental.schema.ts
resolveSchema:    resolutionNote z.string().trim().min(5).max(2000)
falseAlarmSchema: falseAlarmReason z.string().trim().min(5).max(2000)
```

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/ambient.enum.ts` | create | AmbientReadingSourceEnum |
| `src/shared/enums/environmental.enum.ts` | create | IncidentType + IncidentStatus enum |
| `src/shared/types/ambient.types.ts` | create | DTO + params + payload |
| `src/shared/types/environmental.types.ts` | create | DTO + params + payload |
| `src/shared/schemas/ambient.schema.ts` | create | threshold form schema |
| `src/shared/schemas/environmental.schema.ts` | create | resolve + false-alarm schema |
| `src/shared/services/ambient.service.ts` | create | 5 endpoint (history/latest/upsert/by-site/list) |
| `src/shared/services/environmental.service.ts` | create | 6 endpoint (list/detail/active/ack/resolve/false-alarm) |
| `src/shared/hooks/useAmbient.ts` | create | query + mutation hooks |
| `src/shared/hooks/useEnvironmentalIncidents.ts` | create | query + mutation hooks |
| `src/shared/components/environmental/EnvironmentalIncidentsView.tsx` | create | list + filter + detail dialog + actions |
| `src/shared/components/environmental/IncidentStatusBadge.tsx` | create | badge theo status |
| `src/shared/components/environmental/IncidentTypeBadge.tsx` | create | badge theo type |
| `src/shared/components/ambient/AmbientConfigView.tsx` | create | site selector + threshold form + latest/history |
| `src/features/admin/pages/EnvironmentalIncidentsPage.tsx` | create | wrapper |
| `src/features/manager/pages/EnvironmentalIncidentsPage.tsx` | create | wrapper |
| `src/features/staff/pages/EnvironmentalIncidentsPage.tsx` | create | wrapper |
| `src/features/admin/pages/AmbientConfigPage.tsx` | create | wrapper |
| `src/features/manager/pages/AmbientConfigPage.tsx` | create | wrapper |
| `src/shared/utils/endpoints.ts` | modify | thêm `AMBIENT` + `ENVIRONMENTAL_INCIDENTS` |
| `src/shared/utils/queryKeys.ts` | modify | thêm `ambient` + `environmentalIncidents` keys |
| `src/router/index.tsx` | modify | import + routes admin/manager/staff |
| `src/shared/components/layout/Sidebar.tsx` | modify | nav entries (nếu có cấu trúc menu — confirm khi implement) |

## Approach
- **Tái dùng 100% pattern #72:** service object (axios + ENDPOINTS) → hook (`useQuery`/`useMutation` + `handleErrorApi` + `toast`) → shared `*View` component → per-role page wrapper → router.
- **RBAC ở UI:** dùng `checkRole(user, ...)` từ `shared/lib/authz.ts` để ẩn/hiện nút action. `false-alarm` chỉ render cho Admin/Manager; `acknowledge`/`resolve` cho A/M/S. Backend vẫn là source of truth (403).
- **Form (resolve/false-alarm/threshold):** React Hook Form + Zod + `try-catch mutateAsync` + `handleErrorApi({ error, setError })` theo rule fe.md.
- **Cache strategy:** incident list = staleTime 30s + refetchInterval 30s (an toàn, gần realtime như alerts); active-by-site = staleTime 0 + refetchInterval 30s; ambient latest = staleTime 1 phút; ambient history = staleTime 5 phút; threshold config = staleTime 10 phút.
- **Site selector:** Ambient/threshold endpoint key theo `siteId` → dùng hook list sites sẵn có (`features/admin/hooks/useSites` pattern) hoặc gọi `ENDPOINTS.SITES.LIST` qua service hiện có; KHÔNG sửa file site feature, chỉ đọc.

## Edge Cases
- `GET ambient/readings/latest` → **404** khi site chưa có reading: hook không throw toast, View hiển thị empty state "Chưa có dữ liệu".
- `GET threshold-configs/by-site` → **404** (`isSuccess=false`, `data=null`) khi site chưa cấu hình: form ở chế độ "tạo mới" thay vì edit.
- Incident lifecycle **409** (sai state, vd ack incident đã Resolved): `handleErrorApi` → toast message từ BE.
- `severity` không có filter ở BE list → nếu cần lọc severity thì client-side (ghi chú, không bắt buộc).
- `humidity`/`solarIrradiance` nullable → hiển thị "—" khi null.
- Threshold upsert: `Critical < Warning` → BE trả 400; Zod cũng validate cross-field trước khi submit.

## Acceptance Criteria
- [ ] 3 enum mới tạo đúng pattern `as const` + type alias, đặt ở `shared/enums/`
- [ ] Service gọi đúng 11 endpoint qua `ENDPOINTS` (không hardcode URL); 2 endpoint IoT không xuất hiện
- [ ] Hooks dùng `QUERY_KEY` factory; mutation invalidate đúng key + toast; error qua `handleErrorApi`
- [ ] Environmental Incidents: list + filter (site/status/type/date) + detail + action ack/resolve/false-alarm hoạt động, gate RBAC đúng
- [ ] Ambient: threshold form upsert (validate cross-field) + latest/history hiển thị theo site đã chọn; empty state khi 404
- [ ] Routes admin/manager/staff wire xong, điều hướng được
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS

## Steps
- [x] Bước 1: Tạo enums (`ambient.enum.ts`, `environmental.enum.ts`) + types (`ambient.types.ts`, `environmental.types.ts`) + schemas (Zod) — 2026-06-12
- [x] Bước 2: Thêm `AMBIENT` + `ENVIRONMENTAL_INCIDENTS` vào `endpoints.ts` và keys vào `queryKeys.ts` — 2026-06-12
- [x] Bước 3: Tạo services (`ambient.service.ts`, `environmental.service.ts`) — 2026-06-12
- [x] Bước 4: Tạo hooks (`useAmbient.ts`, `useEnvironmentalIncidents.ts`) — 2026-06-12
- [x] Bước 5: Tạo shared components (`EnvironmentalIncidentsView` + badges + `incidentLabels`, `AmbientConfigView`) + page wrappers (5 page) — 2026-06-12
- [x] Bước 6: Wire routes vào `router/index.tsx` (+ Sidebar nav 3 role) — 2026-06-12
- [x] Bước 7: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS — 2026-06-12

## Câu hỏi đã giải đáp
1. **Branch base** → tách từ `feat/GH-72-alerts-feature` để tái dùng `AlertSeverityEnum` + pattern; #73 phụ thuộc #72 merge trước.
2. **Incident UI roles** → Admin + Manager + Staff (3 page wrapper); actions gate RBAC (false-alarm chỉ A/M).
3. **Ambient UI** → trang Admin/Manager riêng (`AmbientConfigPage`) có site selector; KHÔNG sửa `SiteDetailPage` (tránh đụng #38).
