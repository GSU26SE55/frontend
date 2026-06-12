# Plan — GH-72: [FE] Alerts (Cảnh báo) — List · Detail · Acknowledge · Resolve

## Metadata
- **Status:** TESTING | **Role:** FE | **Ngày:** 2026-06-12
- **Issue:** #72 — https://github.com/GSU26SE55/frontend/issues/72
- **Sprint:** Sprint 1 (due 2026-05-30)

## Mục tiêu
Tích hợp 4 endpoint battery-anomaly Alerts (`/api/alerts`) vào Web App: hiển thị danh sách
cảnh báo có phân trang + lọc, xem chi tiết, **acknowledge** (Open → Acknowledged) và **resolve**
(→ Resolved). Cung cấp trang Alerts cho cả 3 portal **Admin / Manager / Staff**.

## Scope
**Trong scope:**
- Data layer dùng chung ở `shared/`: enums, types, endpoints, queryKeys, service, hooks.
- Presentational dùng chung ở `shared/components/alerts/`: bảng + filter + dialog chi tiết + badge.
- 3 trang portal mỏng (Admin / Manager / Staff) render component chung + wire route + nav.
- Acknowledge + Resolve qua mutation, invalidate cache, toast.

**Ngoài scope:**
- Auto-tạo / link ticket từ alert (chỉ hiển thị `ticketId` nếu có, link sang ticket detail).
- Realtime push/WebSocket — dùng polling `refetchInterval` cho list.
- Sửa/đổi tên trang notifications cũ `staff/pages/AlertsPage.tsx` (giữ nguyên — out of scope).
- Customer portal (Customer bị chặn login web).

## Endpoints
| Method | Path | Mục đích / Request / Response |
|--------|------|-------------------------------|
| GET | `/api/alerts` | List + filter. Query: `pageNumber, pageSize, batteryAssetId?, severity?, status?, excludeMerged?(true), from?, to?` → `CommonResponse<PaginationResponse<AlertDto>>` |
| GET | `/api/alerts/{id}` | Detail → `CommonResponse<AlertDto>` |
| PATCH | `/api/alerts/{id}/acknowledge` | Open → Acknowledged. No body → `CommonResponse<null>` |
| PATCH | `/api/alerts/{id}/resolve` | → Resolved (Admin/Manager/Staff). No body → `CommonResponse<null>` |

## Enums
> Đặt ở `shared/` vì ≥2 feature dùng (rule fe.md). KHÔNG define inline trong types.

| Enum | File nguồn | Giá trị |
|------|-----------|---------|
| AlertSeverityEnum | `shared/enums/alert.enum.ts` | Info=1, Warning=2, Critical=3 |
| AlertStatusEnum | `shared/enums/alert.enum.ts` | Open=1, Acknowledged=2, Merged=3, Resolved=4 |
| AnomalyTypeEnum | `shared/enums/alert.enum.ts` | 15 giá trị (Overheat=1 … SensorMismatch=15) — theo doc §AnomalyTypeEnum |

## Types
> `shared/types/alert.types.ts` — import enum từ `shared/enums/alert.enum.ts` rồi re-export.

```ts
interface AlertDto {
  id: string; batteryAssetId: string; batterySerialNumber: string;
  anomalyType: AnomalyTypeEnum; severity: AlertSeverityEnum;
  thresholdValue: number; actualValue: number; unit: string;
  detectedAt: string; status: AlertStatusEnum;
  ticketId?: string | null;
  acknowledgedByUserId?: string | null; acknowledgedAt?: string | null;
  resolvedAt?: string | null; dedupWindowEndUtc: string; createdAt: string;
}
interface AlertListParams {
  pageNumber?: number; pageSize?: number; batteryAssetId?: string;
  severity?: AlertSeverityEnum; status?: AlertStatusEnum;
  excludeMerged?: boolean; from?: string; to?: string;
}
```

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/enums/alert.enum.ts` | create | 3 enums `as const` |
| `src/shared/types/alert.types.ts` | create | AlertDto, AlertListParams, re-export enums |
| `src/shared/utils/endpoints.ts` | modify | thêm block `ALERTS` |
| `src/shared/utils/queryKeys.ts` | modify | thêm `KEY.alerts` + `QUERY_KEY.alerts.{list,detail}` |
| `src/shared/services/alert.service.ts` | create | getList, getById, acknowledge, resolve |
| `src/shared/hooks/useAlerts.ts` | create | useAlertList, useAlertDetail, useAcknowledgeAlert, useResolveAlert |
| `src/shared/components/alerts/AlertSeverityBadge.tsx` | create | map severity → badge variant + label |
| `src/shared/components/alerts/AlertStatusBadge.tsx` | create | map status → badge variant + label |
| `src/shared/components/alerts/AlertsView.tsx` | create | filter + table + phân trang + detail dialog + actions (toàn bộ UI dùng chung) |
| `src/features/admin/pages/AlertsPage.tsx` | create | render `<AlertsView />` |
| `src/features/manager/pages/AlertsPage.tsx` | create | render `<AlertsView />` |
| `src/features/staff/pages/BatteryAlertsPage.tsx` | create | render `<AlertsView />` — tên `BatteryAlertsPage` tránh trùng `AlertsPage.tsx` (notifications) đã có |
| `src/router/index.tsx` | modify | `/admin/alerts`, `/manager/alerts`, `/staff/battery-alerts` |
| `src/shared/components/layout/Sidebar.tsx` | modify | thêm menu Alerts cho 3 portal |

## Approach
- **1 data layer dùng chung** (`shared/`): cả 3 portal gọi cùng API → service + hooks + types + enums đặt ở shared, không nhân 3.
- **1 component UI dùng chung** `AlertsView`: filter (severity/status/from-to) + bảng + phân trang + dialog chi tiết với nút Acknowledge/Resolve. 3 trang portal chỉ là wrapper mỏng → tránh triplicate.
- **List query**: `staleTime: 30s` + `refetchInterval: 30s` (queue cảnh báo, gần realtime — theo bảng cache fe.md "Ticket queue 30s").
- **Mutations** acknowledge/resolve dùng `onError: handleErrorApi({ error })` (non-form → toast trực tiếp), `onSuccess` → `invalidateQueries([KEY.alerts])` + toast.
- **excludeMerged mặc định `true`** — FE chỉ thấy alert gốc; không hiển thị Merged trừ khi lọc `status=Merged`.

## Edge Cases
- **Action không hợp lệ theo state machine**: BE trả `409 isSuccess=false` (ack khi đã Resolved/Merged; resolve khi Merged) → `HttpError` → toast message từ BE; nút bị disable theo `status` ở UI để giảm lỗi (ack chỉ khi `Open`; resolve khi `Open`/`Acknowledged`).
- **`404`** alert không tồn tại / đã soft-delete → toast lỗi.
- **`ticketId = null`** → ẩn link "Xem ticket".
- **Empty list** → EmptyState.
- **Nullable fields** (`acknowledgedAt`, `resolvedAt`, `acknowledgedByUserId`) → hiển thị "—".

## Acceptance Criteria
- [ ] 3 portal (Admin/Manager/Staff) đều có route + nav vào trang Alerts, hiển thị list từ `/api/alerts` (phân trang + lọc severity/status/from-to hoạt động).
- [ ] Mở chi tiết 1 alert → hiển thị đầy đủ field từ `AlertDto`.
- [ ] Acknowledge alert `Open` → status đổi `Acknowledged`, list/detail tự cập nhật, toast thành công.
- [ ] Resolve alert → status đổi `Resolved`, list/detail cập nhật, toast thành công.
- [ ] Lỗi `409/404` hiển thị toast với message từ BE; nút disable đúng theo trạng thái.
- [ ] `excludeMerged` mặc định true — Merged không hiện trừ khi lọc.
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS.

## Steps
- [x] Bước 1: Types + Enums (`shared/enums/alert.enum.ts`, `shared/types/alert.types.ts`) — 2026-06-12
- [x] Bước 2: Endpoints + queryKeys (thêm block ALERTS + alerts key) — 2026-06-12
- [x] Bước 3: Service (`shared/services/alert.service.ts`) — 2026-06-12
- [x] Bước 4: Hooks (`shared/hooks/useAlerts.ts`) — 2026-06-12
- [x] Bước 5: Component dùng chung (`AlertsView` + badges) + 3 trang portal — 2026-06-12
- [x] Bước 6: Wire router (3 route) + Sidebar nav 3 portal — 2026-06-12
- [x] Bước 7: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS — 2026-06-12

## Câu hỏi đã giải đáp
- **Portal scope?** → Admin + Manager + Staff (cả 3 portal có trang Alerts). Customer ngoài scope (bị chặn login web).
- **Đặt code ở đâu?** → Data layer + UI dùng chung ở `shared/`; mỗi portal chỉ có page mỏng + route + nav.
- **Trùng tên `AlertsPage.tsx` ở staff?** → File staff hiện tại thực chất là trang **Notifications** (dùng `useStaffNotifications`/`NotificationDto`), KHÔNG phải `/api/alerts`. Giữ nguyên; trang alert pin mới của staff đặt tên `BatteryAlertsPage.tsx`, route `/staff/battery-alerts`.
