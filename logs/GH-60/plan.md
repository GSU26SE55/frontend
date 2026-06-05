# Plan — GH-60: [FE] Admin — Ticket Management

## Metadata
- **Status:** IN_PROGRESS | **Role:** FE | **Ngày:** 2026-06-05
- **Issue:** #60 — https://github.com/GSU26SE55/frontend/issues/60
- **Sprint:** Sprint 2 (deadline 2026-06-13)

## Mục tiêu
Xây dựng portal quản lý ticket cho Admin: danh sách toàn bộ ticket với bộ lọc nâng cao, trang chi tiết ticket kèm activity timeline, và action declare-incident. Admin xem không bị filter theo user (khác Manager/Staff).

## Scope
**Trong scope:**
- `GET /api/admin/tickets` — list + pagination + 5 filters (Keyword, Status, Priority, Category, BatteryAssetId)
- `GET /api/tickets/{id}` — ticket detail
- `GET /api/tickets/{id}/activities` — activity timeline (no pagination)
- `POST /api/admin/tickets/{id}/declare-incident` — action với confirm dialog
- Navigation: thêm "Tickets" vào sidebar Admin

**Ngoài scope:**
- Triage, assign, reassign, approve, reject, escalate (Manager flow — issue khác)
- Comments, maintenance logs (Staff flow)
- isDescending sort UI (BE đã hỗ trợ nhưng issue không yêu cầu toggle UI)
- BatteryAssetId filter UI (filter parameter tồn tại nhưng không có dropdown data source trong sprint này — bỏ qua)

## Files

### Tạo mới
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/types/ticket.types.ts` | create | Toàn bộ enums + DTOs từ api-ticket.md |
| `src/features/admin/services/ticket.service.ts` | create | 4 API calls |
| `src/features/admin/hooks/useAdminTickets.ts` | create | 4 hooks (list, detail, activities, mutation) |
| `src/features/admin/components/TicketStatusBadge.tsx` | create | Colored badge theo TicketStatusEnum |
| `src/features/admin/components/TicketPriorityBadge.tsx` | create | Colored badge theo TicketPriorityEnum |
| `src/features/admin/components/AdminTicketTable.tsx` | create | Table + pagination |
| `src/features/admin/components/TicketActivityTimeline.tsx` | create | Timeline list |
| `src/features/admin/pages/AdminTicketListPage.tsx` | create | List + filters |
| `src/features/admin/pages/AdminTicketDetailPage.tsx` | create | Detail + timeline + declare-incident |

### Sửa đổi
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | Thêm `ADMIN_TICKETS` + `TICKETS.ACTIVITIES` |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `admin.tickets` + shared `tickets` keys |
| `src/router/index.tsx` | modify | Thêm routes `/admin/tickets` và `/admin/tickets/:id` |
| `src/shared/components/layout/AppLayout.tsx` | modify | Thêm "Tickets" vào `ADMIN_NAV` |

## Types

```ts
// src/shared/types/ticket.types.ts

// Enums (string literal — khớp với BE response)
export type TicketStatusEnum =
  | 'New' | 'Open' | 'Approved' | 'Assigned' | 'InProgress'
  | 'WaitingCustomer' | 'WaitingParts' | 'WaitingOnsiteSchedule'
  | 'Resolved' | 'Escalated' | 'ClosedPendingRate' | 'Closed'
  | 'ClosedRejected' | 'Incident';

export type TicketPriorityEnum = 'P1Critical' | 'P2High' | 'P3Normal';
export type TicketCategoryEnum = 'Charging' | 'Overheat' | 'NoPower' | 'Performance' | 'Repair' | 'Other';
export type TicketOriginEnum = 'ManualByCustomer' | 'AutoFromAlert' | 'CreatedByStaff';
export type ImpactScopeEnum = 'SingleAsset' | 'Site' | 'MultiSite';
export type UrgencyLevelEnum = 'Low' | 'Medium' | 'High';
export type EscalationReasonEnum = 'SkillGap' | 'PartsRequired' | 'SafetyConcern' | 'SlaBreach' | 'CustomerComplaint';
export type PauseReasonEnum = 'WaitingCustomer' | 'WaitingParts' | 'WaitingOnsiteSchedule';
export type SlaTimerStatusEnum = 'Running' | 'Paused' | 'Met' | 'Breached';
export type MaintenanceLogTypeEnum = 'RemoteSupport' | 'OnSite' | 'PartReplacement' | 'Inspection';
export type ActorRoleEnum = 'Admin' | 'Manager' | 'Staff' | 'Customer' | 'System';

// ActivityActionEnum — 23 giá trị (đúng theo api-ticket.md)
export type ActivityActionEnum =
  | 'Created' | 'StatusChanged' | 'PriorityAssigned' | 'StaffAssigned' | 'StaffReassigned'
  | 'Commented' | 'MaintenanceLogged' | 'AttachmentAdded'
  | 'SlaPaused' | 'SlaResumed' | 'SlaWarning' | 'SlaBreached'
  | 'EscalationRequested' | 'Escalated' | 'IncidentDeclared'
  | 'Resolved' | 'Approved' | 'Rejected' | 'Rated' | 'Reopened'
  | 'AutoClosed' | 'ResolvedByEscalatedStaff' | 'TriageApproved';

// ── Core DTOs ──

export interface SlaTimerDTO {
  id: string;
  priority: TicketPriorityEnum;
  startedAt: string;
  dueAt: string;
  originalDueAt: string;
  totalPausedMinutes: number;
  warningSentAt?: string;
  breachAt?: string;
  status: SlaTimerStatusEnum;
  remainingPercent: number;
}

export interface TicketDTO {
  id: string;
  code: string;
  batteryAssetId?: string;
  customerId: string;
  assignedStaffId?: string;
  title: string;
  category: TicketCategoryEnum;
  priority: TicketPriorityEnum;
  impactScope: ImpactScopeEnum;
  urgencyLevel: UrgencyLevelEnum;
  status: TicketStatusEnum;
  origin: TicketOriginEnum;
  reopenCount: number;
  isIncident: boolean;
  createdAt: string;
  updatedAt?: string;
  slaTimer: SlaTimerDTO;
}

export interface TicketActivityDTO {
  id: string;
  ticketId: string;
  actorUserId?: string;
  actorRole: ActorRoleEnum;
  actorDisplayName?: string;
  action: ActivityActionEnum;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: string;
}

// Khai báo đầy đủ để TicketDetailDTO build được — dù GH-60 chưa render
export interface TicketCommentDTO {
  id: string;
  ticketId: string;
  authorUserId?: string;
  authorRole: ActorRoleEnum;
  authorDisplayName?: string;
  body: string;
  isInternal: boolean;
  attachmentFileIds?: string[];
  createdAt: string;
}

export interface MaintenanceLogDTO {
  id: string;
  ticketId: string;
  staffId: string;
  logType: MaintenanceLogTypeEnum;
  summary?: string;
  diagnosisDetails?: string;
  actionsTaken?: string;
  durationMinutes: number;
  resolutionNote?: string;
  startedAt: string;
  completedAt?: string;
  attachmentFileIds?: string[];
  beforePhotosFileIds?: string[];
  afterPhotosFileIds?: string[];
  relatedKbArticleIds?: string[];
  createdAt: string;
}

export interface TicketAttachmentDTO {
  id: string;
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId?: string;
  createdAt: string;
}

// TicketDetailDTO — extends TicketDTO với 14 fields bổ sung
export interface TicketDetailDTO extends TicketDTO {
  description?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  resolvedByStaffId?: string;
  approvedAt?: string;
  approvedByManagerId?: string;
  rejectionReason?: string;
  closedAt?: string;
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
  escalatedAt?: string;
  escalationReason?: EscalationReasonEnum; // Swagger ghi non-null nhưng treat optional khi chưa escalate
  originAlertId?: string;
  activities?: TicketActivityDTO[];   // nullable — dùng /activities endpoint làm source of truth
  comments?: TicketCommentDTO[];
  maintenanceLogs?: MaintenanceLogDTO[];
  attachments?: TicketAttachmentDTO[];
}

// ── Action Response ──
export interface TicketActionDto {
  id: string | null;
  code: string | null;
  status: TicketStatusEnum;
}

export interface TicketActionResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  data: TicketActionDto | null;
  listErrors: Array<{ field: string | null; detail: string | null }> | null;
}
```

## Endpoints

```ts
// Thêm vào endpoints.ts
ADMIN_TICKETS: {
  LIST:             '/api/admin/tickets',
  DECLARE_INCIDENT: (id: string) => `/api/admin/tickets/${id}/declare-incident`,
},
// Cập nhật TICKETS — thêm:
ACTIVITIES: (id: string) => `/api/tickets/${id}/activities`,
```

## Workflow

**List flow:**
User mở `/admin/tickets` → `useAdminTickets(params)` → render `AdminTicketTable` với pagination
→ User thay đổi filter → state update → query tự refetch

**Detail flow:**
User click row → navigate `/admin/tickets/:id`
→ `useAdminTicketDetail(id)` + `useAdminTicketActivities(id)` chạy parallel
→ render ticket info + `TicketActivityTimeline`

> **Lý do dùng `/activities` endpoint riêng** (thay vì `ticket.activities` từ detail): `activities` trong `TicketDetailDTO` là nullable — BE có thể trả `null` để giảm payload. Endpoint `/api/tickets/{id}/activities` luôn trả full array. Dùng endpoint riêng loại bỏ dependency vào BE behavior mà không cần confirm trước.

**Declare Incident flow:**
User click "Declare Incident" → `AlertDialog` confirm → `useDeclareIncident.mutate(id)`
→ OK: toast.success + `invalidateQueries` (detail + list) + button bị disable nếu `isIncident=true`
→ FAIL: `handleErrorApi({ error })` → toast.error

## Edge Cases
- Ticket đã là Incident: disable "Declare Incident" button (`ticket.isIncident === true`)
- Activities API trả về `[]`: hiện empty state trong timeline
- 403/404 khi vào detail: redirect hoặc hiện error state
- Pagination: nếu trang hiện tại > totalPages sau filter → reset về page 1

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| List hiện đúng data từ API | `GET /api/admin/tickets` trả về data, hiện trong table |
| Filters hoạt động | Thay đổi Status/Priority/Category → query param cập nhật, table reload |
| Click row → detail page | URL chuyển sang `/admin/tickets/:id`, data hiện đúng |
| Activity timeline hiện | Danh sách activities render trong timeline |
| Declare Incident thành công | `isIncident` chuyển true, button disable, toast thành công |
| Build clean | `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS |

## Steps
- [ ] Bước 1: Tạo `src/shared/types/ticket.types.ts` — toàn bộ enums + tất cả DTOs (kể cả TicketCommentDTO, MaintenanceLogDTO, TicketAttachmentDTO, TicketDetailDTO đầy đủ)
- [ ] Bước 2: Cập nhật `endpoints.ts` — thêm `ADMIN_TICKETS` + `TICKETS.ACTIVITIES`
- [ ] Bước 3: Cập nhật `queryKeys.ts` — thêm ticket query keys
- [ ] Bước 4: Tạo `src/features/admin/services/ticket.service.ts`
- [ ] Bước 5: Tạo `src/features/admin/hooks/useAdminTickets.ts` — dùng `/activities` endpoint riêng (không phụ thuộc `ticket.activities` từ detail); override `staleTime: 30_000` cho `useAdminTickets` (list) và `useAdminTicketDetail` theo fe.md
- [ ] Bước 6: Tạo badge components (`TicketStatusBadge`, `TicketPriorityBadge`)
- [ ] Bước 7: Tạo `AdminTicketTable.tsx` + `TicketActivityTimeline.tsx`
- [ ] Bước 8: Tạo `AdminTicketListPage.tsx` — filter state và page state gộp chung 1 object; khi bất kỳ filter thay đổi, reset `PageNumber` về `1` trong cùng 1 state update (không để filter và page là 2 `useState` độc lập)
- [ ] Bước 9: Tạo `AdminTicketDetailPage.tsx`
- [ ] Bước 10: Cập nhật `router/index.tsx` + `AppLayout.tsx`
- [ ] Bước 11: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS

## Câu hỏi đã giải đáp
| Câu hỏi | Quyết định |
|---------|-----------|
| `activities` trong detail response vs `/activities` endpoint riêng? | Dùng endpoint riêng — `activities` trong `TicketDetailDTO` là nullable, endpoint `/activities` luôn trả full array. Không cần confirm BE. |
| `BatteryAssetId` filter có UI không? | Không — không có dropdown data source trong sprint này. Filter param vẫn tồn tại trong service để BE hỗ trợ. |
| `escalationReason` — nullable hay không? | Khai báo `?` dù Swagger ghi non-null, vì API docs khuyến cáo FE treat optional khi chưa escalate. |
