# BÁO CÁO CODE REVIEW — feat/GH-160-wire-notification-ticket-endpoints — 2026-08-01

**Effort level:** Deep (30 file, 4 nhóm tính năng, cross-feature: shared + admin + auth + manager)

> **Phạm vi diff:** branch này nhánh từ `fix/kb-ui-cleanup` (chưa merge vào `dev`), nên
> `git diff dev...HEAD` lẫn cả công việc của branch base. Review dựa trên **thay đổi thật của
> GH-160**: `git diff HEAD -- src` (18 file sửa) + 13 file mới chưa track.

## TÓM TẮT

Code bám sát plan và đúng kiến trúc FE của dự án: không gọi API trong component, endpoint tập trung
ở `endpoints.ts`, query key qua factory, enum theo pattern `as const`. Vòng 1 phát hiện **1 Critical**
— form re-prioritize nuốt lỗi validation của BE hoàn toàn (không toast, không field error). Đã sửa
cùng 1 Warning cùng bản chất ở form ma trận. Vòng 2 xanh cả 3 gate.

---

## PHÂN TÍCH — Vòng 1

### 🔴 Critical (1) — ĐÃ SỬA

**`features/manager/components/ticket/ReprioritizeDialog.tsx:62` + `hooks/ticket/useManagerTickets.ts:236`**
— Form submit không có `try-catch` + `setError`; hook `useReprioritizeTicket` xử lý lỗi bằng
`onError: (error) => handleErrorApi({ error })` (không truyền `setError`).

Hệ quả: `axios.ts:192-206` map **400/422 có `listErrors`** thành `EntityError`. Trong
`handleErrorApi`, nhánh `EntityError` mà **thiếu `setError` thì `return` luôn — không toast, không
gì cả**. BE `TicketReprioritizeCommand` validate `priority` + `reason` (≤ 1000 ký tự) và trả field
errors, nên khi Manager submit sai: dialog vẫn mở, nút hết loading, **màn hình không báo gì**.
Kèm theo: `mutateAsync` reject lan ra khỏi `onSubmit` → unhandled promise rejection.

Vi phạm rule `fe.md` — *"Form submit — bắt buộc dùng try-catch + setError"*.

**Fix đã áp dụng:** hook `onError` chỉ còn `invalidateQueries` (giữ ý nghĩa: 409 = state đã đổi ở
nơi khác → refetch, không auto-retry); dialog bọc `try-catch` → `handleErrorApi({ error, setError })`.

> Ghi chú: `EscalateDialog.tsx` / `DeclareIncidentDialog.tsx` hiện có **cùng pattern lỗi** này.
> Là nợ có sẵn, ngoài scope GH-160 — nên mở issue riêng.

---

### 🟡 Warning

**1. `features/auth/components/profile/NotificationCategoryMatrixSection.tsx:111` — ĐÃ SỬA**
Form đã dùng `try-catch` + `setError` đúng rule, nhưng BE trả field `"Items"` / `"Items.Category"` /
`"UserId"` → interceptor hạ camelCase thành `items` / `items.category` / `userId`. `items.category`
không phải path RHF hợp lệ, và form toàn `Switch` nên **không có ô nào để hiện lỗi** → EntityError
vẫn bị nuốt. Đã thêm nhánh `error instanceof EntityError` → toast `errors[0].detail`.

**2. `shared/components/layout/NotificationBell.tsx:57` — GIỮ NGUYÊN (có chủ ý)**
`markOpened` chỉ gọi khi `isUnreadStatus(n.status)`. Notification đã `Read` rồi user bấm deep-link
lần nữa sẽ **không ghi nhận `Opened`**, mất một phần tín hiệu open thật (BE idempotent nên gọi lại
vô hại). Đánh đổi: tránh gọi API thừa mỗi lần click. Nếu sau này cần đo open-rate chính xác thì bỏ
điều kiện `isUnreadStatus` ở nhánh deep-link.

**3. `features/admin/pages/NotificationTemplatesPage.tsx:26` — GIỮ NGUYÊN**
`TYPE_OPTIONS = Object.keys(NotificationTypeEnum)` sinh **34 option phẳng** trong 1 Select, không có
ô tìm kiếm. Dùng được nhưng khó tìm. Chỉ là UX, không chặn ship.

**4. `features/admin/hooks/notification/useNotificationTemplates.ts:24` — GIỮ NGUYÊN (có chủ ý)**
`usePreviewTemplate` cố ý **không có `onError`** để dialog tự bắt và hiển thị lỗi cú pháp Handlebars
inline (toast sẽ trôi mất trong khi admin đang cần sửa template). Caller duy nhất hiện tại đã
`try-catch` đầy đủ.

---

## ✅ PASS

**Architecture**
- Không có API call trong component — đều qua `services/` → hook TanStack Query
- File mới đặt đúng tầng: matrix (dùng cho AccountSettings, có thể tái dùng) ở `shared/`, template
  (chỉ Admin) ở `features/admin/`
- **Không có cross-feature import**: `shared/*` mới không import `@/features/*`; admin chỉ import
  admin; manager chỉ import manager; auth section chỉ import shared
- Không tạo Axios instance mới; Zustand không bị dùng làm server state

**Error handling / Query**
- `queryKey` đều qua `QUERY_KEY` factory; `invalidateQueries` dùng `KEY` root cho broad
  (`KEY.notifications`, `KEY.admin.notificationTemplates`, `KEY.ticketParticipants`)
- Mutation non-form (`useActivateTemplate`, `useTestSendTemplate`, `useMarkNotificationOpened`)
  đều có `onError: (error) => handleErrorApi({ error })`
- `useUpdateNotificationMatrix` dùng `setQueryData` từ response PUT (BE trả ma trận đầy đủ) — tiết
  kiệm 1 vòng refetch, badge "Kế thừa" vẫn cập nhật đúng

**Code quality**
- Không còn `console.log`; enum theo `as const` + type alias, không dùng `enum` native
- Không hardcode URL — toàn bộ 9 endpoint mới nằm trong `endpoints.ts`
- Chuỗi thông báo đưa vào `MESSAGES` / `MANAGER_MESSAGES`
- Loading + error state có ở cả 3 màn mới (skeleton cho bảng template, spinner + nút "Thử lại" cho
  matrix)

**Auth & routing**
- `/admin/notification-templates` nằm trong nhánh `RoleRoute allowedRoles={[UserRole.ADMIN]}`
  (`router/index.tsx:148`) → đúng yêu cầu Admin-only của BE controller
- Không render dữ liệu nhạy cảm; test-send không nhận địa chỉ tự do (BE lấy email từ JWT)

**UI**
- Dùng shadcn có sẵn: Dialog / Form / Select / Switch / Badge / Skeleton / Textarea / Card
- Bảng bọc `overflow-x-auto` (matrix + template) → không vỡ ngang trên mobile

**Bám BE thật (đã đọc source, không đoán theo docs)**
- Enum type dùng số theo `NotificationTypeEnum.cs` (19→33), cố ý bỏ `TicketMerged` (BE khai `= 27`
  trùng `ChatEscalatedToAdmin`)
- `isUnreadStatus()` khớp `GetUnreadCountQueryHandler` (loại cả `Read` lẫn `Opened`)
- Whitelist status re-prioritize khớp `TicketReprioritizeCommandHandler` (Open/Assigned/InProgress/
  Escalated), phát hiện auto-escalate qua `data.status` chứ không qua `warnings` (handler không set)

---

## RỦI RO & LƯU Ý

1. **Chưa chạy với BE thật** — toàn bộ dựa trên đọc source BE + docs. 3 luồng cần test tay ở
   `/kltn-test`: (a) ma trận khi kênh toàn cục tắt → ô phải disable; (b) test-send Email → số lượt
   còn lại + 429 khi vượt 5 lần/giờ; (c) re-prioritize trên ticket có Staff tier thấp → BE tự
   escalate, phải thấy toast khác + assignee đổi.
2. **2 file ngoài scope** (`CascadeRiskSummary.tsx`, `SiteDashboardCard.tsx`) — sửa `any` → `unknown`
   để qua gate lint. Lỗi có sẵn từ branch base, user đã duyệt sửa kèm.
3. **Nợ kỹ thuật cùng loại**: `EscalateDialog` / `DeclareIncidentDialog` / `RejectDialog` vẫn nuốt
   `EntityError` như lỗi Critical ở trên → nên mở issue riêng.
4. **Branch base chưa vào `dev`** — PR của GH-160 sẽ kéo theo commit của `fix/kb-ui-cleanup` nếu
   target `dev`. Cần chọn base branch cho đúng lúc `/kltn-ship`.
5. Badge "Kế thừa" đọc `isCustomized` từ server, không đổi ngay khi user gạt switch mà chưa lưu —
   có chủ ý (phản ánh trạng thái server), nhưng có thể gây thắc mắc khi demo.

---

## PHÂN TÍCH — Vòng 2 (sau khi sửa)

| Gate | Kết quả |
|------|---------|
| `npx tsc --noEmit` | ✅ PASS |
| `npx eslint . --max-warnings=0` | ✅ PASS — 0 error, 0 warning |
| `npm run build` | ✅ PASS — built in 6.35s |

Critical đã đóng; 2 Warning còn lại là đánh đổi có chủ ý, đã ghi rõ lý do.

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Trung bình**

Tự tin cao về mặt tĩnh (kiến trúc, type, lint, build, khớp hợp đồng API đã đọc từ source BE). Hạ
xuống Trung bình vì **chưa có lần chạy nào với BE thật** — đặc biệt là luồng auto-escalate của
re-prioritize và rate-limit 429 của test-send, hai chỗ chỉ verify được bằng chạy thật.

Bước tiếp theo: `/kltn-test 160`.
