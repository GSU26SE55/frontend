## BÁO CÁO CODE REVIEW — feat/GH-133-group-c-endpoints — 2026-07-07
### Scope: FE (Web)
### Effort: Deep (25 file, shared-component changes, 5 nhóm endpoint)

### TÓM TẮT
GH-133 wire 8 endpoint Nhóm C (C1 permissions catalog · C2 AI chats · C3 download · C4 override · C5 files-audit). Kiến trúc sạch, tuân thủ service→hook→component, reuse tối đa infra sẵn có. Phát hiện 1 Warning (double-toast ở C4 override hook) — **đã fix trong lúc review**. Sau fix: tsc + eslint + build đều PASS.

### PHÂN TÍCH

🟡 → ✅ **Đã fix** `features/admin/hooks/useAdminChatOverride.ts` — 2 hook override có `onError: handleErrorApi({error})` trong khi dialog (`AdminClosedOverrideDialog`) đã `try/catch + handleErrorApi({error, setError})`. Với `HttpError` → **double toast**; vi phạm rule "KHÔNG dùng onError cho form submit". Fix: bỏ `onError` khỏi cả 2 hook (form catch là handler duy nhất, đúng pattern). BE override endpoint trả `StatusCode(result.StatusCode)` → lỗi business về dạng 4xx → interceptor throw → form catch xử lý đủ.

✅ **Architecture**
- Không có business logic trong component — AI panel/dialog chỉ gọi hook; logic ở service/hook.
- Mọi API qua `services/` → TanStack Query hook (suggest/sentiment/summarize/export/download/override/audit/catalog). Không fetch trực tiếp trong component.
- File đặt đúng chỗ: `shared/` cho dùng ≥2 role (`ChatAiPanel`, `ticket-chat-actions.service`, `useTicketChatActions`, `chat.enum`), `features/admin` cho admin-only (override, file-audit), `features/auth` cho C1.
- **Không cross-feature import** — auth/admin/staff/manager không import lẫn nhau; shared chỉ import shared. `ChatAiPanel` (shared) chỉ import shared.
- Không tạo Axios instance mới. Zustand không bị dùng làm server-state.

✅ **Code Quality**
- Component PascalCase (`ChatAiPanel`, `AdminClosedOverrideDialog`, `FilesAuditLogsPage`).
- Không hardcode URL/token — tất cả qua `ENDPOINTS`. Không `console.log`.
- Loading/error xử lý: `isPending` disable nút + spinner; audit page `isLoading/isError`; download phân biệt 200/202/451; suggest/summarize/sentiment kiểm tra `isSuccess` (Gemini 429).

✅ **Error Handling**
- `queryKey` dùng `QUERY_KEY` factory (`admin.fileAuditLogs.list`, `permissionsCatalog.list`). `invalidateQueries` dùng `QUERY_KEY.tickets.chats`.
- Mutation non-form (AI suggest/sentiment/summarize/export, download) có `onError → handleErrorApi`; download bắt riêng 451.
- Form submit (override dialog) dùng `try/catch + handleErrorApi({error, setError})` — map EntityError xuống field.

✅ **UI/UX**
- Reuse shadcn (`Dialog`, `DropdownMenu`, `Badge`, `Button`, `Form`, `Textarea`) — không tự custom.
- C5 reuse `AuditLogFilterBar` + `BatteryAuditLogTable` + `DataPagination` + row type `BatteryAuditLogDto` (không mirror-copy).

✅ **Auth & Security**
- Route `files-audit-logs` khai báo trong `router/index.tsx`, nằm dưới `RoleRoute allowedRoles={[ADMIN]}` → AppLayout (ADMIN-only, kế thừa như `battery-audit-logs`).
- AI panel gate bằng `aiEnabled` trên page đã role-routed (Staff/Manager/Admin) — khớp `[Authorize(Roles="Staff,Manager,Admin")]` của BE.
- C4 override gate `ticketClosed` + chỉ page Admin truyền handler — khớp BE Admin-only + ticket Closed.
- Không lưu token localStorage; không lộ dữ liệu nhạy cảm.

### RỦI RO & LƯU Ý
- **Branch stacked trên `feat/GH-132` (chưa merge dev):** PR GH-133 nên merge SAU GH-132, hoặc rebase lên dev khi GH-132 merged. Diff review dùng working-tree (không phải `dev...HEAD`) vì lý do này.
- **C1 callable-layer:** `usePermissionsCatalog` chưa có consumer UI (không có màn Manager/Staff cần catalog) — cố ý theo Simplicity First. Không phải dead-code lỗi; sẵn sàng wire khi có consumer.
- **C2 suggest → clipboard** (thay auto-fill composer): tránh cross-cutting 3 form RHF theo role đang bị GH-132 sửa. Auto-fill là follow-up nếu cần.
- **C3 dùng `fileId` làm `{attachmentId}`:** đúng theo BE handler (`a.FileId == request.AttachmentId`).
- **Export PDF 404 (ticket không có chat):** BE trả JSON lỗi nhưng request `responseType:blob` → toast generic (chấp nhận được; interceptor đã parse blob-json cho case 401).
- **Build chunk > 500kB:** cảnh báo advisory sẵn có toàn dự án, không phải lỗi của GH-133.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
(tsc ✓ · eslint --max-warnings=0 ✓ · build ✓; 1 Warning phát hiện & fix trong review)

Tiếp theo: `/kltn-test GH-133`
