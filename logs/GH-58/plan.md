# Plan — GH-58: [FE] Staff — Ticket Management

## Metadata
- **Status:** REVIEWING → **NEEDS REWORK (enum drift)** | **Role:** FE | **Ngày:** 2026-06-05, cập nhật 2026-06-14
- **Issue:** #58 — https://github.com/GSU26SE55/frontend/issues/58
- **Sprint:** Sprint 2 (deadline 2026-06-13)

---

## ⚠️ Contract Reconciliation (2026-06-14, cập nhật 2026-06-15) — đối chiếu với `docs/api-ticket.md` + codebase BE

> **Cập nhật 2026-06-15:** đối chiếu trực tiếp với codebase BE TicketService (sau khi `docs/api-ticket.md` được sửa cho khớp code thực tế). C8 được đính chính (escalationReason nullable, không phải `0`), thêm C9 (resolve required) + C10 (priority nullable).

> Nguồn sự thật: [`docs/api-ticket.md`](../../docs/api-ticket.md). Plan này SHIPPED trước khi spec ticket hoàn chỉnh; bảng `## Enums` bên dưới đã được phác đoán và **bịa nhiều giá trị không tồn tại**. Các điểm dưới đây ưu tiên theo api-ticket.md. Phần thân plan đã được sửa cho khớp; những chỗ cần fix code được đánh dấu.

> **Đã đối chiếu codebase (2026-06-14):** code THỰC TẾ cũng sai giống bảng Enums cũ — [`src/shared/enums/ticket.enum.ts`](../../src/shared/enums/ticket.enum.ts) chứa đầy giá trị bịa. Cần fix code ở ticket riêng (ngoài scope sửa plan này).

### C1 — 🔴 `EscalationReasonEnum` chỉ có 5 giá trị
Spec: `SkillGap=1, PartsRequired=2, SafetyConcern=3, SlaBreach=4, CustomerComplaint=5`.
Bịa (phải bỏ): `StaffRequest, ManagerDecision, AutoEscalated, SlaBreached` (+ `SafetyConcern` lặp 2 lần).
Code hiện sai: `ticket.enum.ts:78-88`.

### C2 — 🔴 `MaintenanceLogTypeEnum` chỉ có 4 giá trị
Spec: `RemoteSupport=1, OnSite=2, PartReplacement=3, Inspection=4`.
Bịa (phải bỏ): `Diagnosis, Repair, Testing, Completion, Note`.
Code hiện sai: `ticket.enum.ts:102-114`.

### C3 — 🔴 `TicketStatusEnum` phải có `Approved`
Spec state machine: New→Open→**Approved**→Assigned→InProgress→Resolved→ClosedPendingRate→Closed. Bảng Enums cũ thiếu `Approved` (phần Types đã đúng). Code `ticket.enum.ts:1-16` đã có `Approved` — OK.

### C4 — 🔴 Response wrapper POST comment / maintenance-log
- `POST /api/tickets/{id}/comments` → **`TicketActionResponse` (201)**, KHÔNG phải `CommonResponse<TicketCommentDTO>`.
- `POST /api/tickets/{id}/maintenance-logs` → **`TicketActionResponse` (201)** (kèm `MaintenanceLogId`), KHÔNG phải `CommonResponse<MaintenanceLogDTO>`.

### C5 — 🟡 GET comments là endpoint phân trang riêng
`GET /api/tickets/{ticketId}/comments` → `CommonResponse<PaginationResponse<TicketCommentDTO>>`, query `page`/`pageSize` (lowercase). KHÔNG lấy từ `TicketDetailDTO.comments`.

### C6 — 🟡 `SlaTimerStatusEnum` chỉ có 4 giá trị
Spec: `Running, Paused, Met, Breached`. Code `ticket.enum.ts:92-98` thừa `Completed` — cần bỏ ở ticket fix code.

### C7 — 🟢 `ActivityActionEnum` int mapping có gap
Spec: không có int 21; `AutoClosed=22, ResolvedByEscalatedStaff=23, TriageApproved=24, Closed=25`. Phải có `Closed`. Code `ticket.enum.ts` thừa các alias `Assigned/Reassigned/Paused/Resumed/LogAdded/PriorityChanged` (tên đúng: `StaffAssigned/StaffReassigned/SlaPaused/SlaResumed/MaintenanceLogged/PriorityAssigned`).

### C8 — 🟢 `escalationReason` guard ~~(cập nhật 2026-06-15 — đối chiếu BE thực tế)~~
~~Field non-nullable (Swagger trả `0` default).~~ **ĐÍNH CHÍNH:** BE thực tế (`TicketDetailDTO.cs:20`) khai `EscalationReasonEnum?` **nullable**, trả `null` (KHÔNG phải `0`) khi chưa escalate. Guard `escalatedAt != null` vẫn an toàn nhưng lý do là vì field optional/null, không phải vì "treat `0`".

### C9 — 🔴 `resolve` body `resolutionSummary` BẮT BUỘC (mới — 2026-06-15)
Spec/BE (`TicketResolveCommand.cs:27`): `resolutionSummary` **required**, không rỗng/whitespace → BE trả **400** nếu thiếu. Plan cũ (schema dòng 188 + endpoint dòng 246) khai `optional()` — **SAI**.
Cần fix code: `resolve.schema.ts` → `resolutionSummary: z.string().min(1)`; ResolveDialog không cho submit rỗng.
> Phụ: BE khi resolve tự đóng mọi maintenance log đang mở (`completedAt=now`); với ticket đã `Escalated` cần Staff đang-assign-sau-escalation, và escalate vì `SkillGap` cần `SkillTier >= 2` (BE trả 403 nếu không đạt).

### C10 — 🔴 `TicketDTO.priority/impactScope/urgencyLevel` NULLABLE (mới — 2026-06-15)
BE (`TicketDTO.cs:15-17`): cả 3 field là `TicketPriorityEnum?` / `ImpactScopeEnum?` / `UrgencyLevelEnum?` — **null khi ticket chưa triage** (state `New`/`Open`). TicketCard/badge phải guard null trước khi render. (GH-58 chủ yếu hiển thị ticket đã assigned nên ít gặp, nhưng vẫn nên guard.)

### Trạng thái implement vs plan (đối chiếu code 2026-06-14)
✅ Đúng: endpoint paths + methods; `hold`/`resolve`/`escalate-request` body; POST comment & maintenance-log đã khai `TicketActionResponse` (C4 fixed); dùng `z.nativeEnum`; `TicketStatusEnum` có `Approved`.
❌ Còn thiếu/sai trong code (fix ở ticket riêng):
- **MAJOR** — `GET /me` query gửi camelCase `pageNumber/pageSize` (`staff-ticket.types.ts`), spec cần PascalCase.
- **MAJOR** — Chưa có method GET comments phân trang (C5); vẫn lấy comments từ `TicketDetailDTO.comments`. `TICKETS.COMMENTS` chưa được GET dùng.
- **MINOR** — `start` không gửi body `{ logType, latitude, longitude }`; thiếu type `StartTicketRequest`.
- ~~`maintenanceLogSchema.logType` thiếu `.default('RemoteSupport')`~~ → **đã xử lý khác**: zod `.default()` làm lệch input/output type của RHF resolver → giữ `z.nativeEnum(...)` và cung cấp default `RemoteSupport` qua `defaultValues` của form (đã có trong `MaintenanceLogDialog`).
- Enum bịa (C1/C2/C6) vẫn nằm trong `ticket.enum.ts` → `z.nativeEnum` cho phép submit giá trị BE không nhận.

## Mục tiêu
Implement toàn bộ UI và logic cho Staff portal quản lý ticket được giao: danh sách ticket (filter + pagination), trang chi tiết với actions theo state machine, activity timeline, comments, và maintenance log.

## Scope
**Trong scope:**
- Ticket list page (`/staff/tickets`) — filter by status, pagination
- Ticket detail page (`/staff/tickets/:id`) — info, SLA countdown, actions
- 5 Staff actions: start, hold (reason), resume, resolve (summary), escalate-request (reason + note)
- Activity timeline (`GET /api/tickets/{id}/activities`)
- Comments section — add comment với `isInternal` toggle
- Maintenance log section — add log với form đầy đủ
- Shared ticket types (`ticket.types.ts`), endpoints, query keys
- Router update cho Staff portal (AppLayout + routes)

**Ngoài scope:**
- Staff dashboard page (issue khác)
- Sidebar navigation cho Staff (UI chỉ cần routes hoạt động)
- File upload cho attachments trong comment/log (chỉ submit `fileId` nếu có — không implement file picker)
- Admin/Manager ticket actions

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/types/ticket.types.ts` | create | Tất cả enums + DTOs (TicketDTO, TicketDetailDTO, SlaTimerDTO, TicketActivityDTO, TicketCommentDTO, MaintenanceLogDTO, TicketActionResponse) |
| `src/shared/utils/endpoints.ts` | modify | Thêm `TICKETS.ACTIVITIES` + nhóm `STAFF_TICKETS` |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `tickets` + `staffTickets` keys |
| `src/features/staff/types/staff-ticket.types.ts` | create | Request types: HoldRequest, ResolveRequest, EscalateRequest, AddCommentRequest, MaintenanceLogRequest |
| `src/features/staff/schemas/staff-ticket.schema.ts` | create | Zod schemas cho 4 forms (hold, resolve, escalate-request, comment, maintenance-log) |
| `src/features/staff/services/ticket.service.ts` | create | Tất cả API calls cho Staff ticket management |
| `src/features/staff/hooks/useStaffTickets.ts` | create | List query — `staleTime: 30s` |
| `src/features/staff/hooks/useStaffTicketDetail.ts` | create | Detail query + activities query — `staleTime: 30s` |
| `src/features/staff/hooks/useStaffTicketMutations.ts` | create | 5 action mutations + addComment + addMaintenanceLog |
| `src/features/staff/components/TicketStatusBadge.tsx` | create | Colored badge per TicketStatusEnum |
| `src/features/staff/components/SlaCountdown.tsx` | create | Client-side countdown từ `dueAt`, progress bar từ `remainingPercent` |
| `src/features/staff/components/TicketCard.tsx` | create | Card hiển thị trong list |
| `src/features/staff/components/HoldDialog.tsx` | create | Modal chọn PauseReasonEnum + optional note |
| `src/features/staff/components/ResolveDialog.tsx` | create | Modal nhập resolutionSummary |
| `src/features/staff/components/EscalateRequestDialog.tsx` | create | Modal chọn EscalationReasonEnum + optional note |
| `src/features/staff/components/TicketTimeline.tsx` | create | Render list TicketActivityDTO |
| `src/features/staff/components/AddCommentForm.tsx` | create | Textarea + isInternal checkbox |
| `src/features/staff/components/MaintenanceLogDialog.tsx` | create | Full form dialog cho maintenance log |
| `src/features/staff/pages/TicketListPage.tsx` | create | List page với filter + pagination |
| `src/features/staff/pages/TicketDetailPage.tsx` | create | Detail page với actions + tabs |
| `src/router/index.tsx` | modify | Replace Staff placeholder với AppLayout + ticket routes |

## Enums

Tất cả enum nằm ở `src/shared/enums/ticket.enum.ts` (không define inline trong types). Types file chỉ re-export.

| Enum | Giá trị liên quan | File |
|------|-------------------|------|
| `TicketStatusEnum` | New, Open, Approved, Assigned, InProgress, WaitingCustomer, WaitingParts, WaitingOnsiteSchedule, Resolved, Escalated, ClosedPendingRate, Closed, ClosedRejected, Incident | `shared/enums/ticket.enum.ts` |
| `PauseReasonEnum` | WaitingCustomer, WaitingParts, WaitingOnsiteSchedule | `shared/enums/ticket.enum.ts` |
| `EscalationReasonEnum` | SkillGap, PartsRequired, SafetyConcern, SlaBreach, CustomerComplaint | `shared/enums/ticket.enum.ts` |
| `MaintenanceLogTypeEnum` | RemoteSupport, OnSite, PartReplacement, Inspection | `shared/enums/ticket.enum.ts` |
| `SlaTimerStatusEnum` | Running, Paused, Met, Breached | `shared/enums/ticket.enum.ts` |
| `ActivityActionEnum` | Created, StatusChanged, PriorityAssigned, StaffAssigned, StaffReassigned, Commented, MaintenanceLogged, AttachmentAdded, SlaPaused, SlaResumed, SlaWarning, SlaBreached, EscalationRequested, Escalated, IncidentDeclared, Resolved, Approved, Rejected, Rated, Reopened, AutoClosed(22), ResolvedByEscalatedStaff(23), TriageApproved(24), Closed(25) — *int 21 bỏ trống* | `shared/enums/ticket.enum.ts` |
| `ActorRoleEnum` | System, Admin, Manager, Staff, Customer | `shared/enums/ticket.enum.ts` |

**Schema pattern:**
```ts
import { PauseReasonEnum, EscalationReasonEnum } from "@/shared/enums/ticket.enum";
reason: z.nativeEnum(PauseReasonEnum)  // ✅ không dùng z.enum([...])
```

## Types (shared/types/ticket.types.ts)

```ts
// Enums
export const TicketStatusEnum = {
  New: 'New', Open: 'Open', Approved: 'Approved', Assigned: 'Assigned',
  InProgress: 'InProgress', WaitingCustomer: 'WaitingCustomer',
  WaitingParts: 'WaitingParts', WaitingOnsiteSchedule: 'WaitingOnsiteSchedule',
  Resolved: 'Resolved', Escalated: 'Escalated', ClosedPendingRate: 'ClosedPendingRate',
  Closed: 'Closed', ClosedRejected: 'ClosedRejected', Incident: 'Incident',
} as const;

export const PauseReasonEnum = {
  WaitingCustomer: 'WaitingCustomer',
  WaitingParts: 'WaitingParts',
  WaitingOnsiteSchedule: 'WaitingOnsiteSchedule',
} as const;

export const EscalationReasonEnum = {
  SkillGap: 'SkillGap', PartsRequired: 'PartsRequired',
  SafetyConcern: 'SafetyConcern', SlaBreach: 'SlaBreach', CustomerComplaint: 'CustomerComplaint',
} as const;

// + TicketPriorityEnum, TicketCategoryEnum, TicketOriginEnum,
//   SlaTimerStatusEnum, MaintenanceLogTypeEnum, ActivityActionEnum, ActorRoleEnum

// DTOs
interface SlaTimerDTO { id, priority, startedAt, dueAt, originalDueAt,
  totalPausedMinutes, warningSentAt?, breachAt?, status, remainingPercent }
interface TicketDTO { id, code, title, category, priority, impactScope, urgencyLevel,
  status, origin, reopenCount, isIncident, createdAt, updatedAt?, slaTimer,
  batteryAssetId?, customerId, assignedStaffId? }
interface TicketDetailDTO extends TicketDTO { description?, resolutionSummary?,
  resolvedAt?, resolvedByStaffId?, approvedAt?, approvedByManagerId?,
  rejectionReason?, closedAt?, rating?, ratingComment?, ratedAt?,
  escalatedAt?, escalationReason?, originAlertId?,
  activities?: TicketActivityDTO[], comments?: TicketCommentDTO[],
  maintenanceLogs?: MaintenanceLogDTO[], attachments?: TicketAttachmentDTO[] }
interface TicketActivityDTO { id, ticketId, actorUserId?, actorRole,
  actorDisplayName?, action, oldValue?, newValue?, reason?, createdAt }
interface TicketCommentDTO { id, ticketId, authorUserId?, authorRole,
  authorDisplayName?, body, isInternal, attachmentFileIds?, createdAt }
interface MaintenanceLogDTO { id, ticketId, staffId, logType, summary?,
  diagnosisDetails?, actionsTaken?, durationMinutes, resolutionNote?,
  startedAt, completedAt?, attachmentFileIds?, beforePhotosFileIds?,
  afterPhotosFileIds?, relatedKbArticleIds?, createdAt }
interface TicketActionDto {
  id: string | null;
  code: string | null;
  status: TicketStatusEnum;
}
interface TicketActionResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string | null;                                            // nullable, không phải optional
  data: TicketActionDto | null;
  listErrors: Array<{ field: string | null; detail: string | null }> | null;
}
```

## Schema (Zod)

```ts
// hold.schema.ts shape
reason: z.nativeEnum(PauseReasonEnum)
note:   z.string().optional()

// resolve.schema.ts shape — [FIX 2026-06-15] BE required
resolutionSummary: z.string().min(1)   // ⚠️ KHÔNG optional — BE trả 400 nếu rỗng

// escalate-request.schema.ts shape
reason: z.nativeEnum(EscalationReasonEnum)
note:   z.string().optional()

// add-comment.schema.ts shape
body:        z.string().min(1)
isInternal:  z.boolean().default(false)
attachments: z.array(commentAttachmentSchema).optional()  // type-safe dù file picker ngoài scope

// maintenance-log.schema.ts shape
logType:             z.nativeEnum(MaintenanceLogTypeEnum).default('RemoteSupport')
summary:             z.string().min(1)
diagnosisDetails:    z.string().optional()
actionsTaken:        z.string().optional()
durationMinutes:     z.coerce.number().int().min(0).optional()
resolutionNote:      z.string().optional()
startedAt:           z.string().optional()
completedAt:         z.string().optional()
partsUsed:           z.string().optional()
attachments:         z.array(maintenanceAttachmentSchema).optional()
beforePhotos:        z.array(maintenanceAttachmentSchema).optional()
afterPhotos:         z.array(maintenanceAttachmentSchema).optional()
relatedKbArticleIds: z.array(z.string()).optional()
```

## Endpoints

```ts
// endpoints.ts — chỉ thêm ACTIVITIES (DETAIL, COMMENTS, MAINTENANCE_LOGS đã có sẵn)
TICKETS: {
  // đã có: LIST, CREATE, DETAIL, UPDATE_STATUS, ASSIGN, ESCALATE, CLOSE, CLOSE_REJECT, COMMENTS, MAINTENANCE_LOGS
  ACTIVITIES: (id: string) => `/api/tickets/${id}/activities`,   // ← thêm mới
},

// thêm hoàn toàn mới
STAFF_TICKETS: {
  ME:               '/api/staff/tickets/me',
  START:            (id: string) => `/api/staff/tickets/${id}/start`,
  HOLD:             (id: string) => `/api/staff/tickets/${id}/hold`,
  RESUME:           (id: string) => `/api/staff/tickets/${id}/resume`,
  RESOLVE:          (id: string) => `/api/staff/tickets/${id}/resolve`,
  ESCALATE_REQUEST: (id: string) => `/api/staff/tickets/${id}/escalate-request`,
},
```

**Lưu ý:** `ticket.service.ts` dùng `TICKETS.DETAIL`, `TICKETS.COMMENTS`, `TICKETS.MAINTENANCE_LOGS` (đã có sẵn trong endpoints.ts) + `TICKETS.ACTIVITIES` (mới) + toàn bộ `STAFF_TICKETS` (mới).

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/staff/tickets/me` | `{ status?: TicketStatusEnum, pageNumber: number, pageSize: number }` (query) | `CommonResponse<PaginationResponse<TicketDTO>>` |
| GET | `/api/tickets/{id}` | — | `CommonResponse<TicketDetailDTO>` |
| GET | `/api/tickets/{id}/activities` | — | `CommonResponse<TicketActivityDTO[]>` |
| GET | `/api/tickets/{id}/comments` | `{ page?: number, pageSize?: number }` (query, lowercase) | `CommonResponse<PaginationResponse<TicketCommentDTO>>` — endpoint phân trang riêng, KHÔNG lấy từ `TicketDetailDTO.comments` |
| POST | `/api/staff/tickets/{id}/start` | `{ logType?: MaintenanceLogTypeEnum, latitude?: number, longitude?: number }` | `TicketActionResponse` |
| POST | `/api/staff/tickets/{id}/hold` | `{ reason: PauseReasonEnum, note?: string }` | `TicketActionResponse` |
| POST | `/api/staff/tickets/{id}/resume` | — | `TicketActionResponse` |
| POST | `/api/staff/tickets/{id}/resolve` | `{ resolutionSummary: string }` (**bắt buộc**, không rỗng → 400) | `TicketActionResponse` |
| POST | `/api/staff/tickets/{id}/escalate-request` | `{ reason: EscalationReasonEnum, note?: string }` | `TicketActionResponse` |
| POST | `/api/tickets/{id}/comments` | `{ body: string, isInternal?: boolean, attachments?: CommentAttachmentInput[] }` | `TicketActionResponse` (**201**) |
| POST | `/api/tickets/{id}/maintenance-logs` | `MaintenanceLogRequest` (`summary` bắt buộc) | `TicketActionResponse` (**201**, kèm `MaintenanceLogId`) |

## Query Keys

```ts
// KEY (root — dùng để invalidate broad)
KEY.tickets        // shared cho tất cả portal
KEY.staffTickets   // scoped cho Staff

// QUERY_KEY factories
QUERY_KEY.tickets = {
  detail:     (id: string) => [KEY.tickets, 'detail', id] as const,
  activities: (id: string) => [KEY.tickets, 'activities', id] as const,
}

QUERY_KEY.staffTickets = {
  list:   (params?: object) => [KEY.staffTickets, 'list', params] as const,
  detail: (id: string)      => [KEY.staffTickets, 'detail', id] as const,
}
```

## staleTime Override

| Hook | staleTime | refetchInterval | Lý do |
|------|-----------|-----------------|-------|
| `useStaffTickets` (list) | 30s | — | Ticket queue thay đổi thường xuyên — fe.md rule |
| `useStaffTicketDetail` | 30s | — | Status ticket có thể đổi sau action của Staff khác |
| `useStaffTicketActivities` | 30s | — | Nhất quán với detail |

## Workflow

**List flow:**
User truy cập `/staff/tickets` → `useStaffTickets({ status, pageNumber, pageSize })`
→ hiển thị TicketCard list + filter dropdown + Pagination

**Action flow:**
- Assigned → click "Bắt đầu xử lý" → `useStartTicket.mutate(id)` → invalidate detail + list
- InProgress → click "Tạm dừng" → HoldDialog → submit → `useHoldTicket.mutate(id, { reason, note })`
- InProgress → click "Báo hoàn thành" → ResolveDialog → submit → `useResolveTicket.mutate(id, { resolutionSummary })`
- InProgress → click "Yêu cầu chuyển cấp" → EscalateRequestDialog → `useEscalateRequest.mutate(id, { reason, note })`
- WaitingX → click "Tiếp tục" → `useResumeTicket.mutate(id)`
- Tất cả mutations: onSuccess → `invalidateQueries(staffTickets.detail(id))` + `staffTickets.list()`

**Comment flow:**
AddCommentForm.onSubmit → `useAddComment.mutate(ticketId, { body, isInternal })`
→ onSuccess → invalidate `staffTickets.detail(id)` để reload `TicketDetailDTO.comments[]`
> Note: `tickets.activities(id)` KHÔNG invalidate — `TicketCommentDTO` không nằm trong activities endpoint.
> BE tự tạo activity entry `action: "Commented"` nhưng FE không cần invalidate activities riêng.

**Maintenance log flow:**
MaintenanceLogDialog.onSubmit → `useAddMaintenanceLog.mutate(ticketId, data)`
→ onSuccess → invalidate `staffTickets.detail(id)` để reload `TicketDetailDTO.maintenanceLogs[]`

## SLA Countdown (client-side)

```ts
// SlaCountdown component — useState + useEffect để re-render mỗi giây
const [remaining, setRemaining] = useState(() =>
  Math.max(0, Math.floor((new Date(dueAt).getTime() - Date.now()) / 1000))
)

useEffect(() => {
  // Dừng interval nếu SLA đang Paused — không đếm xuống
  if (slaStatus === SlaTimerStatusEnum.Paused) return

  const id = setInterval(() => {
    const diff = Math.floor((new Date(dueAt).getTime() - Date.now()) / 1000)
    setRemaining(Math.max(0, diff))
    if (diff <= 0) clearInterval(id)
  }, 1000)

  return () => clearInterval(id)
}, [dueAt, slaStatus])   // reset interval nếu dueAt hoặc status thay đổi
```

**Guard:** `slaStatus === 'Paused'` → không chạy interval; hiển thị "Đang tạm dừng" thay vì countdown.

## Cache Strategy

| Hook | staleTime | refetchInterval |
|------|-----------|-----------------|
| `useStaffTickets` (list) | 30s | — |
| `useStaffTicketDetail` | 30s | — |
| `useStaffTicketActivities` | 30s | — |

## Edge Cases
- 403 sai trạng thái: `handleErrorApi({ error })` → toast.error với message từ BE
- 404 ticket: navigate về list + toast.error
- Action button ẩn khi status không phù hợp (guard trong TicketDetailPage)
- `escalationReason` trong TicketDetailDTO: **nullable** (BE trả `null` khi chưa escalate — KHÔNG phải `0`). Guard bằng `escalatedAt != null` TRƯỚC khi hiển thị `escalationReason`
- `priority`/`impactScope`/`urgencyLevel` của ticket: **nullable** khi chưa triage (`New`/`Open`) — guard null trước khi render badge
- `isInternal` comment: hiển thị badge "Nội bộ" cho Staff; FE không ẩn (Staff xem được internal)
- SLA `status === 'Paused'`: SlaCountdown dừng interval, hiển thị "Đang tạm dừng" — không countdown xuống âm
- SLA `status === 'Breached'`: hiển thị "Đã vi phạm SLA" với màu đỏ, remaining = 0

## Acceptance Criteria

| Tiêu chí | Cách verify |
|----------|------------|
| List tickets hiển thị đúng | GET /api/staff/tickets/me trả data, render cards |
| Filter status hoạt động | Chọn filter → params thay đổi → list reload |
| Pagination hoạt động | Next/prev page → list reload đúng |
| Start action thành công | Ticket Assigned → click → status chuyển InProgress |
| Hold action với reason | Dialog mở, chọn reason, submit → status chuyển WaitingX |
| Resume thành công | WaitingX → click → status chuyển InProgress |
| Resolve với summary | Dialog mở, nhập summary, submit → Resolved |
| Escalate-request thành công | Dialog mở, chọn reason, submit |
| Timeline hiển thị | Activities render đúng thứ tự mới → cũ |
| Add comment hoạt động | Submit form → comment xuất hiện trong list |
| Maintenance log form submit | Dialog → form → submit → log thêm vào |
| `tsc --noEmit` pass | Không lỗi TypeScript |
| `eslint --max-warnings=0` pass | Không lint warning |
| `npm run build` pass | Build thành công |

## Steps
- [x] Bước 1: Tạo `shared/types/ticket.types.ts` (enums + DTOs + TicketActionResponse) — 2026-06-05
- [x] Bước 2: Update `shared/utils/endpoints.ts` — thêm `TICKETS.ACTIVITIES` + `STAFF_TICKETS` — 2026-06-05
- [x] Bước 3: Update `shared/utils/queryKeys.ts` — thêm `tickets` + `staffTickets` — 2026-06-05
- [x] Bước 4: Tạo `staff/types/staff-ticket.types.ts` (request types) — 2026-06-05
- [x] Bước 5: Tạo `staff/schemas/staff-ticket.schema.ts` (5 Zod schemas) — 2026-06-05
- [x] Bước 6: Tạo `staff/services/ticket.service.ts` (tất cả API calls) — 2026-06-05
- [x] Bước 7: Tạo hooks — `useStaffTickets`, `useStaffTicketDetail`, `useStaffTicketMutations` — 2026-06-05
- [x] Bước 8: Tạo components — `TicketStatusBadge`, `SlaCountdown`, `TicketCard` — 2026-06-05
- [x] Bước 9: Tạo dialog components — `HoldDialog`, `ResolveDialog`, `EscalateRequestDialog` — 2026-06-05
- [x] Bước 10: Tạo `TicketTimeline`, `AddCommentForm`, `MaintenanceLogDialog` — 2026-06-05
- [x] Bước 11: Tạo `TicketListPage` + `TicketDetailPage` — 2026-06-05
- [x] Bước 12: Update `router/index.tsx` — Staff AppLayout + ticket routes — 2026-06-05
- [x] Bước 13: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS — 2026-06-05

## Câu hỏi đã giải đáp

| Câu hỏi | Quyết định |
|---------|-----------|
| `tickets.activities(id)` có cần invalidate sau khi add comment không? | Không — `TicketCommentDTO` không nằm trong activities endpoint. BE tự tạo activity entry `action:"Commented"` nhưng FE không cần invalidate activities riêng. Chỉ invalidate `staffTickets.detail(id)` để reload `comments[]`. |
| Types đặt ở `shared/types/` hay `features/staff/types/`? | Enums + DTOs core đặt `shared/types/ticket.types.ts` (dùng cross-feature sau này). Request types (`HoldRequest`, `ResolveRequest`...) đặt `features/staff/types/staff-ticket.types.ts` (chỉ Staff dùng). |
| SLA Countdown có cần invalidate từ server không? | Không — countdown chạy client-side từ `dueAt`. Chỉ re-render khi `dueAt` hoặc `slaStatus` thay đổi (query refetch 30s). |
| `isInternal` comment: Staff có thấy comment internal không? | Có — Staff xem được tất cả comments kể cả `isInternal: true`. FE hiển thị badge "Nội bộ" để phân biệt, không ẩn. |
| Maintenance log: `fileId` attachment có implement không? | Không — file picker ngoài scope. Schema vẫn khai báo `attachments` optional để type-safe, nhưng UI không render file input. |
