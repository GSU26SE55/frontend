## BÁO CÁO CODE REVIEW — chat-auditlog-iot_ui — 2026-07-01
### Scope: FE (Web) — data layer only (endpoints/types/services/hooks), commit `6cdad1d`
### Effort: Deep (51 files, cross-feature rename comments→chats)

### TÓM TẮT
Data layer cho Ticket Chat/Participants/Reports/Audit Aggregator implement đúng pattern chuẩn dự án (axios instance dùng chung, ENDPOINTS/QUERY_KEY factory, `handleErrorApi`). Không có vi phạm Critical. 2 Warning về convention enum và 1 lưu ý rủi ro về rename cross-cutting cần Manager/Staff xác nhận BE đã deploy khớp. `tsc`/`eslint`/`build` đều PASS (chạy lại 2026-07-01).

### PHÂN TÍCH

🟡 Warning: `src/shared/types/ticket-participant.types.ts:1-5`, `src/shared/types/chat-template.types.ts:1`
— `TicketParticipantRole` và `ChatTemplateScope` định nghĩa trực tiếp bằng union string literal trong file `types/`, thay vì `as const` object trong `shared/enums/` rồi re-export như quy ước `fe.md` ("Types re-export enum — types/*.ts không định nghĩa enum inline"). Không phải TypeScript `enum` nên không vi phạm rule "không dùng enum", nhưng đây là domain enum thực sự (4 role cố định, 3 scope cố định) nên nên tách ra `shared/enums/chat.enum.ts` / `shared/enums/ticket-participant.enum.ts` để nhất quán với `TicketStatusEnum`, `AccountStatusEnum`, ... và để UI sau này build dropdown/switch từ object thay vì hardcode lại chuỗi.
— Fix gợi ý: tạo `export const TicketParticipantRoleEnum = { Owner: "Owner", PrimaryAssignee: "PrimaryAssignee", Helper: "Helper", Watcher: "Watcher" } as const` + type alias, tương tự cho `ChatTemplateScopeEnum`.

🟡 Warning: `src/features/admin/services/ticket-audit-logs.service.ts:5,20`
— Response của `ticketAuditLogsService.getList` được type bằng `BatteryAuditLogDto` (import từ `admin/types/battery-audit.types.ts`), nhưng đây là audit log của **TicketService** (`#AUDIT-28, Option C`), một nguồn dữ liệu khác — comment trong `endpoints.ts:2552` còn ghi rõ "khác với AuditAggregator". Dùng chung DTO đặt tên "Battery" cho response Ticket dễ gây nhầm lẫn/silent-drift nếu 2 shape sau này lệch nhau (BE hiện tại có thể trùng field nhưng không có gì đảm bảo).
— Fix gợi ý: tách 1 type `TicketAuditLogDto` riêng (hoặc đổi tên chung `AuditLogDto` nếu shape thực sự dùng chung ở tầng FE), đặt ở `shared/types/` vì giờ đã dùng cho ≥ 2 nguồn (Battery + Ticket).

### RỦI RO & LƯU Ý
- **Rename `comments` → `chats` là thay đổi cross-cutting, breaking nếu BE chưa deploy migration 20260622**: đổi cả REST path (`/api/tickets/{id}/comments` → `/chats`) lẫn SignalR hub (`/hubs/ticket-comments` → `/hubs/ticket-chats`) trong `manager/services/ticket.service.ts`, `staff/services/ticket.service.ts`, `shared/lib/signalr.ts`, `shared/hooks/useTicketCommentsRealtime.ts`. Nếu BE prod/staging chưa merge migration này, 3 trang ticket detail (staff/manager/admin) sẽ mất realtime comment + 404 khi load comment list. Code có ghi chú nguồn xác nhận BE đã đổi (`endpoints.ts:2500`) — cần confirm lại trước khi merge lên `dev`/deploy, không chỉ tin comment trong code.
- **Chưa có UI tiêu thụ phần lớn hook mới** (chat reply/reaction/pin/mention/template, participants, reports, audit aggregator, SLA rule) — không có route/component nào import các hook này ngoài rename comments→chats ở trang có sẵn. Không phải lỗi, nhưng nghĩa là auth/RBAC gate (ProtectedRoute/RoleRoute) và edge-case UI (loading/error/empty) chưa thể review vì chưa tồn tại — sẽ cần review riêng khi có PR wire UI.
- **Commit gộp thêm vài thay đổi không mô tả trong message**: `SensorChart.tsx` (+140/-… dòng), tab layout `BatteryAssetDetailPage.tsx`, đổi giá trị hằng `ALL_SITES` trong `AnalyticsFilterBar.tsx` (`"__all__"` → `"Tất cả sites"` — cần double-check chỗ này không dùng làm sentinel so sánh với giá trị thật "Tất cả sites" từ BE, nếu có site tên trùng sẽ lệch logic filter). Vi phạm nhẹ "Surgical Changes" (chỉ sửa files trong plan) — không chặn merge vì đã qua build/lint, nhưng nên tách commit riêng ở các PR sau để dễ review/revert.
- Không tìm thấy: `console.log` sót lại, `localStorage` cho token, cross-feature import (admin/manager/staff độc lập), tạo Axios instance mới ngoài `shared/lib/axios.ts`, hardcode URL ngoài `ENDPOINTS`.

### PASS
✅ Toàn bộ service mới dùng `axiosInstance` + `ENDPOINTS` — không hardcode URL
✅ Hook pattern nhất quán: `QUERY_KEY` factory cho query key, `invalidateQueries` qua `KEY`/`QUERY_KEY`, mutation non-form có `onError: (error) => handleErrorApi({ error })`
✅ Không có business logic trong component — 100% qua `services/` → hook
✅ Không cross-feature import (`features/admin` không import từ `manager`/`staff` và ngược lại)
✅ `npx tsc --noEmit` — PASS (chạy lại 2026-07-01)
✅ `npx eslint . --max-warnings=0` — PASS, 0 warning
✅ `npm run build` — PASS

### KẾT LUẬN
**PASS** (data layer) — Độ tự tin: Cao cho phần đã code (types/services/hooks/quality gates), Trung bình cho rủi ro rename comments→chats (phụ thuộc BE deploy state, không tự verify được từ FE repo). 2 Warning không chặn merge nhưng nên fix trước khi UI wire lên các type/enum này ở issue sau, tránh phải sửa lại nhiều nơi.
