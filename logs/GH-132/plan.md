# Plan — GH-132: [FE] Dashboard/Overview — dùng aggregate server-side thay vì tính client-side (A–H)

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-07-07
- **Issue:** #132 — https://github.com/GSU26SE55/frontend/issues/132
- **Sprint:** Sprint 5 (due 2026-07-25)
- **Dev:** Trần Minh Trí (SE183109)
- **Branch:** `feat/GH-132-dashboard-server-aggregate`

## Mục tiêu
Bỏ toàn bộ tính KPI/count/chart **client-side** (cap 100–200 → đếm thiếu) ở Dashboard (Admin/Manager/Staff) + SLA Monitor + Settings + KB reference, chuyển sang **endpoint aggregate/field server-side** (BE đã sẵn sàng A–H).

## BE contract đã verify (đọc controller + handler + DTO)
| # | Service | Route (auth) | DTO / thay đổi |
|---|---|---|---|
| A | TicketService | `GET /api/tickets/dashboard/stats` (Manager,Admin) | `TicketDashboardStatsDto { total, openCount, sla{met,breached,running,paused,compliancePercent}, countByStatus(14), countByPriority{P1Critical,P2High,P3Normal}, createdTrend7Days:[{date,count}], openCountByStaff:[{staffId,activeCount}] }` |
| B | TicketService | `GET /api/staff/tickets/dashboard/stats` (Staff) | `StaffTicketDashboardStatsDto { openCount, resolvedCount, nearBreachCount, breachedCount, pausedCount, slaMonitoredCount, sla{...}, countByStatus, slaRisk{healthy,near,breached}, createdTrend7Days }` |
| C | BatteryService | `GET /api/sites/dashboard/stats` (Admin,Manager) | `SiteDashboardStatsDto { total, activeCount, totalBatteries, activeBatteries, avgHealth, atRiskCount }` |
| D | AuthService | `GET /api/admin/accounts/stats` (Admin,Manager) | `AccountStatsDto { total, countByRole }` |
| E | TicketService | `GET /api/staff/tickets/me?slaOpen=true&sortBy=slaRemaining` | `MyTicketsAsStaffQuery { SlaOpen:bool?, SortBy:"slaRemaining" }` — param `slaOpen`/`sortBy` ✅ |
| F | AuthService | `GET /api/auth/me` → `AccountDto` | thêm `isGoogleLinked:bool` (không expose googleId) |
| G | TicketService | `POST /api/knowledge-base/references` | `KbArticleSuggestDTO.isInternalOnly`; **HTTP 422 thật** (`KnowledgeBaseReferenceController:53`) khi ProvidedToCustomer + internal → FE bắt qua **error path** (`handleErrorApi` → `HttpError` 422 → toast) |
| H | TicketService | `POST /api/knowledge-base/references` | Resolved cho phép `GeneratedAfterResolve`/`ProvidedToCustomer` (`AddTicketKbReferenceCommandHandler:51-53`) |

> ⚠️ auth/account ở **AuthService** (D/F) — không phải UserService như CLAUDE.md ghi.
> Field-based JSON: BE class PascalCase serialize camelCase (như battery-stats) → FE type camelCase.

## Scope
**Trong scope (full A–H):**
- Battery/alert/incident (Admin/Manager) + Staff unread + §9 — ✅ **ĐÃ LÀM** (Bước 1–7).
- **A** → Admin/Manager ticket KPI, SLA gauge, pipeline, ticket trend, workload.
- **B** → Staff ticket KPI/gauge/donut/trend/SLA-risk + SLA Monitor KPI.
- **C** → Admin/Manager sites (activeSites, avgHealth, atRiskCount).
- **D** → Admin accounts (countByRole donut, total).
- **E** → SLA Monitor filter+sort server-side (bỏ cap 100).
- **F** → Settings Google-linked.
- **G** → KB suggest `isInternalOnly` (ẩn/cảnh báo + handle 422).
- **H** → KB `canAddKb` gate cho after-resolve type ở state Resolved.

**Ngoài scope:**
- Site-health **list per-site** (Admin/Manager) vẫn từ `useSiteList` (C chỉ aggregate) — chỉ KPI từ C.
- Xoá helper `dashboard.utils.ts` chỉ sau khi hết consumer (bước cleanup).

## Files
### Hạ tầng (endpoints + type + service + hook)
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | `TICKETS.DASHBOARD_STATS`, `STAFF_TICKETS.DASHBOARD_STATS`, `SITES.DASHBOARD_STATS` (global), `ADMIN.ACCOUNTS.STATS` |
| `src/shared/types/ticket.types.ts` | modify | `TicketDashboardStatsDto`, `StaffTicketDashboardStatsDto`, `SlaSummaryDto`, `SlaRiskDto`, `DailyCountPointDto`, `StaffOpenCountDto` |
| `src/shared/types/site.types.ts` | modify | `SiteDashboardStatsDto` |
| `src/shared/types/account.types.ts` | modify | `AccountStatsDto` + `AccountDto.isGoogleLinked` (F) |
| `src/shared/types/kb.types.ts` | modify | `KbSuggestItemDTO.isInternalOnly` (G) |
| services + hooks | create/modify | `useTicketDashboardStats` (A), `useStaffTicketDashboardStats` (B), `useSiteDashboardStats` (C), `useAccountStats` (D) — pattern `useBatteryDashboardStats`, staleTime 60s |
| staff tickets service/hook/query type | modify | param `slaOpen`/`sortBy` (E) |

### Consumer
| File | Action | Endpoint |
|------|--------|---------|
| `src/features/admin/pages/DashboardPage.tsx` | modify | A (ticket KPI+SLA gauge), C (activeSites/avgHealth), D (usersByRole/total); gỡ `useAdminTickets`/`useAdminAccountList` + calc; giữ `useSiteList` cho health list |
| `src/features/manager/pages/DashboardPage.tsx` | modify | A (ticket KPI/SLA/pipeline/trend/workload), C (activeSites/atRisk); gỡ `useAdminTicketList` + helper calc; giữ queue + staff list |
| `src/features/staff/pages/DashboardPage.tsx` | modify | B (ticket KPI/gauge/donut/trend/SLA-risk); giữ `useStaffTickets` cho feed "ticket ưu tiên" nếu cần |
| `src/features/staff/pages/SlaMonitorPage.tsx` | modify | B (KPI) + E (list filter+sort server-side) |
| `src/features/auth/pages/AccountSettingsPage.tsx` | modify | F |
| `src/shared/components/common/kb/KbArticleSelector.tsx` | modify | G (ẩn/cảnh báo internal + 422) |
| `src/features/staff/pages/TicketDetailPage.tsx` + `src/features/manager/pages/TicketDetailPage.tsx` | modify | H (canAddKb cho Resolved+after-resolve) |
| `src/shared/utils/dashboard.utils.ts` | modify | cleanup helper hết consumer |

## Approach
- **Hạ tầng:** copy pattern `useBatteryDashboardStats` (hook + service fn) cho A/B/C/D — endpoint + type + service + hook, staleTime 60s (SLA Monitor B: 30s).
- **Data-source swap giữ layout:** repoint biến client-side → field DTO; giữ card/gauge/donut. `countByStatus` map sang pipeline/statusBuckets như FE đang nhóm (KHÔNG gộp `ClosedRejected` vào "Hoàn tất").
- **E:** `useStaffTickets` nhận `slaOpen`/`sortBy`; SLA Monitor bỏ filter+sort client, render items từ server + KPI từ B.
- **G:** thêm `isInternalOnly` vào type; ẩn/disable bài internal khi `ProvidedToCustomer`; lỗi 422 qua `handleErrorApi` (HttpError → toast).
- **H:** `canAddKb` cho phép Resolved với after-resolve type (khớp BE).
- **Loading/error:** `isLoading`/`isError` từng hook; skeleton như hiện tại.

## Edge Cases
- Mỗi stats endpoint lỗi/loading: card liên quan skeleton/empty, không crash; domain khác không ảnh hưởng.
- `countByStatus`/`countByPriority` thiếu key: `?? 0` (BE zero-fill nhưng FE vẫn guard).
- `openCountByStaff` staffId không khớp staff list: bỏ qua/"unknown".
- G: chọn internal + ProvidedToCustomer → cảnh báo/disable trước; nếu vẫn gửi → 422 toast.
- H: gate FE khớp BE (Resolved+after-resolve OK; ClosedPendingRate/Closed chặn).
- compliancePercent=100 khi chưa timer (Met+Breached=0) — không chia 0.

## Acceptance Criteria
- [x] Battery/alert/incident (Admin/Manager) + Staff unread + §9 — verify PASS.
- [ ] Admin: Tickets mở/tổng, SLA gauge (A); Sites/activeSites, avgHealth (C); Người dùng theo vai trò, total (D) — không còn `.filter/.reduce/.length` cho các số này.
- [ ] Manager: ticket KPI, SLA gauge, pipeline (tách ClosedRejected), ticket trend, workload (A); activeSites/atRisk (C).
- [ ] Staff: 4 KPI ticket, SLA gauge, status donut, SLA-risk donut, trend (B).
- [ ] SLA Monitor: list filter+sort server-side (E) không cap 100; KPI từ B.
- [ ] Settings: nút Google hiện "Hủy liên kết" khi `isGoogleLinked` (F).
- [ ] KB: bài `isInternalOnly` cảnh báo/chặn khi ProvidedToCustomer; 422 toast (G); `canAddKb` cho Resolved+after-resolve (H).
- [ ] `dashboard.utils.ts` không dead code.
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS.

## Steps
### ĐÃ LÀM (giữ nguyên)
- [x] Bước 1: `BatteryDistributionPanels.tsx`. — 2026-07-07
- [x] Bước 2: Admin battery/alert/incident/pin → `useBatteryDashboardStats`. — 2026-07-07
- [x] Bước 3: Manager 2 KPI alert. — 2026-07-07
- [x] Bước 4: Staff unread ×2 → `useUnreadCount`. — 2026-07-07
- [x] Bước 5: §9 gỡ + xoá `DashboardStatsSection`. — 2026-07-07
- [x] Bước 6: cleanup `groupAlertsByDay`. — 2026-07-07
- [x] Bước 7: verify tsc/eslint/build PASS. — 2026-07-07

### LÀM TIẾP (A–H)
- [x] Bước 8 (Infra): endpoints.ts (4 path) + `dashboardStats.types.ts` (A/B/C/D DTO) + `AccountDto.isGoogleLinked` + `KbSuggestItemDTO.isInternalOnly` + `dashboardStats.service.ts` + `useDashboardStats.ts` (4 hook) + queryKeys (4 root) + StaffTicketsParams `slaOpen`/`sortBy` (E). — 2026-07-07
- [x] Bước 9 (A+C+D): Admin — ticket KPI/SLA gauge (A), activeSites/avgHealth (C), usersByRole/total (D); gỡ `useAdminTickets`/`useAdminAccountList` + calc; giữ `useSiteList` cho health list. — 2026-07-07
- [x] Bước 10 (A+C): Manager — ticket KPI/SLA/pipeline (tách ClosedRejected)/trend/workload (openCountByStaff) (A), activeSites (C); giữ `useSiteList` cho at-risk list + `useAdminTicketQueue`. — 2026-07-07
- [x] Bước 11 (B): Staff — 4 KPI/gauge/status donut/SLA-risk donut/trend từ B; giữ `useStaffTickets` cho feed ưu tiên. — 2026-07-07
- [x] Bước 12 (B+E): SLA Monitor — KPI từ B + list filter/sort server-side (E, bỏ lọc client). — 2026-07-07
- [x] Bước 13 (F): Settings `isLinked={!!account?.isGoogleLinked}`. — 2026-07-07
- [x] Bước 14 (G+H): "Nội bộ" badge trên suggest (G); 422 đã toast sẵn qua `useAddTicketKbRef.onError`; `canAddKb` cho Resolved + `afterResolveOnly` restrict refType (H) — staff + manager panel + 2 TicketDetailPage. — 2026-07-07
- [x] Bước 15 (cleanup): gỡ `summarizeSla`/`countTicketsByStatus`/`countTicketsByPriority`/`groupTicketsByDay`; **xoá `dashboard.utils.ts`**, tách helper còn dùng thành `site.utils.ts` (siteHealth/healthColor) + `ticket.utils.ts` (isOpenTicket) — đặt tên đúng domain, cập nhật 3 import. — 2026-07-07
- [x] Bước 16 (verify): `tsc --noEmit` sạch + `eslint --max-warnings=0` sạch + `npm run build` PASS. — 2026-07-07

**Ghi chú implement A–H:**
- `KbArticleSummaryDTO` (catalog add-panel) không có `isInternalOnly` → block bài nội bộ dựa vào **BE 422** (đã toast qua `onError`); badge "Nội bộ" chỉ trên suggest list.
- Manager KB panel vốn không gate `canAdd` → chỉ thêm `afterResolveOnly` (không thêm canAdd, giữ hành vi cũ).
- SLA Monitor list vẫn `pageSize:100` nhưng server đã filter `slaOpen` trước → không còn "lọc sau khi cap"; KPI từ B luôn đúng toàn bộ.

## Câu hỏi đã giải đáp / quyết định
1. **A–H có ở BE?** → CÓ, verify 8/8 (grep + đọc handler/DTO/controller). v1–v3 defer sai do tài liệu `overview-endpoint.md` stale.
2. **Split hay full?** → **FULL trong #132** (user chốt: làm hết endpoint mới ở issue này).
3. **Battery incident/pin/anomaly** (đã làm): Open-only · global count · màu tĩnh.
4. **ClosedRejected:** BE `countByStatus` zero-fill → FE tự nhóm, KHÔNG gộp vào "Hoàn tất".
5. **G 422:** HTTP 422 thật → FE error path. **E param** `slaOpen`/`sortBy` đúng.
6. **Site list per-site:** giữ `useSiteList` cho health list, chỉ KPI từ C.

## Ghi chú review đã tiếp thu
- v1: map field theo `DashboardStatsSection` thay vì card thật → sửa.
- v2: bỏ claim "server fix tz"; anomaly màu tĩnh; tách helper thay vì dead code.
- v4: defer A–H sai (tài liệu stale) → verify BE có đủ → mở full scope.
- v6: thêm Service column; verify E param + G HTTP 422; ghi chú AuthService (không phải UserService).
