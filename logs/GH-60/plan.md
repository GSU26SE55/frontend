# Plan — GH-60: [FE] Admin — Ticket Management

## Metadata
- **Status:** REVIEWING → **MINOR REWORK** | **Role:** FE | **Ngày:** 2026-06-05, cập nhật 2026-06-14
- **Issue:** #60 — https://github.com/GSU26SE55/frontend/issues/60
- **Sprint:** Sprint 2 (deadline 2026-06-13)

---

## ⚠️ Contract Reconciliation (2026-06-14, cập nhật 2026-06-15) — đối chiếu với `docs/api-ticket.md` + codebase BE

> **Cập nhật 2026-06-15:** đối chiếu trực tiếp codebase BE TicketService. Thêm C4 (priority/impact/urgency nullable), C5 (escalationReason nullable đính chính), C6 (attachments là string[]).

> Nguồn sự thật: [`docs/api-ticket.md`](../../docs/api-ticket.md). Plan này khai enum dạng string union khá đúng; chỉ vài sai lệch nhỏ đã sửa trong thân plan. Ưu tiên theo api-ticket.md.

### C1 — 🟠 `ActivityActionEnum` thiếu `'Closed'`
Type union (dòng 86-92) ghi "23 giá trị" và kết thúc ở `TriageApproved`. Spec có tới `Closed=25` → phải thêm `'Closed'` (tổng 24 string values; int 21 bỏ trống). Code `ticket.enum.ts` đã có `Closed` — OK.

### C2 — 🟡 Pagination param PascalCase
Spec admin list dùng PascalCase: `Keyword, Status, Priority, Category, BatteryAssetId, IsDescending, PageNumber, PageSize`. Plan dùng camelCase — service cần map đúng sang PascalCase khi gửi query.
Code hiện sai: `admin/services/ticket.service.ts:17-33` gửi camelCase thẳng, không map (axios không có paramsSerializer). BE ASP.NET thường bind case-insensitive nên có thể chạy, nhưng không khớp contract.

### C3 — 🔴 `declare-incident` thiếu body `incidentDescription` BẮT BUỘC
Spec ([api-ticket.md §declare-incident](../../docs/api-ticket.md)): body `{ incidentDescription: string }` **bắt buộc**, không rỗng/whitespace; BE trả **400** nếu thiếu. Bảng Endpoints + Workflow cũ của plan này ghi request "—" (rỗng) → **SAI**. Đã sửa bên dưới.
> **Code hiện sai (2026-06-14):** `admin/services/ticket.service.ts:47-50` `declareIncident: (id) => post(URL)` gửi body rỗng; `useAdminTickets.ts:42` chỉ truyền `id`. → action declare-incident **fail 400 100%**. Cần: thêm input lý do → `declareIncident(id, incidentDescription)` → `post(url, { incidentDescription })`. Fix code ở ticket riêng.

### C4 — 🔴 `TicketDTO.priority/impactScope/urgencyLevel` NULLABLE (mới — 2026-06-15)
BE (`TicketDTO.cs:15-17`): cả 3 là `?` — **null khi ticket chưa triage** (`New`/`Open`). Type plan (dòng 142-144) khai non-null → **SAI**.
> AdminTicketListPage hiển thị TOÀN BỘ ticket (kể cả `New`/`Open` chưa triage) → `priority`/`impactScope`/`urgencyLevel` = `null` → `TicketPriorityBadge` render null. Fix code: type → nullable + guard badge.

### C5 — 🟢 `escalationReason` nullable (đính chính — 2026-06-15)
Plan (dòng 223, 350) ghi "Swagger non-null nhưng treat optional". **ĐÍNH CHÍNH:** BE (`TicketDetailDTO.cs:20`) thực sự khai `EscalationReasonEnum?` nullable, trả `null` (không phải `0`). Type plan `escalationReason?` đã **đúng** — chỉ sửa lý do.

### C6 — 🟡 `attachments` là `string[]` (mới — 2026-06-15)
BE (`TicketDetailDTO.cs:25`) trả `attachmentFileIds: string[]` (mảng FileId), KHÔNG phải `TicketAttachmentDTO[]`. Type plan (dòng 228) sai. GH-60 chưa render attachments — sửa khi implement.

### Trạng thái implement vs plan (đối chiếu code 2026-06-14, cập nhật 2026-06-15)
✅ Đúng: endpoint paths + methods; không dùng enum bịa trong timeline.
❌ Còn thiếu/sai trong code (fix ở ticket riêng):
- **MAJOR (C3)** — declare-incident không gửi `incidentDescription` → fail 400.
- **MAJOR (C2)** — list query camelCase, không map PascalCase.
- **MINOR (C1)** — `TicketActivityTimeline` thiếu label `Closed` → fallback chuỗi thô.
- Guard `escalationReason`/`escalatedAt`: kiểm tra `AdminTicketDetailPage.tsx` nếu có render escalationReason.
- **MAJOR (C4, 2026-06-15)** — `TicketDTO.priority/impactScope/urgencyLevel` khai non-null nhưng BE trả `null` cho ticket chưa triage → AdminTicketListPage render badge null cho ticket `New`/`Open`. Đổi type → nullable + guard `TicketPriorityBadge`.
- **MINOR (C6, 2026-06-15)** — `attachments` type sai (`TicketAttachmentDTO[]` → thực tế `attachmentFileIds: string[]`).

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

## Enums

Tất cả enum nằm ở `src/shared/enums/ticket.enum.ts` — **không dùng plain string union type** như plan gốc đề xuất.
`shared/types/ticket.types.ts` chỉ import và re-export từ enum file.

| Enum | File |
|------|------|
| `TicketStatusEnum`, `TicketPriorityEnum`, `TicketCategoryEnum`, `TicketOriginEnum` | `shared/enums/ticket.enum.ts` |
| `ImpactScopeEnum`, `UrgencyLevelEnum`, `EscalationReasonEnum` | `shared/enums/ticket.enum.ts` |
| `PauseReasonEnum`, `SlaTimerStatusEnum`, `MaintenanceLogTypeEnum` | `shared/enums/ticket.enum.ts` |
| `ActivityActionEnum`, `ActorRoleEnum` | `shared/enums/ticket.enum.ts` |

**Thay đổi so với plan gốc:** Plan gốc dùng `export type TicketStatusEnum = 'New' | 'Open' | ...` (plain string union). Codebase thực tế dùng `as const` object pattern — xem `shared/enums/ticket.enum.ts`.

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

// ActivityActionEnum — 24 string values theo api-ticket.md (int 21 bỏ trống; AutoClosed=22, ResolvedByEscalatedStaff=23, TriageApproved=24, Closed=25)
export type ActivityActionEnum =
  | 'Created' | 'StatusChanged' | 'PriorityAssigned' | 'StaffAssigned' | 'StaffReassigned'
  | 'Commented' | 'MaintenanceLogged' | 'AttachmentAdded'
  | 'SlaPaused' | 'SlaResumed' | 'SlaWarning' | 'SlaBreached'
  | 'EscalationRequested' | 'Escalated' | 'IncidentDeclared'
  | 'Resolved' | 'Approved' | 'Rejected' | 'Rated' | 'Reopened'
  | 'AutoClosed' | 'ResolvedByEscalatedStaff' | 'TriageApproved' | 'Closed';

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
  // [FIX 2026-06-15 C4] priority/impactScope/urgencyLevel NULLABLE — null khi ticket chưa triage (New/Open)
  priority: TicketPriorityEnum | null;
  impactScope: ImpactScopeEnum | null;
  urgencyLevel: UrgencyLevelEnum | null;
  status: TicketStatusEnum;
  origin: TicketOriginEnum;
  reopenCount: number;
  isIncident: boolean;
  createdAt: string;
  updatedAt?: string;
  slaTimer: SlaTimerDTO | null;
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
  escalationReason?: EscalationReasonEnum; // [2026-06-15] BE nullable — trả null khi chưa escalate (không phải 0)
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

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/admin/tickets` | `{ Keyword?, Status?: TicketStatusEnum, Priority?: TicketPriorityEnum, Category?: TicketCategoryEnum, BatteryAssetId?: string, IsDescending?: boolean, PageNumber, PageSize }` (query, PascalCase) | `CommonResponse<PaginationResponse<TicketDTO>>` |
| GET | `/api/tickets/{id}` | — | `CommonResponse<TicketDetailDTO>` |
| GET | `/api/tickets/{id}/activities` | — | `CommonResponse<TicketActivityDTO[]>` |
| POST | `/api/admin/tickets/{id}/declare-incident` | `{ incidentDescription: string }` (**bắt buộc**, không rỗng/whitespace) | `TicketActionResponse` (`isIncident=true`); **400** nếu thiếu |

## Query Keys

```ts
// KEY thêm:
admin: {
  tickets: ['admin', 'tickets'] as const,
}
tickets: ['tickets'] as const,  // shared key dùng cho detail + activities

// QUERY_KEY thêm:
admin: {
  tickets: {
    list:   (p?: object) => [...KEY.admin.tickets, 'list', p] as const,
    detail: (id: string) => [...KEY.admin.tickets, 'detail', id] as const,
  }
}
tickets: {
  detail:     (id: string) => [KEY.tickets, 'detail', id] as const,
  activities: (id: string) => [KEY.tickets, 'activities', id] as const,
}
```

## staleTime Override

| Hook | staleTime | refetchInterval | Lý do |
|------|-----------|-----------------|-------|
| `useAdminTickets` (list) | 30s | — | Ticket queue rule — fe.md: ticket list thay đổi thường xuyên |
| `useAdminTicketDetail` | 30s | — | Status ticket có thể đổi sau action của Manager/Staff |
| `useAdminTicketActivities` | 30s | — | Nhất quán với detail; activity append sau mỗi action |

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
User click "Declare Incident" → Dialog với **input `incidentDescription` (bắt buộc)** → `useDeclareIncident.mutate({ id, incidentDescription })`
→ service: `post(DECLARE_INCIDENT(id), { incidentDescription })` — KHÔNG gửi body rỗng (BE 400)
→ OK: toast.success + `invalidateQueries` (detail + list) + button bị disable nếu `isIncident=true`
→ FAIL: `handleErrorApi({ error })` → toast.error (vd 400 khi description rỗng, 409 nếu đã là incident)

## Edge Cases
- Ticket đã là Incident: disable "Declare Incident" button (`ticket.isIncident === true`); BE trả `409` nếu cố declare lại
- `incidentDescription` rỗng/whitespace: validate FE (Zod `min(1)`) trước khi submit — BE trả `400` nếu lọt
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
- [x] Bước 1: Tạo `src/shared/types/ticket.types.ts` — toàn bộ enums + tất cả DTOs (kể cả TicketCommentDTO, MaintenanceLogDTO, TicketAttachmentDTO, TicketDetailDTO đầy đủ) — 2026-06-05
- [x] Bước 2: Cập nhật `endpoints.ts` — thêm `ADMIN_TICKETS` + `TICKETS.ACTIVITIES` — 2026-06-05
- [x] Bước 3: Cập nhật `queryKeys.ts` — thêm ticket query keys — 2026-06-05
- [x] Bước 4: Tạo `src/features/admin/services/ticket.service.ts` — 2026-06-05
- [x] Bước 5: Tạo `src/features/admin/hooks/useAdminTickets.ts` — dùng `/activities` endpoint riêng (không phụ thuộc `ticket.activities` từ detail); override `staleTime: 30_000` cho `useAdminTickets` (list) và `useAdminTicketDetail` theo fe.md — 2026-06-05
- [x] Bước 6: Tạo badge components (`TicketStatusBadge`, `TicketPriorityBadge`) — 2026-06-05
- [x] Bước 7: Tạo `AdminTicketTable.tsx` + `TicketActivityTimeline.tsx` — 2026-06-05
- [x] Bước 8: Tạo `AdminTicketListPage.tsx` — filter state và page state gộp chung 1 object; khi bất kỳ filter thay đổi, reset `PageNumber` về `1` trong cùng 1 state update (không để filter và page là 2 `useState` độc lập) — 2026-06-05
- [x] Bước 9: Tạo `AdminTicketDetailPage.tsx` — 2026-06-05
- [x] Bước 10: Cập nhật `router/index.tsx` + `AppLayout.tsx` — 2026-06-05
- [x] Bước 11: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS — 2026-06-05

## Câu hỏi đã giải đáp
| Câu hỏi | Quyết định |
|---------|-----------|
| `activities` trong detail response vs `/activities` endpoint riêng? | Dùng endpoint riêng — `activities` trong `TicketDetailDTO` là nullable, endpoint `/activities` luôn trả full array. Không cần confirm BE. |
| `BatteryAssetId` filter có UI không? | Không — không có dropdown data source trong sprint này. Filter param vẫn tồn tại trong service để BE hỗ trợ. |
| `escalationReason` — nullable hay không? | **Nullable** — BE (`TicketDetailDTO.cs:20`) khai `EscalationReasonEnum?`, trả `null` khi chưa escalate (cập nhật 2026-06-15: đính chính lại "Swagger non-null trả 0" là sai). Khai `?` là đúng. |
