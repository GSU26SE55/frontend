# Plan — GH-98: [FE] Bổ sung toàn bộ ticket endpoints còn thiếu + realtime SignalR (Web)

## Metadata
- **Status:** REVIEWING (code xong S1–S6, gate PASS) | **Role:** FE | **Ngày:** 2026-06-22
- **Issue:** #98 — https://github.com/GSU26SE55/frontend/issues/98 (gộp #99–103 đã đóng)
- **Sprint:** Sprint 3 (due 2026-06-27) | **Priority:** P2 (vì gộp realtime)
- **Dev:** Trần Minh Trí (SE183109)

## Mục tiêu
Bổ sung **toàn bộ ticket endpoint Web còn thiếu** (`logs/missing-ticket-endpoints-web.md`) vào FE: endpoints.ts + types + service + hook + UI, gộp trong 1 issue/branch. Gồm 6 nhóm (S1–S6). Tất cả contract đã **verify trực tiếp BE** (`backend/services/TicketService`, 2026-06-22).

> ⚠️ **Cảnh báo phạm vi:** đây là 1 PR rất lớn (6 nhóm, ~12 endpoint + realtime + 1 package mới). Khuyến nghị: **1 branch `feat/GH-98-...`, commit tách theo từng S1..S6** để reviewer theo dõi; chạy `tsc/eslint/build` sau mỗi nhóm. Nếu muốn nhỏ lại vẫn có thể tách PR theo section sau.

## Scope
**Trong scope (6 nhóm):**
- **S1** — `triage-reject` (Manager/Admin): `Open|Escalated → ClosedRejected`
- **S2** — Maintenance logs: GET me (Staff) · GET list (Manager/Admin) · PATCH edit (Staff creator)
- **S3** — KB usage-stats (Manager/Admin)
- **S4** — Realtime comments qua SignalR (thay polling) — cài `@microsoft/signalr`
- **S5** — Admin debug: Saga alert→ticket (list/detail/reprocess)
- **S6** — Ticket health metrics (public) cho Admin dashboard

**Ngoài scope:**
- KHÔNG đụng `RejectDialog`/`rejectSchema`/`RejectPayload` (reject **kết quả** — luồng khác)
- KHÔNG sửa BE (nếu phát hiện thiếu → tách issue `role: BE`)
- KHÔNG đụng upload ảnh comment/log (đã có issue riêng #85)
- POST maintenance-log đã có sẵn (`staff` feature) — không làm lại

---

## S1 — Triage Reject  ✅ (đã verify kỹ — phần gốc của #98)
**BE:** `POST /api/admin/tickets/{id}/triage-reject` · `[Authorize(Roles="Manager,Admin")]` · body `{ reason }` · `TicketActionResponse`. State machine cho phép từ **`Open` VÀ `Escalated`** (`TransitionRuleProvider.cs` 2 rule → ClosedRejected). BE đã fix `oldStatus` event = `ticket.Status`.

| Layer | Action | Chi tiết |
|------|--------|----------|
| endpoint | modify | `ADMIN.TICKETS.TRIAGE_REJECT(id)` |
| type | create | `TriageRejectPayload { reason: string }` (`ticket.types.ts`) — không reuse `RejectPayload` (1-1 với BE command) |
| schema | create | `triageRejectSchema` + `TriageRejectFormValues` (`manager/schemas/ticket.schema.ts`) |
| service | create | `managerTicketService.triageReject(id, payload)` |
| hook | create | `useTriageRejectTicket(id)` — invalidate detail+queue+list, toast success, `onError` toast |
| component | create | `TriageRejectDialog.tsx` (mirror `RejectDialog`, `onSubmit`: await→reset→onClose, không try-catch) |
| page | modify | `manager/pages/TicketDetailPage.tsx`: `DialogType += "triage-reject"`; `canTriageReject = status===Open\|\|status===Escalated`; nút "Từ chối (Triage)" destructive; render dialog |

---

## S2 — Maintenance Logs
**BE verified (`MaintenanceLogsController.cs`):**
- GET `/api/staff/tickets/maintenance-logs/me` · `Roles="Staff"` · → `CommonResponse<StaffMaintenanceLogGroupDTO[]>` (gom theo ticket). DTO: `{ ticketId, ticketCode, ticketTitle, logs: MaintenanceLogDTO[] }`.
- GET `/api/tickets/{ticketId}/maintenance-logs` · `Roles="Manager,Admin"` · → `CommonResponse<MaintenanceLogDTO[]>` (sort CreatedAt ASC).
- PATCH `/api/tickets/{ticketId}/maintenance-logs/{logId}` · `Roles="Staff,Manager,Admin"` nhưng **chỉ Staff tạo log mới sửa được**; **khoá nếu ticket ở `Resolved`/`ClosedPendingRate`/`Closed`**. Body partial (mọi field optional): `logType?, summary?, diagnosisDetails?, actionsTaken?, durationMinutes?, resolutionNote?, partsUsed?, attachments?, beforePhotos?, afterPhotos?, relatedKbArticleIds?`.

> `MaintenanceLogDTO` **đã có** trong `ticket.types.ts` — chỉ thêm `StaffMaintenanceLogGroupDTO` + `MaintenanceLogUpdatePayload`.

| Endpoint | Layer | Action | Chi tiết |
|----------|-------|--------|----------|
| GET me | endpoint | create | `STAFF_TICKETS.MAINTENANCE_LOGS_ME = "/api/staff/tickets/maintenance-logs/me"` |
| | type | create | `StaffMaintenanceLogGroupDTO` (`ticket.types.ts`) |
| | service | create | `staffTicketService.getMyMaintenanceLogs()` |
| | hook | create | `useStaffMaintenanceLogs()` (staff hooks) — staleTime 30s |
| | page | create | Staff page "Lịch sử bảo trì của tôi" + route `/staff/maintenance-logs` + menu item |
| GET list | endpoint | ok | `TICKETS.MAINTENANCE_LOGS(id)` đã có |
| | service | create | `getMaintenanceLogs(ticketId)` (manager + admin ticket.service) |
| | hook | create | `useTicketMaintenanceLogs(ticketId)` |
| | page | modify | Manager/Admin `TicketDetailPage`: section "Nhật ký bảo trì" fetch từ endpoint riêng |
| PATCH | endpoint | create | `TICKETS.MAINTENANCE_LOG_UPDATE(id, logId)` |
| | type | create | `MaintenanceLogUpdatePayload` (partial) |
| | schema | create | `maintenanceLogUpdateSchema` (staff schemas) — field optional, `summary` nếu gửi thì min(1) |
| | service | create | `staffTicketService.updateMaintenanceLog(ticketId, logId, payload)` |
| | hook | create | `useUpdateMaintenanceLog(ticketId)` — invalidate detail + maintenanceLogs |
| | component | create | `EditMaintenanceLogDialog.tsx` (staff) — ẩn nút Edit khi ticket Resolved/Closed/ClosedPendingRate |

## S3 — KB Usage Stats
**BE verified (`KnowledgeBaseController.cs:114`):** GET `/api/knowledge-base/{id}/usage-stats` · `Roles="Manager,Admin"` · → `CommonResponse<KbUsageStatsDTO>`.
DTO: `{ kbArticleId, kbArticleCode, kbArticleTitle, totalReferences, byType: { consultedDuringResolve, providedToCustomer, generatedAfterResolve } }` (map `KbReferenceTypeEnum` 1/2/3).

| Layer | Action | Chi tiết |
|------|--------|----------|
| endpoint | create | `KNOWLEDGE_BASE.USAGE_STATS(id)` |
| type | create | `KbUsageStatsDTO` + `KbUsageByTypeDTO` (`kb.types.ts`) — `KbReferenceTypeEnum` đã có |
| service | modify | `kb.service.ts` (admin): `getUsageStats(id)` |
| hook | modify | `useAdminKb.ts`: `useAdminKbUsageStats(id)` — staleTime 5 phút |
| component | modify | `KbDetailPage.tsx`: section "Thống kê sử dụng" (totalReferences + 3 breakdown) |

## S4 — Realtime Comments (SignalR)  ⚠️ phần lớn nhất
**BE verified (`TicketCommentHub.cs`, `Program.cs:139`):** Hub `/hubs/ticket-comments` (root, KHÔNG prefix `/api`). Auth `[Authorize]` + JWT qua query `access_token` (Program.cs OnMessageReceived). Groups: `ticket:{id}:public` + `ticket:{id}:internal` (Staff/Manager/Admin).
- **Client→Server:** `JoinTicket(ticketIdStr)` · `LeaveTicket(ticketIdStr)` · `Typing(ticketIdStr)`
- **Server→Client:** `UserTyping(ticketIdStr, userId, displayName)` · `CommentAdded(...)` (phát từ comment handler khi POST /comments — payload comment; xác nhận shape lúc implement).

| Layer | Action | Chi tiết |
|------|--------|----------|
| package | **install** | `npm install @microsoft/signalr` (FE Leader đã duyệt; api-ticket.md chỉ định) → `package.json` + lock |
| env | modify | `config/env.ts`: thêm `VITE_WS_URL: z.string().min(1)` vào `envSchema` (biến **riêng**, không tái dùng `VITE_API_BASE_URL`). Cập nhật `.env` + `.env.example`. Giá trị = origin của hub, ví dụ `http://localhost:5xxx` (SignalR `withUrl` tự negotiate; path `/hubs/ticket-comments` ghép trong `signalr.ts`). Biến này đưa vào **commit S4** để không vỡ boot S1–S3. |
| config | create | `shared/lib/signalr.ts` — `createTicketCommentConnection()`: `new HubConnectionBuilder().withUrl(\`${env.VITE_WS_URL}/hubs/ticket-comments\`, { accessTokenFactory: () => Cookies.get("accessToken") }).withAutomaticReconnect().build()` |
| hook | create | `useTicketCommentsRealtime(ticketId)` — start connection, `JoinTicket` on mount / `LeaveTicket`+stop on unmount; on `CommentAdded` → `queryClient.invalidateQueries(comments(ticketId))` hoặc setQueryData; expose `typingUsers` từ `UserTyping`; `sendTyping()` |
| hook | create | `useTicketComments(ticketId)` — tách query comments riêng (hiện comments embed trong ticket detail) để realtime invalidate được |
| service | modify | thêm `getComments(ticketId)` query (đã có ở staff service — chuẩn hoá dùng chung) |
| component | modify | comment panel trong manager/staff/admin `TicketDetailPage`: dùng `useTicketComments` + `useTicketCommentsRealtime`, **bỏ polling** (refetchInterval) ở comment, hiển thị "đang gõ…" |
| queryKey | create | `comments(ticketId)` factory |

> Realtime là phần rủi ro nhất (WS lifecycle, reconnect, auth refresh khi token đổi). Cân nhắc làm **commit/PR cuối cùng** sau khi S1–S3 ổn.

## S5 — Saga Alert→Ticket (Admin debug)
**BE verified (`AdminAlertTicketSagasController.cs`):**
- GET `/api/admin/sagas/alert-ticket` · `Roles="Admin,Manager"` + perm `ticket.saga.view` · query `{ state?, alertId?, batteryAssetId?, customerId?, startedFrom?, startedTo?, isFailed?, pageNumber=1, pageSize=50, isDescending=true }` · → `PaginationResponse<AlertTicketSagaDTO>`.
- GET `/{alertId}` · cùng auth · → `AlertTicketSagaDTO`.
- POST `/{alertId}/reprocess` · `Roles="Admin"` + perm `ticket.saga.reprocess` · **header `Idempotency-Key` bắt buộc** · body rỗng · 202 Accepted (400 nếu thiếu key/saga không Failed · 409 nếu key trùng).
DTO `AlertTicketSagaDTO`: `{ correlationId, currentState, alertId, batteryAssetId?, customerId, assetSerialNumber?, anomalyType, severity, ticketId?, ticketCode?, ticketIsReused, failedAtStage?, failureReason?, failureErrorCode?, failedAt?, retryCount, startedAt, completedAt? }`.

| Layer | Action | Chi tiết |
|------|--------|----------|
| endpoint | create | `ADMIN.SAGAS.ALERT_TICKET_LIST` · `ALERT_TICKET_DETAIL(id)` · `ALERT_TICKET_REPROCESS(id)` |
| type | create | `AlertTicketSagaDTO` + `AlertTicketSagaFilterParams` (`admin/types/saga.types.ts`) |
| service | create | `admin/services/saga.service.ts`: `getList(params)`, `getDetail(alertId)`, `reprocess(alertId)` (set header `Idempotency-Key: crypto.randomUUID()`) |
| hook | create | `useAlertTicketSagas(params)`, `useAlertTicketSagaDetail(id)`, `useReprocessSaga()` (gate `P.TICKET_SAGA_REPROCESS` nếu có) |
| page | create | `admin/pages/SagaDebugPage.tsx` (table + filter + detail drawer + nút Reprocess cho saga Failed) + route `/admin/sagas` + menu (RBAC `checkPermission` `ticket.saga.view`) |

## S6 — Ticket Health Metrics
**BE verified (`HealthController.cs`):** 3 endpoint **public**, trả **JSON thuần (KHÔNG `CommonResponse`)** → service không unwrap `.data`.
- GET `/api/ticket/health` → `{ status, service, timestamp }`
- GET `/api/ticket/health/sync-lag` → `{ status: "Healthy"|"Warning", customerLagSeconds, staffLagSeconds, maxLagSeconds, timestamp }`
- GET `/api/ticket/health/saga` → `{ status: "Healthy"|"Warning"|"Degraded", failedLast24h, stuckOver15min, timestamp }`

| Layer | Action | Chi tiết |
|------|--------|----------|
| endpoint | create | `TICKET_HEALTH.HEALTH` · `SYNC_LAG` · `SAGA` |
| type | create | `TicketHealthDTO`, `SyncLagDTO`, `SagaHealthDTO` (plain) |
| service | create | `admin/services/ticket-health.service.ts` (3 GET, **không** generic CommonResponse) |
| hook | create | `useTicketHealth()` gộp 3 query — `refetchInterval: 30s` |
| component | modify | Admin `DashboardPage`: card "Ticket Service Health" (3 badge màu theo status) |

---

## Edge Cases (chung)
- `reason`/field rỗng → chặn client-side (zod); lọt → BE 400 → toast.
- Race state (PATCH log khi ticket đã Closed · triage-reject khi không còn Open/Escalated) → 403 → toast; nút ẩn theo điều kiện state.
- Saga reprocess thiếu/ trùng `Idempotency-Key` → 400/409 → toast; sinh `crypto.randomUUID()` mỗi lần bấm.
- Health JSON thuần — KHÔNG dùng `CommonResponse<T>`; tự định nghĩa type, không `.data`.
- SignalR: token hết hạn giữa session → `accessTokenFactory` đọc lại cookie mỗi lần reconnect; nếu reconnect fail → fallback giữ query stale (không crash UI).
- Error handling form: theo pattern sibling (zod + hook `onError` toast); non-form (reprocess/delete) → `onError` toast.

## Acceptance Criteria
- [ ] **S1** `TRIAGE_REJECT` + nút "Từ chối (Triage)" hoạt động ở `Open`/`Escalated` → `ClosedRejected`
- [ ] **S2** GET me trả group theo ticket · GET list hiển thị log · PATCH sửa được (Staff creator), bị chặn khi ticket Resolved/Closed
- [ ] **S3** KB usage-stats hiển thị totalReferences + 3 breakdown
- [ ] **S4** `@microsoft/signalr` cài; comment mới push realtime (không cần reload), "đang gõ…" hiển thị; polling comment đã gỡ
- [ ] **S5** Saga list/filter/detail; Reprocess (Admin) gửi `Idempotency-Key`, 202 → toast
- [ ] **S6** Dashboard hiển thị 3 health badge, auto-refresh 30s
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS

## Steps (theo nhóm — mỗi nhóm 1 commit)
- [x] S1: triage-reject — 2026-06-22 (tsc + eslint PASS)
- [x] S2: maintenance logs (GET me + GET list + PATCH) — 2026-06-22 (tsc + eslint PASS)
- [x] S3: KB usage-stats — 2026-06-22 (tsc + eslint PASS)
- [x] S5: saga debug page — 2026-06-22 (tsc + eslint PASS)
- [x] S6: health metrics card — 2026-06-22 (tsc + eslint PASS)
- [x] S4: SignalR realtime — 2026-06-22 (tsc + eslint PASS)
- [x] Cuối: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` toàn bộ → PASS (2026-06-22)

## Đối chiếu Backend
Đã verify trực tiếp code .cs (2026-06-22): `MaintenanceLogsController.cs`, `KnowledgeBaseController.cs:114`, `Admin/AdminAlertTicketSagasController.cs`, `HealthController.cs`, `Realtime/TicketCommentHub.cs` + `Program.cs:139` (MapHub, JWT query auth), `Admin/AdminTicketsController.cs` (triage-reject). Tất cả 12 endpoint + hub **tồn tại đúng** route/auth/DTO như ghi trong từng section.

## Câu hỏi đã giải đáp
- **Gộp issue?** → Gộp **toàn bộ #99–103 vào #98**, 1 issue/1 branch (Leader quyết). #98 retitle umbrella, priority P3→P2.
- **S1 reject từ Escalated?** → Có (BE verified). Gate `Open||Escalated`.
- **S1 tách schema/type?** → Có (`triageRejectSchema`/`TriageRejectPayload`) — convention 1-1.
- **S4 cần package mới?** → Có, `@microsoft/signalr` (đã xác nhận chưa có trong package.json; api-ticket.md chỉ định; Leader duyệt).
- **Saga/Health có trên BE không?** → CÓ (agent đọc code BE xác nhận); FE chưa wire gì — tạo mới hoàn toàn.

## Quyết định đã chốt (Leader)
1. **Thứ tự / tách commit:** S1→S2→S3→S5→S6→S4 (SignalR cuối), mỗi nhóm 1 commit trong branch `feat/GH-98-...`.
2. **S4 env:** ✅ Thêm biến **riêng** `VITE_WS_URL` vào `config/env.ts` (không tái dùng `VITE_API_BASE_URL`) — xem bảng S4.
3. **S5/S6 navigation:** ✅ Thêm menu `/admin/sagas` (Saga debug, gate `ticket.saga.view`) + card "Ticket Service Health" trong Admin Dashboard.
