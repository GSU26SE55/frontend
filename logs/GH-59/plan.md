# Plan — GH-59: [FE] Manager — Ticket Management

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-06-05
- **Issue:** #59 — https://github.com/GSU26SE55/frontend/issues/59
- **Sprint:** Sprint 2 (deadline 2026-06-13)

## Mục tiêu
Implement toàn bộ UI và logic cho portal Manager quản lý và điều phối ticket: xem danh sách, triage, gán/điều chuyển Staff, approve/reject kết quả, escalate, declare incident, xem chi tiết + timeline + comment.

## Scope
**Trong scope:**
- Types + enums cho toàn bộ ticket domain (FE)
- Service + hooks cho 12 API endpoint của Manager
- 3 page: TicketList, TicketQueue, TicketDetail
- 11 component: Table, Badges, SLA countdown, 5 action dialogs, Activity timeline, Comment form
- Cập nhật ENDPOINTS, QUERY_KEY, router, AppLayout nav

**Ngoài scope:**
- Customer/Staff ticket portal (issues khác)
- Maintenance log form (riêng biệt cho Staff)
- File attachment upload (phụ thuộc FileStorageService)
- Real-time WebSocket push notification

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/manager/types/ticket.types.ts` | create | 14 enums + 13 interface DTOs |
| `src/features/manager/schemas/ticket.schema.ts` | create | Zod: triage, assign, reassign, reject, escalate, comment |
| `src/features/manager/schemas/reopen-ticket.schema.ts` | create | Zod: `{ reopenReason: z.string().max(500).optional() }` |
| `src/features/manager/schemas/create-ticket.schema.ts` | create | Zod: `{ ..., batteryAssetId: z.string().uuid().optional() }` |
| `src/features/manager/services/ticket.service.ts` | create | 12 API calls |
| `src/features/manager/hooks/useManagerTickets.ts` | create | queries + mutations |
| `src/features/manager/components/TicketStatusBadge.tsx` | create | badge theo status |
| `src/features/manager/components/TicketPriorityBadge.tsx` | create | badge P1/P2/P3 |
| `src/features/manager/components/SlaCountdown.tsx` | create | đếm ngược SLA từ dueAt; Met → badge xanh, Breached → đỏ |
| `src/features/manager/components/TicketTable.tsx` | create | table chung dùng trong List + Queue |
| `src/features/manager/components/TriageDialog.tsx` | create | form impact × urgency → priority |
| `src/features/manager/components/AssignDialog.tsx` | create | chọn Staff, gán Approved → Assigned |
| `src/features/manager/components/ReassignDialog.tsx` | create | chọn Staff mới + reason |
| `src/features/manager/components/RejectDialog.tsx` | create | reason từ chối Resolved → InProgress |
| `src/features/manager/components/EscalateDialog.tsx` | create | reason + note escalate |
| `src/features/manager/components/TicketActivityTimeline.tsx` | create | danh sách TicketActivityDTO |
| `src/features/manager/components/AddCommentForm.tsx` | create | isInternal toggle + body |
| `src/features/manager/pages/TicketListPage.tsx` | create | danh sách ticket + advanced filters |
| `src/features/manager/pages/TicketQueuePage.tsx` | create | queue Open tickets, P1 ưu tiên |
| `src/features/manager/pages/TicketDetailPage.tsx` | create | chi tiết + actions + timeline + comments |
| `src/shared/utils/endpoints.ts` | modify | +TICKETS.ACTIVITIES, +ADMIN.TICKETS group |
| `src/shared/utils/queryKeys.ts` | modify | +KEY.manager.tickets + QUERY_KEY.manager.tickets |
| `src/router/index.tsx` | modify | +3 manager ticket routes |
| `src/shared/components/layout/AppLayout.tsx` | modify | +Tickets nav items trong MANAGER_NAV |

## Types
```ts
// ticket.types.ts — enums
export const TicketStatusEnum = {
  New: 'New', Open: 'Open', Approved: 'Approved', Assigned: 'Assigned',
  InProgress: 'InProgress', WaitingCustomer: 'WaitingCustomer',
  WaitingParts: 'WaitingParts', WaitingOnsiteSchedule: 'WaitingOnsiteSchedule',
  Resolved: 'Resolved', Escalated: 'Escalated', ClosedPendingRate: 'ClosedPendingRate',
  Closed: 'Closed', ClosedRejected: 'ClosedRejected', Incident: 'Incident',
} as const;

export const TicketPriorityEnum = { P1Critical: 'P1Critical', P2High: 'P2High', P3Normal: 'P3Normal' } as const;
export const TicketCategoryEnum = { Charging: 'Charging', Overheat: 'Overheat', NoPower: 'NoPower', Performance: 'Performance', Repair: 'Repair', Other: 'Other' } as const;
export const TicketOriginEnum = { ManualByCustomer: 'ManualByCustomer', AutoFromAlert: 'AutoFromAlert', CreatedByStaff: 'CreatedByStaff' } as const;
export const ImpactScopeEnum = { SingleAsset: 'SingleAsset', Site: 'Site', MultiSite: 'MultiSite' } as const;
export const UrgencyLevelEnum = { Low: 'Low', Medium: 'Medium', High: 'High' } as const;
export const EscalationReasonEnum = { SkillGap: 'SkillGap', PartsRequired: 'PartsRequired', SafetyConcern: 'SafetyConcern', SlaBreach: 'SlaBreach', CustomerComplaint: 'CustomerComplaint' } as const;
export const SlaTimerStatusEnum = { Running: 'Running', Paused: 'Paused', Met: 'Met', Breached: 'Breached' } as const;
export const MaintenanceLogTypeEnum = { RemoteSupport: 'RemoteSupport', OnSite: 'OnSite', PartReplacement: 'PartReplacement', Inspection: 'Inspection' } as const;
// [FIX #1] Điền đủ 23 values từ API doc (không để placeholder)
export const ActivityActionEnum = {
  Created: 'Created', StatusChanged: 'StatusChanged', PriorityAssigned: 'PriorityAssigned',
  StaffAssigned: 'StaffAssigned', StaffReassigned: 'StaffReassigned', Commented: 'Commented',
  MaintenanceLogged: 'MaintenanceLogged', AttachmentAdded: 'AttachmentAdded',
  SlaPaused: 'SlaPaused', SlaResumed: 'SlaResumed', SlaWarning: 'SlaWarning',
  SlaBreached: 'SlaBreached', EscalationRequested: 'EscalationRequested',
  Escalated: 'Escalated', IncidentDeclared: 'IncidentDeclared', Resolved: 'Resolved',
  Approved: 'Approved', Rejected: 'Rejected', Rated: 'Rated', Reopened: 'Reopened',
  AutoClosed: 'AutoClosed', ResolvedByEscalatedStaff: 'ResolvedByEscalatedStaff',
  TriageApproved: 'TriageApproved',
} as const;
export const ActorRoleEnum = { Admin: 'Admin', Manager: 'Manager', Staff: 'Staff', Customer: 'Customer', System: 'System' } as const;

// DTOs
interface SlaTimerDTO { id: string; priority: TicketPriorityEnum; startedAt: string; dueAt: string; originalDueAt: string; totalPausedMinutes: number; warningSentAt: string | null; breachAt: string | null; status: SlaTimerStatusEnum; remainingPercent: number; }
interface TicketDTO { id: string; code: string; title: string; status: TicketStatusEnum; priority: TicketPriorityEnum; category: TicketCategoryEnum; impactScope: ImpactScopeEnum; urgencyLevel: UrgencyLevelEnum; origin: TicketOriginEnum; assignedStaffId: string | null; customerId: string; batteryAssetId: string | null; isIncident: boolean; reopenCount: number; createdAt: string; updatedAt: string | null; slaTimer: SlaTimerDTO; }
// [FIX #2] TicketDetailDTO bổ sung đủ 12 fields còn thiếu
interface TicketDetailDTO extends TicketDTO {
  description: string | null; resolutionSummary: string | null; resolvedAt: string | null;
  resolvedByStaffId: string | null; approvedAt: string | null; approvedByManagerId: string | null;
  rejectionReason: string | null; closedAt: string | null; rating: number | null; ratingComment: string | null;
  ratedAt: string | null; escalatedAt: string | null; escalationReason: EscalationReasonEnum | null;
  originAlertId: string | null; activities: TicketActivityDTO[] | null; comments: TicketCommentDTO[] | null;
  maintenanceLogs: MaintenanceLogDTO[] | null; attachments: TicketAttachmentDTO[] | null;
}
interface TicketActivityDTO { id: string; ticketId: string; actorUserId?: string; actorRole: ActorRoleEnum; actorDisplayName?: string; action: ActivityActionEnum; oldValue?: string; newValue?: string; reason?: string; createdAt: string; }
// [FIX #3] TicketCommentDTO thêm attachmentFileIds
interface TicketCommentDTO { id: string; ticketId: string; authorUserId?: string; authorRole: ActorRoleEnum; authorDisplayName?: string; body: string; isInternal: boolean; attachmentFileIds?: string[] | null; createdAt: string; }
interface MaintenanceLogDTO { id: string; ticketId: string; staffId: string; logType: MaintenanceLogTypeEnum; summary?: string; durationMinutes: number; startedAt: string; completedAt?: string; createdAt: string; }
interface TicketAttachmentDTO { id: string; fileId: string; fileName: string; contentType: string; sizeBytes: number; uploadedByUserId?: string; createdAt: string; }
interface TicketActionDto { id: string | null; code: string | null; status: TicketStatusEnum; }
interface TicketActionResponse { isSuccess: boolean; statusCode: number; message: string | null; data: TicketActionDto | null; listErrors: Array<{field: string|null; detail: string|null}>|null; }
```

## Endpoints
```ts
// Thêm vào ENDPOINTS.TICKETS:
ACTIVITIES: (id: string) => `/api/tickets/${id}/activities`,
COMMENTS:   (id: string) => `/api/tickets/${id}/comments`,

// Thêm ENDPOINTS.ADMIN.TICKETS:
TICKETS: {
  LIST:            '/api/admin/tickets',
  QUEUE:           '/api/admin/tickets/queue',
  TRIAGE:          (id: string) => `/api/admin/tickets/${id}/triage`,
  ASSIGN:          (id: string) => `/api/admin/tickets/${id}/assign`,
  REASSIGN:        (id: string) => `/api/admin/tickets/${id}/reassign`,
  APPROVE:         (id: string) => `/api/admin/tickets/${id}/approve`,
  REJECT:          (id: string) => `/api/admin/tickets/${id}/reject`,
  ESCALATE:        (id: string) => `/api/admin/tickets/${id}/escalate`,
  DECLARE_INCIDENT:(id: string) => `/api/admin/tickets/${id}/declare-incident`,
}
```

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/admin/tickets` | `{ keyword?, status?: TicketStatusEnum, priority?: TicketPriorityEnum, category?: TicketCategoryEnum, batteryAssetId?: string, pageNumber, pageSize }` (query) | `CommonResponse<PaginationResponse<TicketDTO>>` |
| GET | `/api/admin/tickets/queue` | `{ priority?: TicketPriorityEnum, category?: TicketCategoryEnum, pageNumber, pageSize }` (query) | `CommonResponse<PaginationResponse<TicketDTO>>` |
| GET | `/api/tickets/{id}` | — | `CommonResponse<TicketDetailDTO>` |
| GET | `/api/tickets/{id}/activities` | — | `CommonResponse<TicketActivityDTO[]>` |
| POST | `/api/admin/tickets/{id}/triage` | `{ impact: ImpactScopeEnum, urgency: UrgencyLevelEnum, manualPriority?: TicketPriorityEnum, priorityOverrideReason?: string, managerComment?: string }` | `TicketActionResponse` |
| POST | `/api/admin/tickets/{id}/assign` | `{ staffId: string (UUID), notes?: string }` | `TicketActionResponse` |
| POST | `/api/admin/tickets/{id}/reassign` | `{ newStaffId: string (UUID), reason?: string }` | `TicketActionResponse` |
| POST | `/api/admin/tickets/{id}/approve` | — (comment qua query param `?comment=`) | `TicketActionResponse` |
| POST | `/api/admin/tickets/{id}/reject` | `{ reason?: string }` | `TicketActionResponse` |
| POST | `/api/admin/tickets/{id}/escalate` | `{ reason: EscalationReasonEnum, note?: string }` | `TicketActionResponse` |
| POST | `/api/admin/tickets/{id}/declare-incident` | — | `TicketActionResponse` |
| POST | `/api/tickets/{id}/comments` | `{ body: string, isInternal: boolean, attachments?: CommentAttachmentInput[] }` | `CommonResponse<TicketCommentDTO>` |

## Query Keys
```ts
// KEY thêm:
manager: {
  tickets: ['manager', 'tickets'] as const,
}

// QUERY_KEY thêm:
manager: {
  tickets: {
    list:       (p?: object) => [...KEY.manager.tickets, 'list', p],
    queue:      (p?: object) => [...KEY.manager.tickets, 'queue', p],
    detail:     (id: string) => [...KEY.manager.tickets, 'detail', id],
    activities: (id: string) => [...KEY.manager.tickets, 'activities', id],
  }
}
```

## staleTime Override

| Hook | staleTime | refetchInterval | Lý do |
|------|-----------|-----------------|-------|
| `useAdminTicketList` | 30s | — | Ticket queue rule — fe.md: ticket data thay đổi thường xuyên |
| `useAdminTicketQueue` | 30s | — | Queue Open tickets cần fresh hơn list thông thường |
| `useTicketDetail` | 30s | — | Status thay đổi sau mỗi action Manager |
| `useTicketActivities` | 30s | — | Nhất quán với detail; activity append sau mỗi action |
| `SlaCountdown` (internal) | 0 | 30s | fe.md: SLA countdown — staleTime:0 + refetchInterval:30s để auto-refetch |

## Schemas (Zod)
```ts
// ticket.schema.ts
// [FIX #4] triageSchema thêm managerComment
triageSchema: { impact: z.nativeEnum(ImpactScopeEnum), urgency: z.nativeEnum(UrgencyLevelEnum),
  manualPriority: z.nativeEnum(TicketPriorityEnum).optional(),
  priorityOverrideReason: z.string().optional(), managerComment: z.string().optional() }
  // .superRefine: nếu manualPriority khác computed priority → priorityOverrideReason bắt buộc

// [FIX #5] assignSchema — validate UUID
assignSchema: { staffId: z.string().uuid(), notes: z.string().optional() }

// [FIX #5] reassignSchema — validate UUID
reassignSchema: { newStaffId: z.string().uuid(), reason: z.string().optional() }

rejectSchema: { reason: z.string().optional() }
escalateSchema: { reason: z.nativeEnum(EscalationReasonEnum), note: z.string().optional() }

// [FIX #6] addCommentSchema thêm attachments optional
// [FIX B1] isInternal typed boolean, không dùng literal false — form dùng default(false) nhưng
//           AddCommentPayload interface khai báo isInternal: boolean (không bị narrow thành false)
addCommentSchema: { body: z.string().min(1), isInternal: z.boolean().default(false),
  attachments: z.array(z.object({ fileId: z.string().uuid(), fileName: z.string().optional(),
    contentType: z.string().optional(), sizeBytes: z.number().optional() })).optional() }
// AddCommentPayload (dùng trong service): { body: string; isInternal: boolean; attachments?: CommentAttachmentInput[] }

// reopen-ticket.schema.ts
reopenTicketSchema: z.object({ reopenReason: z.string().max(500).optional() })

// create-ticket.schema.ts
createTicketSchema: z.object({
  title:          z.string().min(1).max(200),
  description:    z.string().min(1, 'Không được để trống').max(2000),
  category:       z.nativeEnum(TicketCategoryEnum),
  batteryAssetId: z.string().uuid('ID pin không hợp lệ').optional(),
})
```

## Workflow

**Ticket List flow:**
- Render TicketListPage với filter bar (Keyword, Status, Priority, Category, BatteryAssetId) — [FIX #7]
- `useAdminTicketList(params)` → table rows, params type gồm `batteryAssetId?: string`
- Click row → navigate `/manager/tickets/:id`

**Ticket Queue flow:**
- Render TicketQueuePage — chỉ Open tickets, sorted P1 first
- Filter bar: Priority, Category — [FIX #8], `useAdminTicketQueue(params)` nhận `{ priority?, category?, pageNumber, pageSize }`
- Rows hiển thị SlaCountdown
- Button "Triage" trên mỗi row → mở TriageDialog → submit → invalidate queue + detail

**Ticket Detail flow:**
- `useTicketDetail(id)` → header + action panel
- Action panel hiển thị button theo state machine:
  - `Open` → Triage button → TriageDialog
  - `Approved` → Assign button → AssignDialog
  - `Assigned/InProgress/Escalated` → Reassign button → ReassignDialog
  - `Resolved` → Approve + Reject buttons → confirm/RejectDialog
  - Bất kỳ trạng thái → Escalate, Declare Incident (điều kiện: chưa escalate / chưa incident)
- `useTicketActivities(id)` → TicketActivityTimeline
- `useAddComment` mutation → AddCommentForm

**Add comment flow:**
- AddCommentForm submit → `useAddComment.mutateAsync({ ticketId, payload })`
- Service signature: `addComment(ticketId: string, payload: AddCommentPayload)` — [FIX B2]
  - `ticketId` là path param riêng, không nằm trong payload
  - Service call: `axiosInstance.post(ENDPOINTS.TICKETS.COMMENTS(ticketId), payload)`
- Hook: `useMutation({ mutationFn: ({ ticketId, payload }) => ticketService.addComment(ticketId, payload) })`

**Triage flow:**
- Form: impact (select) + urgency (select) → auto-display computed priority
- Optional: manualPriority (override) + priorityOverrideReason
- Submit → `useTriageTicket` → toast success → invalidate detail + queue

## Edge Cases
- SLA breached → TicketPriorityBadge + SlaCountdown hiển thị màu đỏ
- Staff list rỗng → AssignDialog hiển thị empty state
- `approve` endpoint gửi comment qua query param, không phải body → `axios.post(url, null, { params: { comment } })`
- `escalationReason` trên TicketDetailDTO treat như optional (Swagger nói không nullable nhưng ticket chưa escalate có thể là enum default)
- Triage: nếu `manualPriority` !== computed priority → `priorityOverrideReason` bắt buộc (validate ở FE với Zod `superRefine`)
- Comment `isInternal: true` → chỉ Staff/Manager thấy — hiển thị rõ badge "Nội bộ" trong UI

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| Ticket list hiện đúng, filter hoạt động | Load page, thay đổi filter, verify response |
| Queue chỉ hiện Open tickets, sắp xếp P1 trước | Kiểm tra data trong network tab |
| Triage thành công → ticket chuyển Approved | Submit form, verify toast + refetch detail |
| Assign Staff thành công → ticket chuyển Assigned | Submit form, verify toast + refetch |
| Approve/Reject Resolved ticket hoạt động | Click action, verify state change |
| Escalate + Declare Incident hoạt động | Click action, verify isIncident/status |
| Comment thêm được, isInternal hiển thị đúng | Submit comment, verify UI |
| `tsc --noEmit` + eslint 0 warning + build pass | `npm run build` |

## Steps
- [x] Bước 1: Tạo `types/ticket.types.ts` — enums + interfaces — 2026-06-05
- [x] Bước 2: Cập nhật `endpoints.ts` — TICKETS.ACTIVITIES + ADMIN.TICKETS — 2026-06-05
- [x] Bước 3: Cập nhật `queryKeys.ts` — KEY.manager.tickets + QUERY_KEY.manager.tickets — 2026-06-05
- [x] Bước 4: Tạo `schemas/ticket.schema.ts` — Zod schemas cho 6 form; `reopen-ticket.schema.ts`; `create-ticket.schema.ts` — 2026-06-05
- [x] Bước 5: Tạo `services/ticket.service.ts` — 12 API calls — 2026-06-05
- [x] Bước 6: Tạo `hooks/useManagerTickets.ts` — 4 queries + 8 mutations — 2026-06-05
- [x] Bước 7: Tạo shared components — TicketStatusBadge, TicketPriorityBadge, SlaCountdown, TicketTable — 2026-06-05
- [x] Bước 8: Tạo action dialogs — TriageDialog, AssignDialog, ReassignDialog, RejectDialog, EscalateDialog — 2026-06-05
- [x] Bước 9: Tạo TicketActivityTimeline + AddCommentForm — 2026-06-05
- [x] Bước 10: Tạo 3 pages — TicketListPage, TicketQueuePage, TicketDetailPage — 2026-06-05
- [x] Bước 11: Cập nhật router + AppLayout nav — 2026-06-05
- [x] Bước 12: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS — 2026-06-05

## Câu hỏi đã giải đáp
- Tất cả API đã có đầy đủ trong `docs/api-ticket.md` — không cần hỏi thêm
- Staff list lấy từ `GET /api/staff` (ENDPOINTS.STAFF.LIST) qua service riêng trong manager feature (không cross-import từ features/staff/)
- `approve` endpoint dùng query param cho comment, không phải body — đã ghi rõ trong approach
- Types đặt trong `features/manager/types/` (không phải shared/) vì chỉ manager portal dùng trong sprint này
