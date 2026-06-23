# BÁO CÁO CODE REVIEW — feat/GH-98-ticket-endpoints-realtime — 2026-06-22

## TÓM TẮT
Umbrella GH-98 (S1–S6: triage-reject, maintenance logs, KB usage-stats, SignalR realtime,
saga debug, health metrics). 42 file (27 modify + 15 create). `tsc` sạch · `eslint .
--max-warnings=0` sạch · `npm run build` ✓. Code bám sát pattern hiện có, contract verify trực
tiếp BE. **PASS.**

## PHÂN TÍCH

### 🔴 Critical
- Không có.

### 🟡 Warning / Đã xử lý
- 🟡→✅ `MyMaintenanceLogsPage` truyền inline query-key array cho `RefreshButton`
  (`[[KEY.staffTickets, "myMaintenanceLogs"]]`) → **đã sửa** dùng factory
  `QUERY_KEY.staffTickets.myMaintenanceLogs()`.
- 🟡 S4 realtime chỉ wire vào **manager** TicketDetailPage. Staff/Admin comment panel vẫn dùng
  comment embedded trong detail (không realtime). Có chủ đích để giữ PR an toàn — hook
  `useTicketCommentsRealtime` + query `useTicketComments` tái dùng được, staff/admin adopt sau.
- 🟡 GET-list maintenance-logs (manager/admin) đã có service+hook nhưng detail page vẫn hiển thị
  log embedded từ ticket detail (không rip-out để giữ surgical). Endpoint đã sẵn sàng dùng.

### ✅ Pass
- **Architecture:** Không có business logic trong component; mọi API call qua `services/` →
  TanStack Query hook. File đặt đúng feature; `signalr.ts`/`useTicketCommentsRealtime` ở `shared/`
  (dùng cross-feature hợp lệ).
- **Feature isolation:** Không có import chéo `features/X → features/Y` (đã grep xác minh). Mọi
  file mới chỉ import từ feature của nó hoặc `shared/`.
- **Query keys:** Tất cả dùng `QUERY_KEY` factory / `KEY` root — không inline string (sau fix).
  Thêm factory cho maintenanceLogs, myMaintenanceLogs, comments, kb.usageStats, admin.sagas,
  ticketHealth.
- **Error handling:** Mutation non-form đều có `onError: handleErrorApi({ error })`; dialog form
  mirror đúng sibling (`RejectDialog`/`MaintenanceLogDialog`). Không tự `toast.error` trong hook.
- **Axios:** Không tạo instance mới — dùng `shared/lib/axios`. Health endpoints trả JSON thuần
  (service KHÔNG unwrap `.data.data` — đúng contract).
- **Auth/Route:** Route mới `/staff/maintenance-logs`, `/admin/sagas` nằm trong group
  `ProtectedRoute > RoleRoute` sẵn có. `SagaDebugPage` gate thêm `checkPermission(P.TICKET_SAGA_VIEW)`;
  nút Reprocess gate `P.TICKET_SAGA_REPROCESS`. Token vẫn cookie-only.
- **UI:** Dùng shadcn primitive (`Dialog/Table/Badge/Skeleton/Select/...`), không custom lại.
- **Convention:** Enum `as const`, types re-export, schema/payload tách 1-1 với BE command
  (`triageRejectSchema`/`TriageRejectPayload` riêng, không reuse `rejectSchema`).
- **No smells:** Không `console.log`, không `localStorage`, không hardcode URL (qua `ENDPOINTS`).

## RỦI RO & LƯU Ý
- **S4 cần BE chạy + `VITE_WS_URL`:** Realtime chỉ hoạt động khi TicketService + hub
  `/hubs/ticket-comments` chạy. `VITE_WS_URL` để **optional + fallback** `VITE_API_BASE_URL`
  (hook chặn ghi `.env`). Khi hub khác origin → set `VITE_WS_URL` trong `.env`. Lỗi connect được
  nuốt → UI không crash (query vẫn chạy, chỉ mất push).
- **`@microsoft/signalr@10.0.0`** thêm mới (pnpm). `package.json` + `pnpm-lock.yaml` thay đổi —
  reviewer cần `pnpm install` sau khi pull.
- **Saga reprocess** sinh `crypto.randomUUID()` cho `Idempotency-Key` (secure context — OK trên
  https/localhost).
- **Build warning** chunk > 500kB là **pre-existing**, không do thay đổi này.
- Chưa kiểm thử runtime (chỉ static gate) — `/kltn-test 98` sẽ chạy tsc+eslint+build lại.

## KẾT LUẬN (S1–S6)
**PASS** — Độ tự tin: **Cao** (static gate xanh toàn bộ; contract BE đã verify; theo đúng pattern repo).
Khuyến nghị chạy `/kltn-test 98` rồi `/kltn-ship 98`.

---

# BỔ SUNG REVIEW — S7: Notification read-state + Bell UI — 2026-06-23

## TÓM TẮT
BE `NotificationService` hoàn thiện → bổ sung FE phần notification còn thiếu. 8 file (4 modify + 4
create). `tsc` sạch · `eslint --max-warnings=0` sạch · `npm run build` ✓. **PASS.**

Phạm vi: wire 3 endpoint read-state (`PATCH /{id}/read`, `POST /read-all`, `GET /unread-count`) +
thay bell stub ở Header bằng dropdown thật (badge unread poll 30s, list 10 noti, click→mark-read +
deep-link, "đánh dấu tất cả đã đọc").

## SignalR? — KHÔNG cần
Verify toàn backend: chỉ 2 hub (`TicketCommentHub`, `SmsGatewayHub`) — **NotificationService không có
hub** (`find *Hub*.cs` rỗng, `grep MapHub` rỗng). Notification web theo cơ chế **pull**: InApp lưu DB →
`GET /api/notifications` + `unread-count`; Push (Expo/FCM) chỉ cho mobile. Polling 30s là đúng thiết kế
BE — khác S4 (comment có hub thật nên dùng SignalR).

## PHÂN TÍCH

### 🔴 Critical
- Không có.

### 🟡 Warning / Lưu ý
- 🟡 `NotificationDto` tồn tại 2 nơi (`staff/types/notification.types.ts` + `shared/types/...`) — giữ
  staff nguyên để **surgical** (bell dùng service shared mới, không refactor staff page). Có thể gộp ở
  issue dọn dẹp sau.
- 🟡 Doc BE `api-notification.md` **stale** (thiếu 3 endpoint read-state) — đã dùng `NotificationsController.cs`
  làm nguồn chuẩn. Đáng đề xuất issue `role: BE` cập nhật doc.

### ✅ Pass
- **Architecture:** Không gọi API trong component — qua `notificationService` → hook TanStack Query.
  Bell ở `shared/components/layout/` (dùng cross-feature, hợp lệ).
- **Query keys:** `KEY.notifications` + factory `list(params)`/`unreadCount()`; mark-read/all invalidate
  `[KEY.notifications]` (bao cả list + badge). Không inline string.
- **Error handling:** `useMarkNotificationRead`/`useMarkAllRead` non-form → `onError: handleErrorApi({ error })`
  toast. Không tự `toast.error` trong hook.
- **Axios/Endpoint:** Dùng `shared/lib/axios` + `ENDPOINTS.NOTIFICATIONS.*`, không hardcode URL.
- **Convention:** Enum `as const` (reuse `notification.enum.ts`, khớp BE gồm 16/17/18), types re-export.
- **Deep-link verified:** cả admin/manager/staff đều có route `tickets/:id` → `/${prefix}/tickets/${id}`
  không 404. Role prefix map qua `UserRole` enum.
- **Efficiency:** list query gate `enabled: open` — chỉ fetch khi mở dropdown, badge dùng query riêng.
- **No smells:** không `console.log`, không `localStorage`, không tạo axios instance mới.

## RỦI RO & LƯU Ý
- Badge cập nhật tối đa trễ 30s (polling) — chấp nhận được, không có server-push để realtime.
- `unread-count` lỗi → badge ẩn, `refetchInterval` tự dừng khi error → bell không crash.
- Chưa kiểm thử runtime với BE thật + seed noti (chỉ static gate).

## KẾT LUẬN (S7)
**PASS** — Độ tự tin: **Cao**. Static gate xanh; contract verify trực tiếp controller; SignalR đã xác
nhận không cần; theo đúng pattern repo.
