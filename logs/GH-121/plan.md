# Plan — GH-121: Ticket Chat System + Audit Aggregator + Reports — data layer

## Metadata
- **Status:** IMPLEMENTING (retro — plan viết sau khi code đã tồn tại trên branch `chat-auditlog-iot_ui`) | **Role:** FE | **Ngày:** 2026-07-01
- **Issue:** #121 — https://github.com/GSU26SE55/frontend/issues/121
- **Branch:** `chat-auditlog-iot_ui` (không theo naming convention `feat/GH-[number]-slug` — branch tạo trước khi có issue)
- **Commit:** `6cdad1d` — feat: add ticket participants and reports hooks, services, and types

> ⚠️ **Ghi chú quy trình:** Plan này được viết SAU khi code đã có mặt (vi phạm rule "TUYỆT ĐỐI KHÔNG CODE khi chưa có plan.md approved" ở `workflow.md`). Ghi lại đây để đồng bộ log folder với thực tế, không phải để hợp thức hoá việc bỏ qua quy trình cho các issue sau.

## Mục tiêu
Bổ sung data layer (endpoints + types + services + TanStack Query hooks) cho 6 mảng, gộp trong 1 branch vì cùng liên quan tới ticket/audit domain:
1. **Ticket Chat system** — migrate `ticket comments` → `ticket chats` (BE migration 20260622)
2. **Ticket Participants**
3. **Ticket Reports** (TicketService, 9 endpoint)
4. **Audit Aggregator** (cross-service, #AUDIT-17)
5. **Ticket audit logs nội bộ TicketService** (#AUDIT-28, Option C)
6. Mở rộng nhỏ: IoT calibration hooks, ambient/environmental incident actions, SLA rule admin

## Scope
**Trong scope:**
- `shared/utils/endpoints.ts`: nhóm `TICKETS.CHAT_*`, `TICKETS.PARTICIPANTS*`, `CHAT_TEMPLATES`, `CHAT_MENTIONS`, `MY_CHATS`, `ADMIN_CHAT_SEARCH`, `ADMIN.TICKET_AUDIT_LOGS`, `ADMIN.CHAT_CLOSED_OVERRIDE/CHAT_RESTORE`, `AUDIT_AGGREGATOR.*`, `REPORTS.SLA_BY_STAFF/SLA_BY_PRIORITY/TICKET_VOLUME/TOP_REOPEN_ISSUES/STAFF_PERFORMANCE/CSAT/RESOLUTION_TIME_HISTOGRAM/CATEGORY_BREAKDOWN/SAGA_FAILED_RATE`
- `shared/utils/queryKeys.ts`: factory tương ứng cho chats/participants/reports/auditAggregate/chatTemplates/chatMentions/myChats/slaRules
- Types: `chat.types.ts`, `chat-mention.types.ts`, `chat-template.types.ts`, `ticket-participant.types.ts`, `ticket-report.types.ts`, `audit-aggregate.types.ts`, `sla.types.ts`
- Services (admin feature): `ticket-chat`, `ticket-participant`, `chat-mention`, `chat-template`, `my-chat`, `admin-chat-search`, `ticket-audit-logs`, `audit-aggregator`, `report`, `sla`, `alert`, `ambient`, `environmental-incident`, `iot-calibration`
- Hooks (admin feature): `useTicketChats`, `useTicketParticipants`, `useTicketReports`, `useChatMentions`, `useChatTemplates`, `useMyChats`, `useAdminChatSearch`, `useAdminTicketAuditLogs`, `useAuditAggregator`, `useSlaRules`, `useAdminAlerts`, `useAmbient`, `useEnvironmentalIncidents`, `useIotCalibrations`
- **Rename xuyên suốt:** `QUERY_KEY.tickets.comments` → `QUERY_KEY.tickets.chats`, `ENDPOINTS.TICKETS.COMMENTS` → `.CHATS`, SignalR hub `/hubs/ticket-comments` → `/hubs/ticket-chats` (manager `ticket.service.ts`/`useManagerTickets.ts`, staff `ticket.service.ts`/`useStaffTicketDetail.ts`/`useStaffTicketMutations.ts`/`TicketDetailPage.tsx`, `shared/hooks/useTicketCommentsRealtime.ts`, `shared/lib/signalr.ts`)

**Ngoài scope (để issue sau):**
- UI pages: reports dashboard, audit aggregator explorer/timeline, chat thread UI (reply/reaction/pin/mention picker), chat template picker, participants management panel
- SSE/realtime cho chat mention badge (dùng polling/staleTime tạm thời qua TanStack Query)
- Test coverage cho các hook/service mới

## Files
Xem diff đầy đủ: `git show 6cdad1d --stat` (51 files, +2087/-87). Nhóm chính:

| Nhóm | Files |
|------|-------|
| Endpoints/QueryKeys | `shared/utils/endpoints.ts`, `shared/utils/queryKeys.ts` |
| Types | `shared/types/{chat,chat-mention,chat-template,ticket-participant,ticket-report,audit-aggregate,sla}.types.ts` |
| Services (admin) | `features/admin/services/{ticket-chat,ticket-participant,chat-mention,chat-template,my-chat,admin-chat-search,ticket-audit-logs,audit-aggregator,report,sla,alert,ambient,environmental-incident,iot-calibration}.service.ts` |
| Hooks (admin) | `features/admin/hooks/{useTicketChats,useTicketParticipants,useTicketReports,useChatMentions,useChatTemplates,useMyChats,useAdminChatSearch,useAdminTicketAuditLogs,useAuditAggregator,useSlaRules,useAdminAlerts,useAmbient,useEnvironmentalIncidents,useIotCalibrations}.ts` |
| Rename comments→chats | `features/manager/{hooks/useManagerTickets.ts,services/ticket.service.ts}`, `features/staff/{hooks/useStaffTicketDetail.ts,hooks/useStaffTicketMutations.ts,pages/TicketDetailPage.tsx,services/ticket.service.ts}`, `shared/hooks/useTicketCommentsRealtime.ts`, `shared/lib/signalr.ts` |
| Khác (không liên quan trực tiếp, đi kèm cùng commit) | `features/admin/components/SensorChart.tsx` (140 dòng — refactor UI có sẵn), `features/admin/pages/BatteryAssetDetailPage.tsx` (tab layout tweak), `config/env.ts`, `shared/components/analytics/AnalyticsFilterBar.tsx` |

## Enums
| Type | File | Ghi chú |
|------|------|---------|
| `TicketParticipantRole` | `shared/types/ticket-participant.types.ts` | Union string literal `"Owner"\|"PrimaryAssignee"\|"Helper"\|"Watcher"` — **chưa theo pattern `as const` enum ở `shared/enums/`** (xem review.md Warning) |
| `ChatTemplateScope` | `shared/types/chat-template.types.ts` | Union string literal `"Personal"\|"Team"\|"Global"` — cùng vấn đề |

## Approach
- Toàn bộ service dùng `axiosInstance` từ `shared/lib/axios.ts` + `ENDPOINTS` — không hardcode URL.
- Hook pattern nhất quán: query dùng `QUERY_KEY` factory, mutation `onSuccess` invalidate qua `KEY`/`QUERY_KEY`, `onError: (error) => handleErrorApi({ error })` (non-form, đúng rule `fe.md`).
- Rename `comments`→`chats` giữ nguyên contract response shape (`TicketCommentDTO`/`PaginationResponse`) — chỉ đổi path/key, không đổi DTO.

## Acceptance Criteria
- [x] `npx tsc --noEmit` sạch
- [x] `npx eslint . --max-warnings=0` — 0 warning
- [x] `npm run build` — pass
- [x] Không cross-feature import (admin/manager/staff độc lập)
- [ ] UI wiring (để issue sau)
- [ ] Test coverage cho hooks/services mới (để `/kltn-test`)

## Steps (retro — đã code xong khi viết plan này)
- [x] Bước 1 — Endpoints + QueryKeys: thêm nhóm chat/participants/reports/audit-aggregator/sla, rename comments→chats — 2026-06-29
- [x] Bước 2 — Types: 7 file mới dưới `shared/types/` — 2026-06-29
- [x] Bước 3 — Services: 14 service mới dưới `features/admin/services/` — 2026-06-29
- [x] Bước 4 — Hooks: 14 hook mới dưới `features/admin/hooks/` — 2026-06-29
- [x] Bước 5 — Rename `comments`→`chats` xuyên suốt manager/staff/shared realtime — 2026-06-29
- [x] Bước 6 — `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS (verify lại 2026-07-01)
- [ ] Bước 7 — Wire UI (issue sau)
