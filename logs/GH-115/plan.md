# Plan — GH-115: Battery Dashboard + Reports (Analytics)

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-06-28
- **Issue:** #115 — https://github.com/GSU26SE55/frontend/issues/115
- **Sprint:** Sprint 4 (deadline 2026-07-11)
- **Dev:** Trần Minh Trí (SE183109)

## Mục tiêu
Trang **Analytics** mới cho Admin/Manager: phần trên là dashboard tổng quan (KPI cards +
charts) lấy từ 1 endpoint `dashboard/stats`; phần dưới là 7 báo cáo dạng **tabs**, mỗi báo
cáo có nút **Export** (dropdown chọn CSV/XLSX). Có filter bar chung: chọn **site + date range
(from/to) + granularity**. Dùng chung Recharts + logic export — đặt ở `shared/` để cả Admin
lẫn Manager dùng (feature isolation: `features/admin` không import `features/manager`).

## Scope
**Trong scope:**
- Trang Analytics mới tại route `/admin/analytics` và `/manager/analytics` (1 trang, reports dạng tabs).
- Tích hợp 8 endpoint: 1 `battery/dashboard/stats` + 7 reports.
- Filter bar: Site selector + Date range (from/to) + Granularity (day/week/month).
- Export per-report: 1 nút "Export" + dropdown CSV/XLSX → tải file (blob download).
- Thêm menu "Analytics" vào sidebar Admin + Manager.
- Toàn bộ service/hook/type/component dùng chung đặt ở `shared/`; mỗi feature chỉ có 1 page wrapper mỏng (truyền danh sách site qua prop, dùng `useSiteList` riêng của feature).

**Ngoài scope:**
- KHÔNG sửa/refactor `DashboardPage.tsx` hiện tại của Admin/Manager (giữ nguyên — vẫn có ticket/SLA/account/audit mà `dashboard/stats` không cover).
- KHÔNG thêm Analytics cho Staff/Customer (ambient-trend cho phép Staff/Customer ở BE, nhưng trang này chỉ Admin/Manager — để ticket sau nếu cần).
- KHÔNG tự build CSV/XLSX phía client — BE trả file qua `?format=`, FE chỉ tải blob.
- KHÔNG thêm package mới (Recharts + axios đã đủ).

## Endpoints
> Reports: `?format=csv|xlsx` → file download; không truyền → JSON `CommonResponse<List<...>>`.
> Time-series mặc định 30 ngày nếu bỏ trống `from/to`; `granularity`: day|week|month.

| Method | Path | Query | Response (JSON) |
|--------|------|-------|-----------------|
| GET | `/api/battery/dashboard/stats` | `siteId?` | `CommonResponse<BatteryDashboardStatsDto>` |
| GET | `/api/reports/battery-health-by-type` | `format?` | `CommonResponse<BatteryHealthByTypeRow[]>` |
| GET | `/api/reports/alert-volume` | `from? to? granularity? format?` | `CommonResponse<ReportTimeSeriesPoint[]>` |
| GET | `/api/reports/top-anomalies` | `from? to? limit? format?` | `CommonResponse<TopAnomalyRow[]>` |
| GET | `/api/reports/asset-lifecycle` | `format?` | `CommonResponse<AssetLifecycleRow[]>` |
| GET | `/api/reports/warranty-expiring` | `within? format?` | `CommonResponse<WarrantyExpiringRow[]>` |
| GET | `/api/reports/environmental-incidents` | `from? to? siteId? type? format?` | `CommonResponse<EnvironmentalIncidentRow[]>` |
| GET | `/api/reports/ambient-trend` | `siteId(*) from? to? granularity? format?` | `CommonResponse<AmbientTrendPoint[]>` |

`(*)` = bắt buộc. `dashboard/stats` chỉ là `[Authorize]` (mọi role auth); reports = Admin/Manager.

## Enums
| Enum / Type | File nguồn | Giá trị |
|------|-----------|---------|
| `ReportGranularityEnum` | `shared/enums/report.enum.ts` (create) | `day` \| `week` \| `month` |
| `ReportFormat` | `shared/enums/report.enum.ts` (create) | `csv` \| `xlsx` (BE: giá trị khác → trả JSON; **không hỗ trợ pdf** — cần xác nhận lại BE, mặc định chỉ 2 option) |

> ⚠️ **KHÔNG** khai báo enum FE cho field tên-enum của reports. Reports trả thẳng **string tên enum**
> (`top-anomalies.anomalyType`, `environmental-incidents.incidentType`/`severity`) → type FE là `string`,
> hiển thị trực tiếp. Chỉ `dashboard/stats` mới có cặp `int + *Name`.

## Types (shape) — `shared/types/analytics.types.ts`

**A. Dashboard stats** (`dashboard/stats` — int enum + `*Name` đi kèm, api:1348–1369):
```ts
interface BatteryDashboardStatsDto {
  totalAssets: number; activeAssets: number; offlineAssets: number;
  openAlerts: number; openAlertsCritical: number; openAlertsWarning: number;
  openEnvironmentalIncidents: number; sites: number;
  assetStatusDistribution: { status: number; statusName: string; count: number }[];
  sohDistribution: { healthy: number; normal: number; warning: number; eol: number; unknown: number };
  alertSeverityBreakdown: { critical: number; warning: number; info: number };
  openAlertsByType: { anomalyType: number; anomalyName: string; count: number }[];
  alertTrend7Days: { date: string; critical: number; warning: number; info: number; total: number }[]; // date = DateOnly "yyyy-MM-dd"
  ambientTrend24Hours: { hourUtc: string; avgTemperature: number | null; avgHumidity: number | null; avgSolarIrradiance: number | null }[]; // ISO datetime
  sensorAggregate24Hours: { avgVoltage: number | null; avgCurrent: number | null; avgTemperature: number | null; avgSoc: number | null; avgSoh: number | null; readingsCount: number };
  topAlertingAssets: { batteryAssetId: string; serialNumber: string; alertCount: number; criticalCount: number }[];
  environmentalIncidentsByType: { incidentType: number; incidentName: string; count: number }[];
  chemistryDistribution: { chemistry: number; chemistryName: string; assetCount: number }[];
}
```

**B. Report row types** (reports — field tên-enum là **string**, api:2556–2639):
```ts
interface BatteryHealthByTypeRow { typeId: string; name: string | null; totalAssets: number; withActiveAlerts: number; healthScore: number; }
interface ReportTimeSeriesPoint  { date: string; count: number; }                                   // alert-volume
interface TopAnomalyRow          { anomalyType: string; count: number; criticalCount: number; }      // anomalyType = string tên enum
interface AssetLifecycleRow      { assetId: string; serialNumber: string | null; ageDays: number; cycleCount: number | null; alertsTotal: number; }
interface WarrantyExpiringRow    { assetId: string; serialNumber: string | null; warrantyEndDate: string | null; daysRemaining: number | null; customerId: string; }
interface EnvironmentalIncidentRow { siteId: string; incidentType: string; severity: string; detectedAt: string; resolvedAt: string | null; durationHours: number | null; wasFalseAlarm: boolean; } // incidentType/severity = string tên enum
interface AmbientTrendPoint      { date: string; avgTemp: number; maxTemp: number; minTemp: number; humidityAvg: number | null; irradianceAvg: number | null; } // ⚠️ KHÁC ambientTrend24Hours của stats
```

**C. Filter / query param types:**
```ts
interface AnalyticsFilter { siteId?: string; from?: string; to?: string; granularity?: ReportGranularityEnum; } // state filter bar
// per-report params dẫn xuất từ AnalyticsFilter (alert-volume/ambient-trend: from/to/granularity; top-anomalies: from/to/limit; warranty: within; env-incidents: from/to/siteId/type)
```

> **`env-incidents.type` (int = EnvironmentalIncidentTypeEnum, api:2613):** filter bar Sprint này chỉ có Site+Date+Granularity → **không gửi `type`** (bỏ trống, BE = tất cả loại). Khai optional trong param type nhưng không bind UI; thêm dropdown lọc theo loại để ticket sau.
> **`topAlertingAssets.serialNumber: string` (không null):** asset luôn có serial (api:393) → giữ non-null, dù doc không có bảng field con cho `TopAlertingAssetDto`.

> **Lưu ý format ngày khi vẽ chart:** `alertTrend7Days.date` = DateOnly `"yyyy-MM-dd"`; `ambientTrend24Hours.hourUtc` = ISO datetime UTC; report `ReportTimeSeriesPoint.date` / `AmbientTrendPoint.date` = DateTime UTC. Parse bằng `date-fns` theo từng nguồn, KHÔNG dùng chung 1 formatter.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | Thêm `BATTERY_DASHBOARD.STATS` + nhóm `REPORTS.*` (8 path) |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `KEY.batteryDashboard`, `KEY.reports` + factories |
| `src/shared/enums/report.enum.ts` | create | `ReportGranularityEnum` (day/week/month), `ReportFormat` (csv/xlsx) |
| `src/shared/types/analytics.types.ts` | create | `BatteryDashboardStatsDto` + sub-DTOs, 7 report row types, filter/query param types |
| `src/shared/services/analytics.service.ts` | create | `getDashboardStats`, 7 report getters (JSON), `exportReport` (blob) |
| `src/shared/hooks/useBatteryDashboard.ts` | create | `useBatteryDashboardStats(params)` |
| `src/shared/hooks/useReports.ts` | create | 7 query hook reports + `useExportReport()` (mutation blob) |
| `src/shared/components/analytics/AnalyticsDashboard.tsx` | create | View chính: filter bar + stats section + report tabs. Nhận prop `sites` |
| `src/shared/components/analytics/AnalyticsFilterBar.tsx` | create | Site selector + date range + granularity |
| `src/shared/components/analytics/DashboardStatsSection.tsx` | create | KPI cards + donut/bar/line từ `dashboard/stats` |
| `src/shared/components/analytics/ReportTabs.tsx` | create | Tabs 7 reports — mỗi tab: bảng/chart + export menu |
| `src/shared/components/analytics/ReportTable.tsx` | create | Bảng generic cho report dạng tabular (5 reports) |
| `src/shared/components/analytics/ReportTimeSeriesChart.tsx` | create | Line/Area chart: alert-volume (`count`) + ambient-trend (`avgTemp/maxTemp/minTemp/humidityAvg/irradianceAvg`) — 2 cấu hình series khác nhau |
| `src/shared/components/analytics/ReportExportMenu.tsx` | create | Nút Export + dropdown CSV/XLSX (dùng `useExportReport`) |
| `src/features/admin/pages/AnalyticsPage.tsx` | create | Wrapper mỏng: `useSiteList` (admin) → `<AnalyticsDashboard sites=.. />` |
| `src/features/manager/pages/AnalyticsPage.tsx` | create | Wrapper mỏng: `useSiteList` (manager) → `<AnalyticsDashboard sites=.. />` |
| `src/router/index.tsx` | modify | Thêm route `analytics` cho admin + manager |
| `src/shared/components/layout/AppLayout.tsx` | modify | Thêm nav item "Analytics" cho admin + manager |

## Approach
- **Feature isolation:** toàn bộ logic + UI ở `shared/`. Mỗi feature chỉ 1 page wrapper gọi `useSiteList` của chính nó rồi truyền `sites` (id+name) xuống `<AnalyticsDashboard>` → không cross-import, không cần tạo shared site service.
- **State filter** sống ở `AnalyticsDashboard` (`useState`: `siteId?`, `from?`, `to?`, `granularity`). Mọi hook query nhận params này; đổi filter → query refetch theo queryKey mới.
- **Data flow:** `AnalyticsDashboard` → `useBatteryDashboardStats(params)` cho section trên; mỗi report tab gọi hook report tương ứng (`useReports`), chỉ enable khi tab active (`enabled`) để tránh gọi 7 API cùng lúc. `ambient-trend` cần `siteId` → disable + báo "Chọn site" nếu chưa chọn.
- **Export:** `ReportExportMenu` gọi `useExportReport()` mutation → service `exportReport(report, params, format)` dùng `axiosInstance.get(url, { params: {...filter, format}, responseType: 'blob' })` → tạo objectURL + anchor download (theo pattern `useExportMyData.ts` / `file-storage`). Filename `report-{name}-{yyyymmdd}.{ext}`.
- **Charts:** dùng `ChartContainer`/Recharts có sẵn + tái dùng `DashboardKpi/DashboardDonut` từ `shared/components/common/DashboardPanel`.
  - **`dashboard/stats`:** BE trả sẵn cặp `int + *Name` (`statusName`, `anomalyName`, `chemistryName`, `incidentName`) → hiển thị thẳng `*Name`, không map enum FE.
  - **Reports:** field tên-enum đã là **string** (`top-anomalies.anomalyType`, `env-incidents.incidentType`/`severity`) → render trực tiếp, type FE khai `string` (KHÔNG dùng AnomalyTypeEnum int).
  - **`ReportTimeSeriesChart` cho report `ambient-trend`** vẽ theo `avgTemp`/`maxTemp`/`minTemp` (+ `humidityAvg`/`irradianceAvg`) của `AmbientTrendPoint` — **KHÔNG** dùng `avgTemperature`/`avgHumidity` (đó là field của `dashboard/stats.ambientTrend24Hours`, shape khác hẳn). `alert-volume` vẽ theo `count`.
- **Cache (theo fe.md):** dashboard stats `staleTime 1 phút`; reports `staleTime 5 phút` (dữ liệu báo cáo ít đổi). Không refetchInterval.

## Edge Cases
- **Chưa chọn site cho `ambient-trend`:** hook `enabled: !!siteId`, tab hiển thị empty state "Chọn 1 site để xem xu hướng môi trường".
- **Report rỗng (`[]`):** ReportTable/Chart hiển thị EmptyState, không crash.
- **Field nullable (reports):** `BatteryHealthByTypeRow.name`, `AssetLifecycleRow.serialNumber`/`cycleCount`, `WarrantyExpiringRow.serialNumber`/`warrantyEndDate`/`daysRemaining`, `EnvironmentalIncidentRow.resolvedAt`/`durationHours`, `AmbientTrendPoint.humidityAvg`/`irradianceAvg` có thể null → render `—`.
- **Điểm null trong chart — phân biệt 2 nguồn:**
  - `dashboard/stats.ambientTrend24Hours` (field `avgTemperature`/`avgHumidity`/`avgSolarIrradiance` có thể null) → dùng trong `DashboardStatsSection`, Recharts `connectNulls`.
  - report `ambient-trend` (`AmbientTrendPoint`): `avgTemp`/`maxTemp`/`minTemp` **không null**; chỉ `humidityAvg`/`irradianceAvg` mới null → series ẩm/bức xạ `connectNulls`.
- **Export lỗi:** `responseType: 'blob'` khi BE trả lỗi JSON — axios interceptor đã parse blob→JSON (xem `axios.ts`); `useExportReport` dùng `handleErrorApi({ error })` → toast.
- **Date range không hợp lệ (from > to):** validate ở filter bar, disable nút áp dụng hoặc reset.
- **`AccountStatusEnum`-style 0:** không áp dụng ở đây (không có field status 0).

## Acceptance Criteria
- [ ] `/admin/analytics` và `/manager/analytics` render được, có trong sidebar.
- [ ] Section dashboard hiển thị KPI cards + charts từ `dashboard/stats` (1 call), đổi site filter → cập nhật.
- [ ] 7 reports hiển thị dạng tabs; mỗi tab load đúng data của report đó.
- [ ] Filter Site + Date range + Granularity áp dụng đúng cho các report time-series.
- [ ] `ambient-trend` yêu cầu chọn site; chưa chọn → empty state, không gọi API.
- [ ] Mỗi report có nút Export → chọn CSV/XLSX → tải đúng file từ BE.
- [ ] Field nullable hiển thị `—`, report rỗng hiển thị EmptyState.
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS.
- [ ] Không sửa `DashboardPage.tsx` cũ; không có cross-feature import (ESLint pass).

## Steps
- [x] Bước 1: Types + Enums — `report.enum.ts`, `analytics.types.ts` (DTO stats + 7 row types + param types) — 2026-06-28
- [x] Bước 2: Endpoints + QueryKeys — thêm `BATTERY_DASHBOARD`, `REPORTS` vào `endpoints.ts`; keys vào `queryKeys.ts` — 2026-06-28
- [x] Bước 3: Service — `analytics.service.ts` (8 getter JSON + `exportReport` blob) — 2026-06-28
- [x] Bước 4: Hooks — `useBatteryDashboard.ts`, `useReports.ts` (7 query + export mutation) — 2026-06-28
- [x] Bước 5: Components — `ReportExportMenu`, `ReportTable`, `ReportTimeSeriesChart`, `DashboardStatsSection`, `AnalyticsFilterBar`, `ReportTabs`, `AnalyticsDashboard` — 2026-06-28
- [x] Bước 6: Page wrappers (admin + manager) + route + nav menu (AppLayout) — 2026-06-28
- [x] Bước 7: `tsc -b` + `eslint --max-warnings=0` + `npm run build` → PASS — 2026-06-28

> **Ghi chú implement:** Root `tsconfig.json` là solution file (chỉ references) nên `tsc --noEmit` không check gì — dùng `tsc -b` (chạy trong `npm run build`) làm gate type-check thật. UI kit là **Base UI** (không phải Radix): `DropdownMenuTrigger` dùng `render={<Button/>}` (không `asChild`); `Select.onValueChange` trả `string | null` → coerce về `undefined`.

## Câu hỏi đã giải đáp
1. **Quan hệ với Dashboard hiện có** → **Hướng A**: tạo trang Analytics mới, KHÔNG đụng `DashboardPage.tsx` cũ (cũ aggregate client-side qua 5–7 hook list; mới dùng `dashboard/stats` server-side, battery-focused, thiếu ticket/SLA/account nên không thay thế được).
2. **Bố cục** → 1 trang, 7 reports dạng tabs.
3. **Filter** → Site + Date range (from/to) + Granularity.
4. **Export** → 1 nút "Export" + dropdown chọn CSV/XLSX mỗi report (blob download).
5. **Phạm vi** → Trọn gói trong #115 (dashboard + 7 reports + filter + export).
