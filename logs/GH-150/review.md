## BÁO CÁO CODE REVIEW — feat/GH-150-blog-module — 2026-07-20
### Scope: FE (Web)
### Effort: Deep

### TÓM TẮT

Blog module mới + KB chuyển sang rich text + tính năng chèn ảnh: 59 mục thay đổi, cả 3 cổng chất lượng PASS (`tsc` 0 lỗi · `eslint --max-warnings=0` exit 0 · `pnpm build` ✓). Kiến trúc, phân quyền route, và pattern xử lý lỗi đều đúng chuẩn dự án. **FAIL** vì 2 vấn đề Critical liên quan tới nội dung commit, không phải chất lượng code nghiệp vụ.

> ⚠️ Lưu ý về scope diff: branch này **chưa commit gì**, và stack trên `refactor/reorganize-feature-folders` (PR #149 chưa merge). `git diff dev...HEAD` trả về 542 file của #149 — không phải scope #150. Review này chạy trên working tree (59 mục).

---

### PHÂN TÍCH

#### 🔴 Critical

**C1. `git status` chứa 3 file KHÔNG thuộc #150 — sẽ lọt vào commit**
- `src/features/admin/pages/IoTDevicesPage.tsx`
- `src/features/admin/pages/IoTFirmwareReleasesPage.tsx`
- `src/shared/types/iot/iot.types.ts`

Ba file này đã ở trạng thái modified từ **trước khi** #150 bắt đầu (phát hiện ngay ở Bước 0 của `/kltn-implement`, người dùng chỉ đạo không stash). Nếu `/kltn-ship` chạy `git add -A`, chúng sẽ vào commit của #150 → PR lẫn thay đổi IoT không liên quan, reviewer không thể đánh giá.

**Cách fix:** commit chọn lọc theo đường dẫn (không dùng `git add -A`), hoặc tách 3 file IoT sang commit/branch riêng trước khi ship.

**C2. `docs/mobile-restructure-plan.md` untracked, không thuộc #150**

Cùng rủi ro với C1. File này không nằm trong plan `logs/GH-150/plan.md`.

**Cách fix:** loại khỏi commit của #150.

---

#### 🟡 Warning

**W1. `src/features/{staff,manager}/hooks/blog/*.ts` là dead code — 0 import**

Thiết kế ban đầu: 3 file per-role re-export chỉ những hook mà role đó được phép, làm "hàng rào thứ hai ở tầng import" (đã ghi vào plan + issue #150). Nhưng các view dùng chung lại import thẳng từ `@/shared/hooks/blog/useBlog`:

- `BlogListView.tsx:21`, `BlogDetailView.tsx:38`, `BlogEditorView.tsx:13` → import từ `shared/`
- `useStaffBlog.ts`: **0 chỗ import** · `useManagerBlog.ts`: **0 chỗ import**
- `useAdminBlog.ts`: 1 chỗ (`BlogTemplatePage.tsx:41`)

Hệ quả: hàng rào import **không tồn tại trên thực tế**, và mô tả trong plan/issue đang sai. Phân quyền thật vẫn được đảm bảo bởi (a) BE `[Authorize]`, (b) prop `canWorkflow` quyết định có render nút hay không — nên không phải lỗ hổng bảo mật, nhưng là code chết + tài liệu sai lệch.

**Gợi ý:** chọn một trong hai — (a) xóa 2 file dead code và sửa mô tả trong plan/issue, hoặc (b) đổi các view sang import qua file per-role (truyền hook vào view bằng prop). Phương án (a) đơn giản hơn và trung thực hơn với thiết kế thực tế.

**W2. `useBlog.ts:76` — `dataUpdateCount` không phải bộ đếm số lần poll**

```ts
if (query.state.dataUpdateCount >= GENERATION_POLL_LIMIT) return false;
```

`useBlogGenerationStatus` dùng **cùng queryKey** với `useBlogDetail` (`QUERY_KEY.blog.detail(id)`, dòng 52 và 66) → chung một cache entry. `dataUpdateCount` tích lũy theo vòng đời cache entry, **bao gồm cả các lần fetch của `useBlogDetail`**, không chỉ số lần poll.

Hậu quả: nếu người dùng đã mở trang chi tiết bài đó vài lần trước khi bấm generate, bộ đếm đã cao sẵn → poll có thể dừng **sớm hơn 2 phút** như thiết kế, thậm chí dừng ngay lần đầu. AC D4 mô tả "dừng sau ~2 phút" sẽ không đúng.

**Gợi ý:** đếm bằng `useRef` cục bộ trong hook, reset khi `enabled` chuyển false→true.

**W3. `useTicketChatFiles.ts:15` — queryKey inline, không qua factory**

```ts
queryKey: [KEY.ticketChatFiles, ticketId],
```

Checklist yêu cầu dùng `QUERY_KEY` factory. Các key khác trong #150 (`QUERY_KEY.blog.*`, `QUERY_KEY.blogTemplates.*`) đều có factory.

**Gợi ý:** thêm `QUERY_KEY.ticketChatFiles.list(ticketId)` vào `shared/utils/queryKeys.ts`.

**W4. `sanitizeHtml.ts:40` — `htmlToPlainText` phụ thuộc DOM, được gọi trong zod schema**

`document.createElement` được gọi từ `blogPostSchema` và `kbArticleSchema` (validate "rỗng"). Trong môi trường không có DOM (unit test Node thuần, SSR) schema sẽ throw.

Hiện dự án không có test runner cho FE nên chưa ảnh hưởng, nhưng sẽ chặn việc viết unit test cho schema sau này.

**Gợi ý:** khi không có `document`, fallback về regex strip tag.

**W5. `BlogListView.tsx:64-71` — lọc từ khóa phía client trên trang hiện tại**

BE `GetBlogPostListQuery` không có param từ khóa (chỉ `Status`/`Origin`/`Page`/`PageSize`), nên ô tìm kiếm lọc trên mảng của **trang đang xem**. Người dùng gõ từ khóa khớp bài ở trang 3 sẽ thấy "không có bài blog nào" dù tổng số vẫn hiển thị > 0.

Đã có comment giải thích tại chỗ, nhưng UX vẫn dễ gây hiểu nhầm.

**Gợi ý:** hoặc ẩn ô tìm kiếm cho tới khi BE hỗ trợ, hoặc đổi nhãn thành "Lọc trong trang này".

---

#### ✅ Pass

| Tiêu chí | Kết quả |
|---|---|
| Không có business logic trong component | ✅ — logic nằm ở hook/service |
| API qua `services/` → hook TanStack Query | ✅ — `blog.service.ts`, không fetch trực tiếp |
| Feature isolation (`features/A` ↛ `features/B`) | ✅ — grep 0 kết quả |
| `shared/` không import `features/` | ✅ — grep 0 kết quả |
| Không tạo Axios instance mới | ✅ — chỉ dùng `shared/lib/axios.ts` |
| Không dùng `localStorage` | ✅ — grep 0 kết quả |
| Không còn `console.log` | ✅ — grep 0 kết quả |
| Component PascalCase | ✅ |
| Loading + error state | ✅ — Skeleton + `ErrorState` + `onRetry` ở cả 3 view |
| `invalidateQueries` dùng `KEY` root / factory | ✅ — không hardcode string |
| Form submit `try/catch` + `handleErrorApi({ error, setError })` | ✅ — `BlogEditorPanel.tsx:96`, `BlogTemplatePage.tsx:106` |
| Mutation non-form có `onError` | ✅ — publish/archive/delete/generate/deleteTemplate đều có |
| Mutation form **không** có `onError` (đúng rule) | ✅ — 4 mutation form cố ý bỏ `onError` vì `onError` không nhận `setError`; caller đều bọc `try/catch` |
| UI primitive từ shadcn | ✅ — không tự custom Button/Dialog/Table/Badge/Skeleton |
| Route mới khai báo trong `router/index.tsx` | ✅ — 14 route |
| Route wrap `ProtectedRoute` + `RoleRoute` | ✅ — nằm trong nhánh `RoleRoute allowedRoles={[UserRole.X]}` của từng role |
| Thứ tự route | ✅ — `blog/templates` khai **trước** `blog/:id`, không bị nuốt thành param |
| Sanitize HTML trước khi render | ✅ — mọi `dangerouslySetInnerHTML` đều nhận `sanitizeHtml()` |
| Không render dữ liệu nhạy cảm thừa | ✅ |

---

### RỦI RO & LƯU Ý

1. **Chưa chạy thật lần nào.** Toàn bộ mới verify ở mức compile/lint/build. 26/37 AC cần BE `feat/GH-671-blog` — branch đó còn 13 file chưa commit.

2. **Phụ thuộc BE chưa merge.** Nếu BE lên `dev` mà thiếu phần contract đã sửa (`isTemplate` trong DTO, `GET /api/internal/blog/{id}`, 6 endpoint `Ok()` → `StatusCode()`), thì: badge bài mẫu luôn ẩn, poll generate không hoạt động, lỗi 404/409 không được `handleErrorApi` bắt.

3. **Branch stack lên PR #149 chưa merge.** PR của #150 sẽ chứa cả diff refactor cho tới khi #149 vào `dev`. Reviewer cần biết trước.

4. **KB đổi sang HTML là thay đổi một chiều, không có migration.** Bài cũ (text thuần) và bài mới (HTML) sống song song, phân biệt bằng `isHtmlContent()`. Regex chỉ khớp thẻ block ở đầu chuỗi để tránh nhận nhầm text chứa dấu `<` (vd "nhiệt độ < 5 độ C"). Cần regression test thủ công trên bài KB cũ.

5. **Quality gate của dự án đang sai** (ngoài phạm vi #150): `tsconfig.json` gốc là solution-style (`"files": []` + `references`) nên `tsc --noEmit` mà rule quy định luôn exit 0 mà không đọc file nào. Lệnh đúng là `tsc -p tsconfig.app.json --noEmit` — chạy đúng lệnh đã phát hiện 3 lỗi thật trong lúc implement. Nên mở issue riêng sửa `.claude/rules/workflow.md`.

6. **`KbEditorPanel` vẫn tự khai zod schema riêng**, không dùng `shared/schemas/kb/kb-article.schema.ts` (nợ kỹ thuật có từ trước #150). Mọi field mới phải sửa 2 nơi — lần này là `isTemplate`. Không nằm trong scope nhưng dễ gây sót về sau.

---

### VÒNG 2 — sau khi sửa (2026-07-20)

Theo chỉ đạo: **bỏ qua C1 + C2** (vệ sinh commit, người dùng chấp nhận), **sửa toàn bộ 5 Warning**.

| # | Trạng thái | Kiểm chứng |
|---|---|---|
| W1 | ✅ Đã sửa | Xóa 3 file per-role; `grep useAdminBlog\|useStaffBlog\|useManagerBlog` → 0 kết quả; `BlogTemplatePage` import từ `shared/`; sửa mô tả sai trong plan + issue |
| W2 | ✅ Đã sửa | `dataUpdateCount` → `useRef` cục bộ, reset theo `[enabled, id]`; grep xác nhận không còn `query.state.dataUpdateCount` |
| W3 | ✅ Đã sửa | `QUERY_KEY.ticketChatFiles.list(ticketId)` |
| W4 | ✅ Đã sửa | Nhánh `typeof document === "undefined"` → regex strip tag |
| W5 | ✅ Đã sửa | Nhãn "Lọc trong trang này…" + empty state gợi ý chuyển trang |
| C1 | ⏭️ Bỏ qua | Người dùng chấp nhận 3 file IoT vào chung commit |
| C2 | ⏭️ Bỏ qua | `docs/mobile-restructure-plan.md` — là tài liệu thật (9.5 KB, plan restructure mobile), KHÔNG xóa |

**Cổng chất lượng sau khi sửa:** `tsc -p tsconfig.app.json` 0 lỗi · `eslint . --max-warnings=0` exit 0 · `pnpm build` ✓ 6.12s

### KẾT LUẬN

**Vòng 1: FAIL** — Độ tự tin: **Cao**

**Vòng 2: PASS (có điều kiện)** — Độ tự tin: **Trung bình**

Toàn bộ 5 Warning đã sửa và kiểm chứng bằng grep. Hai Critical được người dùng chủ động bỏ qua — chấp nhận PR chứa 4 file ngoài scope.

Độ tự tin **Trung bình** (không phải Cao) vì: chưa có AC nào trong 37 tiêu chí được verify bằng chạy thật; 26/37 phụ thuộc BE `feat/GH-671-blog` chưa merge. Code đúng về mặt tĩnh, nhưng hành vi thực tế (poll, 409, sanitize, ảnh từ chat) chưa được chứng minh.

---

### KẾT LUẬN VÒNG 1 (giữ lại để đối chiếu)

**FAIL** — Độ tự tin: **Cao**

Hai Critical (C1, C2) đều là **vệ sinh commit**, không phải lỗi logic: 4 file không thuộc #150 đang nằm trong working tree và sẽ lọt vào PR nếu commit bằng `git add -A`. Phải xử lý trước khi `/kltn-ship`.

Chất lượng code nghiệp vụ đạt yêu cầu: kiến trúc đúng chuẩn, phân quyền route đầy đủ, xử lý lỗi đúng pattern form/non-form, sanitize HTML nhất quán.

5 Warning nên sửa, trong đó **W1** (dead code + mô tả sai trong plan/issue) và **W2** (bộ đếm poll sai, làm AC D4 không đúng như mô tả) nên sửa ngay trong ticket này vì cả hai đều do #150 tạo ra.
