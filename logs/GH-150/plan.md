# Plan — GH-150: [FE] Blog module + KB template & enum contract sync

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-07-20
- **Issue:** #150 — https://github.com/GSU26SE55/frontend/issues/150
- **Sprint:** Sprint 5 (due 2026-07-25)
- **Dev:** Trần Minh Trí (@Shu1237)

## Mục tiêu

Xây mới toàn bộ **Blog module** trên web (hiện 0 file trong `src/`) và đồng bộ lại **KB contract** đã drift sau khi BE đổi enum sang chuỗi (2026-06-22). Output: 3 role Staff/Manager/Admin đều xem được blog, soạn thảo bằng WYSIWYG, xem lịch sử version, và Manager/Admin publish/archive/generate-from-kb được.

## Scope

**Trong scope:**
- Blog: enums, types, schemas, service (shared), hooks (per-role), components, pages, router — cả 3 role
- Trang đọc blog (`GET /api/blog`, chỉ bài `Published`) — cả 3 role xem được
- Editor WYSIWYG (Tiptap) cho `contentHtml` + sanitize khi render (DOMPurify)
- Version history + so sánh 2 version (side-by-side)
- Blog template: đọc (Staff+), CRUD (Admin only)
- `generate-from-kb` (Manager/Admin) + poll trạng thái `Generating`
- KB enum sync: `KbArticleVersionDTO.status`, `KbArticleTemplateDTO.category` → đổi `number` sang enum chuỗi
- KB `isTemplate`: thêm vào types + hiển thị badge + checkbox trong editor
- KB template list: `GET /api/internal/knowledge-base/templates`

**Bổ sung giữa chừng (mở rộng so với plan gốc):**
- Rich text (Tiptap) cho **cả Blog lẫn KB** — không chỉ Blog như dự kiến ban đầu
- Chèn ảnh vào nội dung: từ chat của ticket · upload · chụp bằng webcam · kéo thả · dán clipboard
- BE: mở quyền upload ảnh KB cho Staff

**Ngoài scope:**
- UI quản lý KB template phía Admin (Nhóm 10bis — `/api/admin/knowledge-base/templates`) → tách issue riêng
- Diff inline `<ins>/<del>` cho blog (dùng side-by-side thay thế)
- Gom service KB hiện có về `shared/` (giữ nguyên per-role, không refactor ngoài scope)
- Bổ sung các method KB còn thiếu ở service staff/manager (nợ kỹ thuật riêng)
- Blog cho Customer (mobile app, không thuộc web)

## Dependencies

| Phụ thuộc | Trạng thái | Ảnh hưởng |
|---|---|---|
| BE `feat/GH-671-blog` | **Chưa merge** | Toàn bộ endpoint Blog + `isTemplate` trong DTO + `GET /internal/blog/{id}` nằm ở branch này. FE không chạy được tới khi BE merge & deploy. |
| FE PR #149 (`refactor/reorganize-feature-folders`) | **Open, chưa merge** | Quyết định đường dẫn file. Plan này bám cấu trúc **sau** refactor (`components/kb/`, `services/kb/`…). Nên merge #149 trước khi implement. |
| BE fix contract (7 file, build pass, 830 test pass) | **Chưa commit** | Gồm: `isTemplate` vào response DTO · `GET /api/blog/{id}` trả 404 khi chưa Published · `GET /api/internal/blog/{id}` mới · 6 endpoint `Ok()` → `StatusCode()`. |

## Enums

| Enum | File nguồn (tạo mới) |
|---|---|
| `BlogPostStatusEnum` | `shared/enums/blog/blog.enum.ts` |
| `BlogPostOriginEnum` | `shared/enums/blog/blog.enum.ts` |

Pattern `as const` object + type alias (KHÔNG dùng TS native enum). Giá trị là **chuỗi** khớp BE (`JsonStringEnumConverter`):

```ts
export const BlogPostStatusEnum = {
  Generating: "Generating",
  GenerationFailed: "GenerationFailed",
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;
export type BlogPostStatusEnum = (typeof BlogPostStatusEnum)[keyof typeof BlogPostStatusEnum];

export const BlogPostOriginEnum = {
  Manual: "Manual",
  AiGeneratedFromKb: "AiGeneratedFromKb",
} as const;
export type BlogPostOriginEnum = (typeof BlogPostOriginEnum)[keyof typeof BlogPostOriginEnum];
```

Kèm `BlogPostStatusLabel` (nhãn tiếng Việt cho badge).

## Types

`shared/types/blog/blog.types.ts` — re-export enum từ `enums/`, không định nghĩa inline:

```ts
interface BlogPostDTO {
  id: string; title: string; slug: string; summary: string;
  contentHtml: string;
  status: BlogPostStatusEnum; origin: BlogPostOriginEnum;
  sourceKbArticleId?: string | null; blogTemplateId?: string | null;
  authorUserId: string; currentVersion: number;
  createdAt: string; updatedAt?: string | null;
}
interface BlogPostListItemDTO { /* như trên, KHÔNG có contentHtml */ }
interface BlogPostVersionDTO {
  id: string; blogPostId: string; versionNumber: number;
  title: string; summary: string; contentHtml: string;
  changedByUserId: string; changeNote?: string | null; createdAt: string;
}
interface BlogDiffDTO {
  oldVersionNumber: number; newVersionNumber: number;
  oldContentHtml: string; newContentHtml: string;
}
interface BlogPostActionDTO { id: string; title: string; status: BlogPostStatusEnum; currentVersion: number; }
interface BlogTemplateDTO {
  id: string; name: string; description: string; contentHtml: string;
  isActive: boolean; createdByUserId: string; createdAt: string; updatedAt?: string | null;
}

// Params — LƯU Ý: Blog dùng `page`, KB dùng `pageNumber`
interface BlogPostListParams { status?: BlogPostStatusEnum; origin?: BlogPostOriginEnum; page?: number; pageSize?: number; }
interface BlogCompareParams { oldVersionNumber: number; newVersionNumber: number; }
interface CreateBlogPostPayload { title: string; slug: string; summary: string; contentHtml: string; blogTemplateId?: string; }
interface UpdateBlogPostPayload extends CreateBlogPostPayload { changeNote?: string; currentVersion: number; }
```

**Sửa types KB hiện có** (`shared/types/kb/kb.types.ts`):
- `KbArticleVersionDTO.status`: `number` → `KbVersionStatusEnum`
- `KbArticleTemplateDTO.category`: `number` → `TicketCategoryEnum`
- `KbArticleDTO` + `KbArticleSummaryDTO`: thêm `isTemplate: boolean`
- ~~`KbArticleListParams`: bỏ `category?: number`~~ **HỦY** — BE bind enum từ query nhận cả tên lẫn số, gửi int đang chạy đúng. Đổi = sờ 12 file, lợi ích 0, rủi ro vỡ AC F5. Giữ `KbCategoryCode`/`KbArticleStatusCode`.
- Payload create/update KB: thêm `isTemplate?: boolean`

## Schema (Zod)

`shared/schemas/blog/blog-post.schema.ts`:
```ts
title:       z.string().min(1).max(256)
slug:        z.string().min(1).max(300).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
summary:     z.string().min(1)
contentHtml: z.string().min(1)   // Tiptap trả HTML; validate rỗng bằng text đã strip tag
changeNote:  z.string().optional()
```

`shared/schemas/blog/blog-template.schema.ts`:
```ts
name:        z.string().min(1).max(200)
description: z.string().optional()
contentHtml: z.string().min(1)
isActive:    z.boolean().default(true)
```

Slug tự sinh từ `title` bằng `.normalize("NFD")` + regex (~5 dòng, không cài `slugify`).

## Endpoints

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/blog` | mọi role | `Origin?`, `Page`, `PageSize` | `CommonResponse<PaginationResponse<BlogPostListItemDTO>>` |
| GET | `/api/blog/{id}` | mọi role | — | `CommonResponse<BlogPostDTO>` · 404 nếu chưa Published |
| GET | `/api/internal/blog` | Staff+ | `Status?`, `Origin?`, `Page`, `PageSize` | `PaginationResponse<BlogPostListItemDTO>` |
| GET | `/api/internal/blog/{id}` | Staff+ | — | `BlogPostDTO` (mọi trạng thái — dùng để poll) |
| POST | `/api/internal/blog` | Staff+ | `CreateBlogPostPayload` | `201` · `BlogPostActionDTO` · 409 slug trùng |
| PUT | `/api/internal/blog/{id}` | Staff+ | `UpdateBlogPostPayload` | `BlogPostActionDTO` · 409 version/slug/status |
| GET | `/api/internal/blog/{id}/versions` | Staff+ | — | `BlogPostVersionDTO[]` |
| GET | `/api/internal/blog/{id}/compare` | Staff+ | `OldVersionNumber`, `NewVersionNumber` (**int**) | `BlogDiffDTO` |
| GET | `/api/internal/blog/templates` | Staff+ | `IsActive?` | `BlogTemplateDTO[]` (không phân trang) |
| GET | `/api/internal/blog/templates/{id}` | Staff+ | — | `BlogTemplateDTO` |
| POST | `/api/admin/blog/generate-from-kb/{kbId}` | Mgr/Admin | — | `202` · `BlogPostActionDTO` (`Generating`) |
| POST | `/api/admin/blog/{id}/publish` | Mgr/Admin | — | `BlogPostActionDTO` · 409 |
| POST | `/api/admin/blog/{id}/archive` | Mgr/Admin | — | `BlogPostActionDTO` |
| DELETE | `/api/admin/blog/{id}` | Mgr/Admin | — | `BlogPostActionDTO` |
| POST | `/api/admin/blog/templates` | **Admin** | name/description/contentHtml | `201` · `BlogTemplateDTO` |
| PUT | `/api/admin/blog/templates/{id}` | **Admin** | + `isActive` | `BlogTemplateDTO` |
| DELETE | `/api/admin/blog/templates/{id}` | **Admin** | — | `BlogTemplateDTO` |
| GET | `/api/internal/knowledge-base/templates` | Staff+ | như KB list | `PaginationResponse<KbArticleListItemDTO>` |

## Files

| File | Action | Ghi chú |
|---|---|---|
| `package.json` + `pnpm-lock.yaml` | modify | + `@tiptap/react` `@tiptap/starter-kit` `@tiptap/pm` `@tiptap/core` `dompurify` (dùng **pnpm**, KHÔNG dùng npm — repo do pnpm quản lý) |
| `src/shared/enums/blog/blog.enum.ts` | create | 2 enum + label map |
| `src/shared/types/blog/blog.types.ts` | create | 6 DTO + params + payloads |
| `src/shared/types/kb/kb.types.ts` | modify | sync enum + `isTemplate` |
| `src/shared/schemas/blog/blog-post.schema.ts` | create | zod |
| `src/shared/schemas/blog/blog-template.schema.ts` | create | zod |
| `src/shared/services/blog/blog.service.ts` | create | service dùng chung 3 role |
| `src/shared/utils/endpoints.ts` | modify | + `BLOG`, `BLOG_INTERNAL`, `BLOG_ADMIN`, `BLOG_TEMPLATES`, `KB_INTERNAL.TEMPLATES` |
| `src/shared/utils/queryKeys.ts` | modify | + `KEY.blog`, `QUERY_KEY.blog.*` |
| `src/shared/lib/sanitizeHtml.ts` | create | wrapper DOMPurify |
| `src/shared/lib/slugify.ts` | create | ~5 dòng |
| `src/shared/components/blog/BlogEditor.tsx` | create | Tiptap + toolbar, bind qua `Controller` |
| `src/shared/components/blog/BlogContentView.tsx` | create | render HTML đã sanitize |
| `src/shared/components/blog/BlogStatusBadge.tsx` | create | theo `KbStatusBadge` |
| `src/shared/components/blog/BlogVersionHistory.tsx` | create | theo `KbVersionHistory` |
| `src/shared/components/blog/BlogDiffViewer.tsx` | create | side-by-side 2 panel sanitized |
| `src/shared/components/blog/BlogEditorPanel.tsx` | create | form RHF + zodResolver |
| `src/features/{staff,manager,admin}/hooks/blog/useBlog.ts` | create ×3 | TanStack Query, quyền khác nhau |
| `src/features/{staff,manager,admin}/pages/BlogListPage.tsx` | create ×3 | |
| `src/features/{staff,manager,admin}/pages/BlogDetailPage.tsx` | create ×3 | |
| `src/features/{staff,manager,admin}/pages/BlogEditorPage.tsx` | create ×3 | |
| `src/features/admin/pages/BlogTemplatePage.tsx` | create | CRUD template, Admin only |
| `src/features/admin/components/blog/BlogTemplateTable.tsx` | create | |
| `src/router/index.tsx` | modify | + route `blog`, `blog/new`, `blog/:id`, `blog/:id/edit` ×3 role; `blog/templates` (admin) |
| `src/shared/components/kb/KbEditorPanel.tsx` | modify | + checkbox `isTemplate` |
| `src/features/{staff,manager,admin}/pages/KbEditorPage.tsx` | modify ×3 | + checkbox `isTemplate` |
| `src/shared/schemas/kb/kb-article.schema.ts` | modify | + `isTemplate` |

## Approach

- **Service dùng chung** `shared/services/blog/blog.service.ts` (không chứa logic role); **hook per-role** trong `features/*/hooks/blog/` để giữ tách bạch quyền — tránh nhân 3 lần service như KB đang bị lệch.
- **Poll generate-from-kb:** `POST generate-from-kb` → `202` trả `data.id` → `useQuery` `GET /api/internal/blog/{id}` với `refetchInterval: 3000`, tự dừng khi `status` ∈ {`Draft`, `GenerationFailed`}, `staleTime: 0`.
- **Optimistic concurrency:** form Update giữ `currentVersion` lấy từ lần GET gần nhất; submit qua `mutateAsync` trong `try/catch` + `handleErrorApi({ error, setError })`. Gặp `409` → toast + refetch detail để nạp `currentVersion` mới.
- **Sanitize:** mọi `contentHtml` (kể cả bài AI sinh) đều đi qua `sanitizeHtml()` trước khi `dangerouslySetInnerHTML`. Không render HTML thô ở bất kỳ đâu.
- **Diff:** `BlogDiffViewer` render 2 panel cạnh nhau từ `oldContentHtml`/`newContentHtml` (đã sanitize). Không cài `htmldiff-js`.

## Edge Cases

- `slug` trùng → `409` khi create/update → map lỗi xuống field `slug` bằng `setError`.
- `currentVersion` lệch → `409` "đã được cập nhật bởi người khác" → toast + reload detail, không mất nội dung đang soạn.
- Bài `Generating` → chặn edit (BE trả `409`); UI disable nút Sửa + hiện spinner trạng thái.
- Bài `Archived` → BE `409` khi edit/publish; UI ẩn 2 nút đó.
- `GenerationFailed` → vẫn cho `PUT` sửa thủ công; hiện banner báo AI thất bại.
- `publish` khi status ∈ {`Generating`, `GenerationFailed`, `Published`, `Archived`} → `409`, mỗi trường hợp message khác nhau → hiện message từ BE, không hardcode.
- Poll không bao giờ kết thúc (AI treo) → giới hạn ~40 lần (2 phút) rồi dừng, hiện nút "Thử lại".
- Paging: Blog dùng `Page`, KB dùng `PageNumber` — **response** cả hai đều trả `pageNumber`. Không dùng nhầm.
- `GET /api/blog/{id}` trả `404` cho bài chưa Published → trang public hiện "Không tìm thấy", không phải lỗi hệ thống.

## Acceptance Criteria

> Cột **BE?** = có cần backend chạy thật mới verify được không. `—` = verify được ngay bằng build/đọc code.

### A. Phân quyền theo role

| # | Tiêu chí | Cách verify | BE? |
|---|---|---|---|
| A1 | 3 role Staff/Manager/Admin đều vào được `/{role}/blog` và thấy danh sách | Login từng role, mở route | ✅ |
| A2 | Staff **không** thấy nút publish / archive / delete / generate-from-kb | Login Staff, mở BlogDetail — DOM không chứa 4 nút đó | ✅ |
| A3 | Manager/Admin thấy và bấm được publish / archive / delete | Login Manager, thao tác từng nút, list cập nhật đúng | ✅ |
| A4 | Chỉ Admin thấy trang quản lý blog template; Staff/Manager chỉ đọc danh sách | Login Staff → không có route `/staff/blog/templates`; login Admin → CRUD được | ✅ |
| A5 | Gọi thẳng API không đủ quyền → nhận `403`, UI hiện thông báo, không crash | DevTools gọi `POST /api/admin/blog/{id}/publish` bằng token Staff | ✅ |

### B. Editor & nội dung

| # | Tiêu chí | Cách verify | BE? |
|---|---|---|---|
| B1 | Tiptap lưu và tải lại đúng `contentHtml` (bold/italic/heading/list/link/image) | Soạn bài đủ 6 loại format → save → reload → so khớp | ✅ |
| B2 | **Mọi** chỗ render `contentHtml` đều đi qua `sanitizeHtml()` | `grep dangerouslySetInnerHTML` — mọi hit đều nhận kết quả `sanitizeHtml()` | — |
| B3 | HTML độc bị vô hiệu hóa | Lưu bài chứa `<script>alert(1)</script>` và `<img onerror=alert(1)>` → render ra không chạy JS | ✅ |
| B4 | `slug` tự sinh từ `title`, bỏ dấu tiếng Việt đúng | Nhập "Pin không sạc được" → slug `pin-khong-sac-duoc` | — |
| B5 | Form trống/quá độ dài bị chặn ở client trước khi gọi API | Submit rỗng; `title` 257 ký tự; `slug` 301 ký tự → hiện lỗi zod, không có request nào bay đi | — |

### C. Version & diff

| # | Tiêu chí | Cách verify | BE? |
|---|---|---|---|
| C1 | Mỗi lần `PUT` thành công sinh 1 version mới, history hiện đủ theo thứ tự | Sửa bài 3 lần → history có 3 bản, `versionNumber` tăng dần | ✅ |
| C2 | So sánh 2 version ra side-by-side đúng nội dung cũ/mới | Chọn v1 và v3 → panel trái = `oldContentHtml`, phải = `newContentHtml` | ✅ |
| C3 | Compare gửi đúng param **int** `OldVersionNumber`/`NewVersionNumber` | Network tab: query string là số, không phải GUID | ✅ |
| C4 | HTML trong diff cũng được sanitize | Bài có `<script>` ở version cũ → panel diff không chạy JS | ✅ |

### D. Sinh blog bằng AI (async)

| # | Tiêu chí | Cách verify | BE? |
|---|---|---|---|
| D1 | `generate-from-kb` trả `202`, UI chuyển ngay sang trạng thái `Generating` | Bấm generate từ 1 bài KB `Published` | ✅ |
| D2 | Poll qua `GET /api/internal/blog/{id}`, **không** dùng `GET /api/blog/{id}` | Network tab: request lặp trỏ `/internal/` | ✅ |
| D3 | Poll tự dừng khi `status` = `Draft` hoặc `GenerationFailed` | Đợi generate xong → request lặp ngừng hẳn | ✅ |
| D4 | Poll dừng sau ~2 phút nếu không có kết quả, hiện nút "Thử lại" | Chặn network sau khi bấm generate → đợi quá 40 lần | ✅ |
| D5 | Bài `GenerationFailed` vẫn sửa thủ công được, có banner báo lỗi | Mở bài `GenerationFailed` → nút Sửa bật, banner hiện | ✅ |
| D6 | Generate từ KB chưa `Published` hoặc đã có blog → `409`, hiện message từ BE | Bấm generate 2 lần liên tiếp trên cùng bài KB | ✅ |

### E. Xử lý lỗi

| # | Tiêu chí | Cách verify | BE? |
|---|---|---|---|
| E1 | `409` slug trùng → lỗi hiện **dưới input `slug`**, không phải toast | Tạo 2 bài cùng slug | ✅ |
| E2 | `409` version mismatch → toast + reload detail, nội dung đang soạn không mất | Mở 2 tab cùng bài, save tab A rồi save tab B | ✅ |
| E3 | Bài `Generating`/`Archived` → nút Sửa bị disable, không gọi API vô ích | Mở bài ở 2 trạng thái đó | ✅ |
| E4 | `GET /api/blog/{id}` với bài chưa publish → hiện "Không tìm thấy", không phải màn lỗi trắng | Lấy id bài `Draft`, mở trang public | ✅ |
| E5 | Form dùng `try/catch` + `handleErrorApi({ error, setError })`; action không form dùng `onError` | Đọc code: không có `onError` nào ở mutation của form | — |

### F. KB sync (regression — không được làm hỏng cái đang chạy)

| # | Tiêu chí | Cách verify | BE? |
|---|---|---|---|
| F1 | Badge "bài mẫu" hiện đúng theo `isTemplate` ở cả list và detail | Tạo 1 bài tick template, 1 bài không → so sánh | ✅ |
| F2 | Checkbox `isTemplate` giữ đúng trạng thái sau khi save + reload | Tick → save → F5 → vẫn tick | ✅ |
| F3 | `version.status` hiển thị nhãn tiếng Việt, không ra số hay `undefined` | Mở version history 1 bài KB bất kỳ | ✅ |
| F4 | `template.category` sau `copy-template` fill đúng vào select category | Bấm copy-template → form nhận đúng danh mục | ✅ |
| F5 | Toàn bộ luồng KB cũ (list/filter/detail/create/update/approve/publish/rollback) vẫn chạy | Regression thủ công theo AC của #84 | ✅ |
| F6 | Không còn chỗ nào khai enum KB là `number` | `grep -n "category?: number\|status: number" src/shared/types/kb/` → 0 kết quả | — |

### G. Quality gate

| # | Tiêu chí | Cách verify | BE? |
|---|---|---|---|
| G1 | Type check sạch | `pnpm exec tsc -p tsconfig.app.json --noEmit` → 0 lỗi | — |
| G2 | Lint sạch tuyệt đối | `pnpm exec eslint . --max-warnings=0` → 0 warning | — |
| G3 | Build thành công | `pnpm build` → exit 0 | — |
| G4 | Không vi phạm feature isolation | ESLint `no-restricted-imports` không báo — `features/*` không import chéo nhau | — |
| G5 | Không có `console.log` sót lại | `grep -rn "console.log" src/` trên diff của PR → 0 | — |
| G6 | Không tạo axios instance mới, không dùng `localStorage` | Đọc diff: chỉ import `shared/lib/axios.ts` | — |

**Tổng: 37 tiêu chí** (A5 · B5 · C4 · D6 · E5 · F6 · G6) — **11** verify được ngay không cần BE (B2, B4, B5, E5, F6, G1–G6); **26** còn lại cần `feat/GH-671-blog` merge + deploy.

## Steps

- [x] **Bước 0:** branch `feat/GH-150-blog-module` (stacked trên `refactor/reorganize-feature-folders` — theo chỉ đạo, KHÔNG rebase); `pnpm add` 5 gói — 2026-07-19
- [x] **Bước 1 (Types):** `shared/enums/blog/blog.enum.ts` + `shared/types/blog/blog.types.ts`; sync `shared/types/kb/kb.types.ts` + `kb.enum.ts` — 2026-07-19
- [x] **Bước 2 (Service):** `endpoints.ts` + `queryKeys.ts` → `shared/services/blog/blog.service.ts` — 2026-07-19
- [x] **Bước 3 (Hooks):** hook đầy đủ ở `shared/hooks/blog/useBlog.ts` (gồm `useBlogGenerationStatus` poll). ~~3 file per-role re-export theo quyền~~ — **đã xóa ở review**: các view dùng chung import thẳng từ `shared/` nên 3 file đó là code chết, hàng rào import không tồn tại. Phân quyền thật do BE `[Authorize]` + prop `canWorkflow` đảm nhiệm — 2026-07-20
- [x] **Bước 4 (Component + Page):** component 2026-07-19; view dùng chung `BlogListView`/`BlogDetailView`/`BlogEditorView` + 9 page mỏng ×3 role + `BlogTemplatePage` (Admin) — 2026-07-20
- [x] **Bước 5 (KB sync):** `isTemplate` vào schema dùng chung + `KbEditorPanel` + `KbEditorPage` ×3; `KbTemplateBadge` mới, gắn ở `KbArticleDetail` + `KbArticleTable` ×3 — 2026-07-20
- [x] **Bước 6 (Router):** 14 route blog ×3 role (`blog/templates` đặt TRƯỚC `blog/:id` để không bị nuốt thành param) + mục sidebar 3 role + `SIDEBAR_LABELS.blog`/`blogTemplates` — 2026-07-20
- [x] **Bước 7 (Quality gate):** `tsc -p tsconfig.app.json` 0 lỗi · `eslint . --max-warnings=0` exit 0 · `pnpm build` OK — 2026-07-20 _(chạy lại sau khi xong Bước 4–6)_

### Bước phát sinh — Rich text + ảnh trong bài viết (ngoài scope plan gốc)

Yêu cầu bổ sung giữa chừng: soạn bài "như Word" — gõ text, chèn ảnh, gán URL; ảnh lấy từ **đoạn chat của ticket**, từ **máy**, hoặc **tự chụp**.

- [x] **P1:** `AuthImageNode` + `AuthImageView` — Tiptap node lưu `<img data-file-id>`, NodeView tải blob (file cần Bearer nên không đặt URL API thẳng vào `src`) — 2026-07-19
- [x] **P2:** `ImagePickerDialog` 3 tab (Ảnh từ chat · Tải lên · Chụp ảnh) + `CameraCapture` (getUserMedia video — repo trước chỉ có audio) — 2026-07-19
- [x] **P3:** `useTicketChatFiles` + `ENDPOINTS.TICKETS.CHAT_FILES` — dùng `GET /api/tickets/{id}/chats/files` (BE có sẵn, FE chưa từng gọi) — 2026-07-19
- [x] **P4:** `RichTextEditor` (đổi tên từ `BlogEditor`, chuyển sang `shared/components/editor/`) + kéo thả + dán clipboard; `RichContentView` — 2026-07-20
- [x] **P5:** KB chuyển sang rich text — `symptoms`/`diagnosisSteps`/`solutionSteps` từ `<Textarea>` → `RichTextEditor` ở `KbEditorPanel` + `KbEditorPage` ×3; schema validate theo text thuần; nới giới hạn cho khớp BE (10000/20000/20000 thay vì 2000/4000/4000) — 2026-07-20
- [x] **P6:** Tương thích ngược — `isHtmlContent()` phân biệt bài cũ (text thuần) với bài mới (HTML); `SectionContent` và `KbDiffViewer` render theo từng loại; `.rich-content` CSS (Tailwind preflight xóa style mặc định của h2/ul/blockquote) — 2026-07-20
- [x] **P7:** `ticketId` truyền từ `TicketKbReferencesPanel` → `KbEditorPanel` (panel vốn đã mở trong ngữ cảnh ticket, không cần thêm nút/điều hướng) — 2026-07-20
- [x] **P9:** Sửa `Select` theo đúng pattern repo — Base UI `Select.Value` render **value thô** nếu Root không nhận `items` map value→label; thiếu prop này filter hiện "Draft"/"Published" thay vì nhãn tiếng Việt (không lỗi compile, chỉ sai khi nhìn) — 2026-07-20
- [x] **P8 (BE):** `FileAuthorizationService.CanUpload` cho Staff upload `KbImage` (trước chỉ Admin/Manager, mà Staff mới là người soạn KB) + 8 unit test cho `CanUpload` (trước đó **không có test nào**) — build ✓, 37/37 test ✓ — 2026-07-20

## Câu hỏi đã giải đáp

| Câu hỏi | Trả lời |
|---|---|
| Role nào có UI Blog? | Cả 3 (Staff/Manager/Admin) đều xem được; quyền ghi phân theo BE |
| Kiến trúc service? | Service dùng chung ở `shared/`, hook + page per-role |
| Diff blog? | Side-by-side, KHÔNG cài `htmldiff-js` (lib 2022, không có type, rủi ro với TS 6) |
| Thư viện? | **Cuối cùng 5 gói:** `@tiptap/react` `@tiptap/starter-kit` `@tiptap/pm` `@tiptap/core` `dompurify`. Bỏ/gỡ: `@types/dompurify` (deprecated stub) · `@tiptap/extension-link` (có sẵn trong starter-kit v3) · `htmldiff-js` (2019, không types) · `slugify` (regex 5 dòng) · `@formkit/drag-and-drop` (cài rồi gỡ — kéo thả dùng HTML5 native) · `@tiptap/extension-image` (cài rồi gỡ — thay bằng `AuthImageNode` vì ảnh cần Bearer) |
| Ảnh lưu thế nào? | `<img data-file-id="uuid">` trong HTML, viewer tải blob qua axios. KHÔNG base64 (phình mọi response), KHÔNG presigned URL (hết hạn → ảnh chết) |
| Repo dùng npm hay pnpm? | **pnpm** — `pnpm-lock.yaml` commit trong git, `node_modules/.pnpm/` 585 gói. `npm install` sinh lỗi ERESOLVE bịa về package `knip` không tồn tại |
| `isTemplate` filter được không? | KHÔNG — `[BindNever]` + controller ghi đè. Dùng `GET /internal/knowledge-base/templates` để liệt kê bài mẫu |
| Poll `Generating` kiểu gì? | `GET /api/internal/blog/{id}` (endpoint mới, BE đã thêm). KHÔNG dùng `GET /api/blog/{id}` — trả 404 khi chưa Published |

## Sửa sau code review (2026-07-20)

| # | Vấn đề | Cách sửa |
|---|---|---|
| W1 | `useStaffBlog.ts`/`useManagerBlog.ts` 0 import — hàng rào quyền ở tầng import **không tồn tại** vì view dùng chung import thẳng từ `shared/` | Xóa cả 3 file per-role, `BlogTemplatePage` import từ `shared/`; sửa lại mô tả trong plan + issue cho đúng sự thật |
| W2 | `dataUpdateCount` tính cả lần fetch của `useBlogDetail` (chung queryKey) → poll dừng sớm, AC D4 sai | Đếm bằng `useRef` cục bộ, reset khi `enabled` bật lại |
| W3 | `queryKey` inline ở `useTicketChatFiles` | Thêm `QUERY_KEY.ticketChatFiles.list()` |
| W4 | `htmlToPlainText` gọi `document` từ trong zod schema → vỡ khi chạy ngoài trình duyệt | Fallback regex strip tag khi `typeof document === "undefined"` |
| W5 | Ô tìm kiếm blog chỉ lọc trang hiện tại (BE không có param từ khóa) → dễ hiểu nhầm | Đổi nhãn thành "Lọc trong trang này…" + empty state nói rõ, gợi ý chuyển trang |

## Ghi chú rủi ro

- **⚠️ Quality gate `tsc --noEmit` của dự án là no-op.** `tsconfig.json` gốc có `"files": []` + chỉ chứa `references` → solution-style tsconfig, `tsc --noEmit` không đọc file nào, luôn exit 0. Lệnh đúng: `tsc -p tsconfig.app.json --noEmit`. Rule `.claude/rules/workflow.md` và mọi plan trước đều ghi lệnh sai → **cổng này chưa từng chặn được gì**. Chạy đúng lệnh phát hiện ngay 3 lỗi thật (bug AC F4).
- **KB đổi sang HTML là thay đổi một chiều.** Bài mới lưu HTML, bài cũ vẫn text thuần; `isHtmlContent()` phân biệt lúc render. Không có migration — cố ý, để không đụng dữ liệu đang chạy.
- **Chưa test thực tế lần nào.** Toàn bộ mới verify ở mức compile/lint/build. 26/37 AC cần BE chạy thật.

- **Chưa chốt base branch chính thức.** Plan giả định merge #149 trước rồi branch từ `dev`. Nếu đổi sang stack lên branch refactor thì đường dẫn file giữ nguyên, chỉ khác lịch sử commit.
- **BE `feat/GH-671-blog` chưa merge** — không test end-to-end được cho tới khi BE lên `dev` và deploy. Bước 1–4 code được trước, Bước 7 verify build được, nhưng smoke test API phải chờ.
