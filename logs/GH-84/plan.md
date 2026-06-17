# Plan — GH-84: [FE] Integrate Knowledge Base (Wiki) API

## Metadata
- **Status:** IN_PROGRESS | **Role:** FE | **Ngày:** 2026-06-17
- **Issue:** #84 — https://github.com/GSU26SE55/frontend/issues/84
- **Sprint:** Sprint 3 (due 2026-06-27)
- **Dev:** Trần Minh Trí (@Shu1237)

> **⚠️ Bản revise 2 — đã verify trực tiếp với source BE** (`backend/services/TicketService`).
> Các giả định trong bản plan đầu (và một số chỗ trong `docs/api-ticket.md`) đã được **đối chiếu code BE thật** và sửa lại. Xem mục **"Sự thật BE đã verify"** bên dưới — đây là nguồn chuẩn, KHÔNG dùng lại mô tả cũ của doc nếu mâu thuẫn.

## Mục tiêu
Thay toàn bộ KB (Wiki) hiện đang **mock** bằng **endpoint + data thật** từ BackEnd (TicketService). **Phía web chỉ làm WIKI NỘI BỘ** (Staff/Manager/Admin authoring + review workflow). Gồm: đổi path mock → path thật, sửa enum/DTO/payload cho khớp BE thật, và bổ sung các flow chưa có: version history + diff, copy-template, review workflow (approve/reject-review), rollback. Xóa `kb.mock.ts`.

> **2 loại wiki (làm rõ với user):** (1) **Wiki nội bộ** — đối tượng issue này, cho Staff/Manager/Admin trên web. (2) **KB public** — Customer tự đọc & fix nhanh tại nhà. KB public là **customer-facing → thuộc mobile/customer, KHÔNG làm trên web** → `suggest` + `helpful` NẰM NGOÀI scope issue này.

---

## ✅ Sự thật BE đã verify (nguồn chuẩn — thay cho giả định cũ)

| # | Điểm | Sự thật BE (đã đọc code) | Tác động lên plan |
|---|------|--------------------------|-------------------|
| 1 | **Enum serialize** | `Program.cs` đăng ký `JsonStringEnumConverter` global → **response trả enum dạng STRING** (`"Published"`, `"Charging"`). | FE dùng **string-enum** cho `status`/`category` trong response DTO. ✅ |
| 2 | **Filter request lại là INT** | `GetKbArticleListQuery.Status`/`Category` kiểu `int?`; handler so sánh `(int)a.Status == query.Status`. | Khi **filter (query param)** FE gửi **số** (`Status=2`), nhưng khi **đọc response** nhận **string**. Tách rõ 2 chiều. |
| 3 | **List endpoint CÓ auth + role filter** | `GET /api/knowledge-base` có `[Authorize]` (KHÔNG anonymous như doc ghi). Handler: **Customer** → chỉ `Published` + `!IsInternalOnly`; **Staff/Mgr/Admin** → lọc tự do theo `Status`. | **BLOCKER cũ được GIẢI QUYẾT:** internal roles **list được `PendingReview`** ngay qua endpoint này → KHÔNG cần endpoint mới, KHÔNG cần fallback link. |
| 4 | **Query param tên `Q`** | List nhận `Q` (keyword), `Category`(int), `Status`(int), `Tag`(string, **số ít**), `PageNumber`, `PageSize`. | FE service map `keyword → Q`, `tags → Tag` (1 tag/lần), không phải `Keyword`/`Tags[]`. |
| 5 | **`KbArticleListItemDto`** | Field thật: `id, code, title, category, status, viewCount, helpfulCount, reviewRequired, createdAt`. **KHÔNG có `tags`**, **CÓ `reviewRequired`**. | Sửa `KbArticleSummaryDTO`: bỏ `tags`, thêm `reviewRequired` + `createdAt`. |
| 6 | **`KbArticleDto` (detail)** | Thêm so với type FE cũ: `isInternalOnly`, `pendingReviewBy`, `reviewRequired`, `managerRejectReason`. `recommendedParts` là **`List<string>`** (string[]), KHÔNG phải `string`. `category` là enum string. | Sửa `KbArticleDTO`: `recommendedParts: string[] \| null`, thêm 4 field trên. |
| 7 | **Status enum 4 giá trị** | `KbArticleStatusEnum { Draft=1, PendingReview=2, Published=3, Archived=4 }`. | Thêm **`PendingReview`** vào FE enum (hiện chỉ có Draft/Published/Archived). ⚠️ value Published đổi 2→3. |
| 8 | **`KbVersionStatusEnum`** | `{ Pending=1, Approved=2, Rejected=3, Archived=4 }`. Nhưng `KbArticleVersionDto.Status` BE để kiểu **`int` raw** (không qua enum converter) → response trả **số**. | Thêm enum + label; type `version.status: number`, map số → label thủ công. |
| 9 | **`compare` params** | `CompareKbArticleVersionsQuery`: `FromVersionId` (Guid, bắt buộc), `ToVersionId` (Guid?, optional → so với bản hiện tại). **KHÔNG phải `fromVersion`/`toVersion` int** như doc ghi. | Service compare nhận **versionId (Guid)**, không phải số version. |
| 10 | **Update payload** | `IsInternalOnly` **gửi kèm** (bool); `ChangeDescription` thực ra **`string?` nullable** (doc ghi "required" là SAI — BE không validate). | Schema không bắt buộc `changeDescription`; vẫn nên gửi để audit. |
| 11 | **Create response** | `POST /internal/knowledge-base` trả **`KbArticleActionDto`** (`id, code, status`). Bài mới khởi tạo ở **`PendingReview`** (không phải Draft). | Hook create không set Draft thủ công; đọc status từ response. |
| 12 | **Auth roles (controller)** | internal = `Staff,Manager,Admin`; admin-workflow = `Manager,Admin`; delete = `Admin` only. | Gate UI: Staff KHÔNG thấy approve/reject/publish/archive/rollback; delete chỉ Admin. |

> **Ghi chú:** Vì #2 + #3, `docs/api-ticket.md` (Nhóm 8) đang **ghi sai**: nói list "Không yêu cầu auth" và "chỉ trả Published". Doc cần cập nhật theo BE thật → **Bước 0**.

---

## Scope
**Trong scope:**
- Rewrite `endpoints.ts` KB: thay `KB_ARTICLES` (path sai `/api/kb-articles`) → 3 nhóm path thật: `KNOWLEDGE_BASE` (`/api/knowledge-base`) + `KB_INTERNAL` (`/api/internal/knowledge-base`) + `KB_ADMIN` (`/api/admin/knowledge-base`). Bỏ `SEARCH`/`DELETE` không thuộc scope nội bộ FE. Thay `TICKET_KB_REFS` (path sai) → `KB_REFERENCES` (`/api/knowledge-base/references` — LIST/ADD/REMOVE).
- **ticket-kb-refs (đầy đủ — BE đã bổ sung list+remove):** `ticket-kb.service.ts` (manager+staff) mock → axios thật:
  - LIST `GET /api/knowledge-base/references?ticketId=` → `TicketKbReferenceDto[]`
  - ADD `POST /api/knowledge-base/references` body `{ticketId, kbArticleId, referenceType, note?}`
  - REMOVE `DELETE /api/knowledge-base/references/{referenceId}`
  Giữ `TicketKbReferencesPanel` full (list + form add + remove); chỉ sửa path/type, không ẩn UI.
- `kb.enum.ts`: thêm `PendingReview` vào `KbArticleStatusEnum`; thêm `KbVersionStatusEnum` + labels.
- `kb.types.ts`: sửa DTO khớp BE thật (#5, #6, #8); thêm `KbArticleVersionDto`, `KbArticleDiffDto`+`DiffSection`, `KbArticleTemplateDto`; payload thêm `isInternalOnly`, `changeDescription`, `rollback(toVersionId)`, `rejectReason`; params list dùng `Q`/`Tag`/`Status`(int)/`Category`(int).
- 3 service mock (admin/manager/staff) → axios thật (giữ per-role). Map `keyword→Q`, `tags→Tag`.
- Hooks bổ sung: versions, compare, copy-template, approve-review, reject-review, rollback, publish, archive.
- UI nội bộ: KbList (filter thêm `PendingReview`), KbDetail (version history + diff + review actions + rollback), KbEditor (recommendedParts array, isInternalOnly, changeDescription, copy-template).
- **Bước 0:** cập nhật `docs/api-ticket.md` Nhóm 8 cho khớp BE thật (auth + param + compare + DTO field + lỗi encoding).
- Xóa `src/shared/mocks/kb.mock.ts`.

**Ngoài scope:**
- **KB public / customer-facing** → mobile/customer. Kéo theo `suggest` + `helpful` (Nhóm 8) **ngoài scope** — không build service/hook/UI.
- **`DELETE /api/admin/knowledge-base/{id}`** (Admin-only soft delete) → không thuộc luồng authoring/review của issue này → để issue khác.
- **Service architecture** → giữ **per-role** (feature-isolation), không gộp shared.
- `viewCount`/`helpfulCount`/`reviewRequired` trong DTO: chỉ **hiển thị read-only**, không có action từ web.

---

## Endpoints (đã verify route + auth + param thật)

| Method | Path | Auth (role) | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/knowledge-base` | Mọi role đã login | Query: `Q?`, `Category?`(int), `Status?`(int), `Tag?`(string), `PageNumber`, `PageSize` | `CommonResponse<PaginationResponse<KbArticleListItemDto>>` |
| GET | `/api/knowledge-base/{id}` | Mọi role đã login | — | `CommonResponse<KbArticleDto>` |
| POST | `/api/internal/knowledge-base` | Staff/Mgr/Admin | body Create (xem Types) | `CommonResponse<KbArticleActionDto>` (bài → `PendingReview`) |
| PUT | `/api/internal/knowledge-base/{id}` | Staff/Mgr/Admin | body Update (`changeDescription?`) | `CommonResponse<KbArticleDto>` |
| GET | `/api/internal/knowledge-base/{id}/versions` | Staff/Mgr/Admin | — | `CommonResponse<KbArticleVersionDto[]>` |
| GET | `/api/internal/knowledge-base/{id}/versions/{versionId}` | Staff/Mgr/Admin | — | `CommonResponse<KbArticleVersionDto>` |
| GET | `/api/internal/knowledge-base/{id}/compare` | Staff/Mgr/Admin | Query: `FromVersionId`(Guid, req), `ToVersionId?`(Guid) | `CommonResponse<KbArticleDiffDto>` |
| GET | `/api/internal/knowledge-base/{id}/copy-template` | Staff/Mgr/Admin | — | `CommonResponse<KbArticleTemplateDto>` |
| POST | `/api/admin/knowledge-base/{id}/approve-review` | Mgr/Admin | — | `CommonResponse<KbArticleActionDto>` (→ `Published`) |
| POST | `/api/admin/knowledge-base/{id}/reject-review` | Mgr/Admin | body `{ reason }` (req) | `CommonResponse<KbArticleActionDto>` |
| POST | `/api/admin/knowledge-base/{id}/publish` | Mgr/Admin | — | `CommonResponse<KbArticleActionDto>` |
| POST | `/api/admin/knowledge-base/{id}/archive` | Mgr/Admin | — | `CommonResponse<KbArticleActionDto>` |
| POST | `/api/admin/knowledge-base/{id}/rollback` | Mgr/Admin | body `{ toVersionId }`(Guid, req) | `CommonResponse<KbArticleActionDto>` |
| GET | `/api/knowledge-base/references?ticketId=` | Staff/Mgr/Admin | query `ticketId` | `CommonResponse<TicketKbReferenceDto[]>` |
| POST | `/api/knowledge-base/references` | Staff/Mgr/Admin | body `{ ticketId, kbArticleId, referenceType, note? }` | `CommonResponse<object>` (403 nếu ticket Resolved/Closed) |
| DELETE | `/api/knowledge-base/references/{referenceId}` | Staff/Mgr/Admin | — | `CommonResponse<object>` (soft delete) |

> **ticket-kb-refs:** 3 endpoint trên **mới được thêm vào BE** (branch `feat/ticket-kb-references-list-remove`, repo backend). FE integrate được sau khi BE merge / chạy local. `referenceType` response trả **chuỗi** (`JsonStringEnumConverter`).

Phân quyền (gate UI bằng `checkRole`): read/create/update/versions/compare/copy-template = Staff+Manager+Admin · approve/reject/publish/archive/rollback = Manager+Admin (Staff KHÔNG có).

---

## Enums

| Enum | File nguồn | Thay đổi |
|------|-----------|----------|
| `KbArticleStatusEnum` | `shared/enums/kb.enum.ts` | **Thêm `PendingReview: 2`** → `{Draft:1, PendingReview:2, Published:3, Archived:4}` + label "Chờ duyệt" |
| `KbVersionStatusEnum` | `shared/enums/kb.enum.ts` | **Tạo mới** `{Pending:1, Approved:2, Rejected:3, Archived:4}` + labels |
| `KbReferenceTypeEnum` | `shared/enums/kb.enum.ts` | giữ nguyên (ngoài scope) |
| `TicketCategoryEnum` | `shared/enums/ticket.enum.ts` | dùng lại (KB share category với ticket) |

> ⚠️ **Số value enum status đổi từ `{Draft:1,Published:2,Archived:3}` → `{Draft:1,PendingReview:2,Published:3,Archived:4}`.** Mọi consumer dùng hằng `KbArticleStatusEnum.Published` thì không vỡ logic, nhưng **badge/filter/table phải rà lại** vì giá trị số Published đổi 2→3, Archived 3→4. **Bắt buộc so sánh bằng hằng `KbArticleStatusEnum.X`, KHÔNG hardcode số.**

---

## Types (khớp BE thật)

```ts
// status/category đọc từ response = STRING enum; version.status = số
interface KbArticleDTO {
  id: string; code: string;
  category: TicketCategoryEnum;          // string enum ("Charging")
  title: string; symptoms: string; diagnosisSteps: string; solutionSteps: string;
  recommendedParts?: string[] | null;    // ⬅ ĐỔI: string[] (was string)
  tags: string[];
  status: KbArticleStatusEnum;           // string enum
  isInternalOnly: boolean;               // ⬅ THÊM
  version: number;
  viewCount: number; helpfulCount: number;
  reviewRequired: boolean;               // ⬅ THÊM
  pendingReviewBy?: string | null;       // ⬅ THÊM
  managerRejectReason?: string | null;   // ⬅ THÊM
  createdByUserId: string;
  createdAt: string; updatedAt?: string | null;
}

interface KbArticleSummaryDTO {          // = KbArticleListItemDto
  id: string; code: string; title: string;
  category: TicketCategoryEnum;
  status: KbArticleStatusEnum;
  viewCount: number; helpfulCount: number;
  reviewRequired: boolean;               // ⬅ THÊM
  createdAt: string;                     // ⬅ THÊM
  // ❌ BỎ: tags (list item BE không trả)
}

interface KbArticleVersionDto {
  id: string; articleId: string;
  majorVersion: number; minorVersion: number;
  status: number;                        // raw int → map KbVersionStatusEnum thủ công
  title: string; symptoms: string; diagnosisSteps: string; solutionSteps: string;
  recommendedParts?: string[] | null; tags: string[];
  changeDescription: string; changedBy: string; createdAt: string;
}

interface DiffSection { oldValue: string; newValue: string; isChanged: boolean; }
interface KbArticleDiffDto {
  fromVersion: string; toVersion: string;
  titleDiff: DiffSection; symptomsDiff: DiffSection;
  diagnosisStepsDiff: DiffSection; solutionStepsDiff: DiffSection;
  recommendedPartsDiff: DiffSection; tagsDiff: DiffSection;
}

interface KbArticleTemplateDto {         // ✅ verified từ CopyKbArticleTemplateQuery.cs
  category: number;                      // int (raw) → map TicketCategoryEnum
  symptoms: string; diagnosisSteps: string; solutionSteps: string;
  recommendedParts?: string[] | null; tags: string[];
  // ❌ KHÔNG có title/id
}

// Payloads
interface CreateKbArticlePayload {
  category: number;                      // gửi int (Enum.IsDefined check)
  title: string; symptoms: string; diagnosisSteps: string; solutionSteps: string;
  recommendedParts?: string[]; tags?: string[];
  isInternalOnly: boolean;               // ⬅ THÊM
}
interface UpdateKbArticlePayload extends CreateKbArticlePayload {
  changeDescription?: string;            // nullable theo BE (không required)
}
interface RejectReviewPayload { reason: string; }       // required
interface RollbackPayload { toVersionId: string; }      // Guid, required

// Params list
interface KbArticleListParams {
  pageNumber?: number; pageSize?: number;
  q?: string;                            // map → Q (was keyword)
  category?: number;                     // int
  status?: KbArticleStatusEnum;          // gửi value số (1-4)
  tag?: string;                          // 1 tag/lần → Tag
}
```

> **Lưu ý category int vs string:** response trả string enum, nhưng *create/update/filter* gửi **int**. Type response = `TicketCategoryEnum` (string union); payload/param = `number`. Đừng để lẫn.

## Schema (Zod) — editor
```ts
// kb-article.schema.ts (admin/manager/staff) — giới hạn lấy đúng từ ValidateAsync của BE
title:          z.string().min(1).max(200)
symptoms:       z.string().min(1).max(2000)
diagnosisSteps: z.string().min(1).max(4000)
solutionSteps:  z.string().min(1).max(4000)
category:       z.nativeEnum(TicketCategoryEnum)
recommendedParts: z.array(z.string()).optional()
tags:           z.array(z.string().max(50)).max(10).optional()
isInternalOnly: z.boolean().default(false)
changeDescription: z.string().optional()   // chỉ form Update
```

---

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `docs/api-ticket.md` | modify | **Bước 0:** Nhóm 8 khớp BE thật (auth/param/compare/DTO/encoding) |
| `src/shared/utils/endpoints.ts` | modify | Thay `KB_ARTICLES`(`/api/kb-articles`) → `KNOWLEDGE_BASE`+`KB_INTERNAL`+`KB_ADMIN`; thay `TICKET_KB_REFS` → `KB_REFERENCES` (`/api/knowledge-base/references` LIST/ADD/REMOVE) |
| `src/features/{manager,staff}/services/ticket-kb.service.ts` | modify | mock → axios thật: list (`?ticketId=`), add (body), remove (`/{refId}`) |
| `src/features/{manager,staff}/hooks/useTicketKbRefs.ts` | modify | giữ cả 3 hook (list/add/remove), trỏ service thật |
| `src/features/{manager,staff}/components/TicketKbReferencesPanel.tsx` | modify | giữ full UI; sửa type `referenceType` (string), bỏ phụ thuộc mock |
| `src/shared/enums/kb.enum.ts` | modify | thêm `PendingReview`; thêm `KbVersionStatusEnum` + labels |
| `src/shared/types/kb.types.ts` | modify | DTO/payload/params khớp BE thật (xem Types) |
| `src/shared/utils/queryKeys.ts` | modify | thêm `kb.versions(id)`, `kb.compare(id, fromId, toId)` |
| `src/features/admin/services/kb.service.ts` | modify | mock → axios; + versions/compare/template/approve/reject/publish/archive/rollback |
| `src/features/manager/services/kb.service.ts` | modify | như admin |
| `src/features/staff/services/kb.service.ts` | modify | mock → axios; read+create+update+versions+compare+template (KHÔNG workflow) |
| `src/features/admin/hooks/useAdminKb.ts` | modify | thêm hooks workflow + versions/compare/template |
| `src/features/manager/hooks/useManagerKb.ts` | modify | thêm approve/reject/rollback + versions/compare/template |
| `src/features/staff/hooks/useStaffKb.ts` | modify | thêm create/update/versions/compare/template |
| `src/features/admin/schemas/kb-article.schema.ts` | modify | recommendedParts array, isInternalOnly, changeDescription |
| `src/features/manager/schemas/kb-article.schema.ts` | modify | như admin |
| `src/features/staff/schemas/kb-article.schema.ts` | create | schema cho staff editor |
| `src/features/admin/pages/KbDetailPage.tsx` | modify | review actions + version history + diff + rollback |
| `src/features/manager/pages/KbDetailPage.tsx` | modify | như admin |
| `src/features/staff/pages/KbDetailPage.tsx` | modify | version history (read-only) |
| `src/features/admin/pages/KbEditorPage.tsx` | modify | recommendedParts array, isInternalOnly, changeDescription, copy-template |
| `src/features/manager/pages/KbEditorPage.tsx` | modify | như admin |
| `src/features/staff/pages/KbEditorPage.tsx` | create | Staff authoring (create/update) — kèm route |
| `src/features/{admin,manager,staff}/pages/KbListPage.tsx` | modify | filter thêm `PendingReview` (status gửi int) |
| `src/features/{admin,manager}/components/KbArticleTable.tsx` | modify | cột status PendingReview |
| `src/shared/components/common/kb/KbStatusBadge.tsx` | modify | variant PendingReview |
| `src/shared/components/common/kb/KbEditorPanel.tsx` | modify | recommendedParts array + isInternalOnly + changeDescription |
| `src/shared/components/common/kb/KbArticleDetail.tsx` | modify | recommendedParts array, isInternalOnly badge, reviewRequired |
| `src/shared/components/common/kb/KbVersionHistory.tsx` | create | list versions + chọn để diff/rollback |
| `src/shared/components/common/kb/KbDiffViewer.tsx` | create | render `KbArticleDiffDto` (6 DiffSection) |
| `src/shared/components/common/kb/KbReviewActions.tsx` | create | Approve/Reject (PendingReview, Mgr/Admin) |
| `src/router/index.tsx` | modify | route `staff/kb/new`, `staff/kb/:id/edit` |
| `src/shared/mocks/kb.mock.ts` | delete | bỏ mock |

---

## Approach
- **Path thật + per-role service:** mỗi `kb.service.ts` đổi thân hàm mock → `axiosInstance` gọi `ENDPOINTS.KNOWLEDGE_BASE/KB_INTERNAL/KB_ADMIN`. Giữ tên export cũ để hook không vỡ, thêm method mới. Map `keyword→Q`, `tags→Tag`, status filter gửi **số**.
- **Review workflow:** Editor lưu (create/update) → BE đưa bài về `PendingReview`. Manager/Admin ở KbList lọc `Status=PendingReview` (BE hỗ trợ — verify #3) để thấy hàng chờ duyệt; ở KbDetail thấy `KbReviewActions` (Approve→Published / Reject+reason). Staff không thấy (gate `checkRole`).
- **Version history/diff/rollback:** KbDetail render `KbVersionHistory` (gọi `versions`), chọn 2 version (theo **versionId Guid**) → `KbDiffViewer` (gọi `compare` với `FromVersionId`/`ToVersionId`); Manager/Admin có nút Rollback (`toVersionId`).
- **Error handling:** form (Editor) dùng `try/catch + handleErrorApi({error, setError})`; action không form (approve/reject/publish/archive/rollback) dùng `onError` của mutation → toast. Invalidate `KEY.kb` + `kb.detail(id)` (+ `kb.versions(id)` sau rollback) sau mutation.

---

## Edge Cases
- **Số value enum status đổi (Published 2→3, Archived 3→4):** rà lại mọi so sánh số trong badge/filter/table — **dùng hằng `KbArticleStatusEnum.X`, KHÔNG hardcode số**.
- **`category`/`status` 2 chiều (string response ↔ int request):** không truyền thẳng giá trị response vào filter param. Filter gửi số; nếu cần map string→int dùng object enum.
- **`compare` dùng versionId (Guid), không phải số version** — UI version history phải truyền `id` của `KbArticleVersionDto`, không phải `majorVersion`.
- **`version.status` là số** (BE để raw int) → map `KbVersionStatusEnum` thủ công khi hiển thị, không treat là string.
- **`copy-template`** chỉ áp dụng bài có tag `template`/`example` → nút disable/ẩn nếu không hợp lệ; BE trả lỗi → toast.
- **`reject-review`/`rollback`/`update`**: thiếu `reason`/`toVersionId` → 400, map lỗi field (`Reason`/`ToVersionId`). `changeDescription` KHÔNG bắt buộc (BE không validate) — vẫn nên gửi.
- **`KbArticleTemplateDto`** đã verify: `category` là **số** (raw int) → map `TicketCategoryEnum`; không có title/id (chỉ copy nội dung khung vào form mới).
- **ticket-kb-refs:** ADD body cần `ticketId` (BE bind từ **body**, không phải route) → `AddTicketKbReferencePayload` thêm `ticketId`. `referenceType` trong response = **chuỗi** ("ConsultedDuringResolve") → đổi `KbReferenceTypeEnum` FE sang **string-valued** (hoặc map), vì `KbReferenceTypeLabel` hiện key bằng số sẽ vỡ. ADD bị **403** nếu ticket ở `Resolved`/`ClosedPendingRate`/`Closed` → toast.
- **Dependency BE:** 3 endpoint references vừa thêm ở backend (branch `feat/ticket-kb-references-list-remove`) — phải merge/chạy BE trước khi phần ticket-kb-refs của FE hoạt động.

---

## Acceptance Criteria
- [ ] Không còn import `kb.mock` trong codebase; `kb.mock.ts` đã **xóa hoàn toàn** (cả MOCK_KB_ARTICLES + MOCK_TICKET_KB_REFS).
- [ ] ticket-kb-ref đầy đủ: list (`GET ?ticketId=`) + add (`POST`, ticketId trong body) + remove (`DELETE /{refId}`) gọi API thật; panel hiển thị danh sách + gỡ được.
- [ ] Mọi KB call dùng path thật (`/api/knowledge-base`, `/api/internal/...`, `/api/admin/...`) qua `ENDPOINTS`.
- [ ] `KbArticleStatusEnum` có `PendingReview`; badge + filter hiển thị đúng 4 trạng thái với value số mới (so sánh bằng hằng enum).
- [ ] Staff/Manager/Admin xem list + detail từ API thật; field khớp BE (`reviewRequired`, `isInternalOnly`, `recommendedParts: string[]`).
- [ ] Staff/Manager/Admin tạo/sửa bài → bài về `PendingReview`.
- [ ] **Manager/Admin lọc được bài `PendingReview` qua KbList** (BE list hỗ trợ `Status` cho internal role) và Approve/Reject/Publish/Archive/Rollback hoạt động; Staff KHÔNG thấy các nút này.
- [ ] Version history + diff viewer hiển thị từ `versions`/`compare` (truyền versionId Guid).
- [ ] KHÔNG có service/hook/UI cho `suggest`/`helpful`/`delete` trên web.
- [ ] `docs/api-ticket.md` Nhóm 8 đã cập nhật khớp BE (Bước 0).
- [ ] `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS.

---

## Steps
- [ ] **Bước 0 (docs):** Cập nhật `docs/api-ticket.md` Nhóm 8 cho khớp BE thật: list endpoint **có auth + role filter** (không anonymous), param `Q`/`Tag`/`Status`(int)/`Category`(int); `compare` dùng `FromVersionId`/`ToVersionId` (Guid); `KbArticleListItemDto`/`KbArticleDto` field thật; sửa lỗi encoding field name (`title`, `recommendedParts`, `tags`, `bool`, `false`, `fromVersion`, `toVersion`, `toVersionId`).
- [ ] Bước 1: ~~Verify `KbArticleTemplateDto`~~ — ✅ đã verify từ source BE. Toàn bộ shape DTO đã chốt, không còn ẩn số.
- [x] Bước 2: `endpoints.ts` (4 nhóm KB: KNOWLEDGE_BASE/KB_INTERNAL/KB_ADMIN/KB_REFERENCES) + `queryKeys.ts` (versions/compare). — 2026-06-17
- [x] Bước 3: `kb.enum.ts` (status string + KbArticleStatusCode + KbVersionStatusEnum + refType string) + `kb.types.ts` (DTO/payload/params khớp BE). — 2026-06-17
- [x] Bước 4: 3 service (admin/manager/staff) mock → axios thật + method mới (toListQuery map Q/Tag/Status int; compare/versions/template/workflow). — 2026-06-17
- [x] Bước 5: 3 hooks (list/detail/versions/compare/create/update/copyTemplate; admin+manager thêm approve/reject/publish/archive/rollback; staff không workflow). Bỏ useDeleteKbArticle. — 2026-06-17
- [ ] Bước 6: schemas (recommendedParts array, isInternalOnly, changeDescription; staff schema).
- [ ] Bước 7: shared components (KbStatusBadge, KbEditorPanel, KbArticleDetail) + mới (KbVersionHistory, KbDiffViewer, KbReviewActions).
- [ ] Bước 8: pages (KbList filter PendingReview, KbDetail workflow/version, KbEditor) + staff editor page + route.
- [ ] Bước 8b: ticket-kb-refs — `ticket-kb.service` list/add/remove thật + `useTicketKbRefs` (3 hook trỏ API thật) + `TicketKbReferencesPanel` (referenceType string); `endpoints` `KB_REFERENCES`. **Cần BE branch merged.**
- [ ] Bước 9: xóa **hoàn toàn** `kb.mock.ts`; grep sạch import mock (cả ticket-kb).
- [ ] Bước 10: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS.

---

## Câu hỏi đã giải đáp
- **BE readiness:** BE KB đã implement đầy đủ (`backend/services/TicketService` — controllers + handlers + DTOs). Dùng endpoint + data thật, bỏ mock.
- **Internal-list (blocker cũ):** **ĐÃ GIẢI QUYẾT** — `GET /api/knowledge-base` cho internal role lọc theo `Status` → list được `PendingReview`. Không cần endpoint mới / fallback.
- **Enum string vs int:** **ĐÃ XÁC MINH** — response = string (`JsonStringEnumConverter`), request/filter = int. Cập nhật doc theo đây (Bước 0).
- **2 loại wiki:** web chỉ wiki nội bộ → KB public + `suggest` + `helpful` + `delete` ngoài scope.
- **Xóa mock:** xóa hoàn toàn `kb.mock.ts` → integrate ticket-kb **đầy đủ** (list/add/remove thật). 3 endpoint references **đã được bổ sung ở BE** (branch `feat/ticket-kb-references-list-remove`) + cập nhật `docs/api-ticket.md` (Nhóm 11 + `TicketKbReferenceDto`).
- **Service arch:** giữ **per-role** (feature-isolation, xem Scope › Ngoài scope).
