## BÁO CÁO CODE REVIEW — feat/GH-84-integrate-knowledge-base-api — 2026-06-17
### Scope: FE (Web)
### Effort: Deep (44 file, cross-feature, shared + 3 role)

### TÓM TẮT
Tích hợp KB (Wiki) nội bộ từ mock → endpoint/data thật. Data layer + UI + ticket-kb references hoàn chỉnh, đã verify contract trực tiếp từ source BE. `tsc --noEmit` 0 lỗi, `npm run build` PASS, `eslint` KB files 0 issue. Không phát hiện vấn đề Critical.

### PHÂN TÍCH

✅ **Pass:**
- **Architecture:** Không có API call trực tiếp trong component — tất cả qua `services/` → hook TanStack Query. Component chỉ UI + state.
- **Feature isolation:** Không có import chéo `features/admin|manager|staff` (đã grep). Code dùng chung đặt ở `shared/components/common/kb`, `shared/enums`, `shared/types`.
- **Axios:** Dùng `shared/lib/axios.ts`, không tạo instance mới. Không hardcode `/api/` ngoài `endpoints.ts`.
- **Query keys:** Dùng `QUERY_KEY.kb.*` / `QUERY_KEY.ticketKbRefs.list` factory; invalidate bằng `KEY.kb` (broad) + factory (narrow). Không inline array.
- **Error handling:** Mutation non-form (publish/approve/reject/rollback/archive/addRef/removeRef) có `onError → handleErrorApi`. Hook không tự `toast.error` — delegate `handleErrorApi`.
- **Auth/Route:** Route mới `staff/kb/new`, `staff/kb/:id/edit` (router/index.tsx:178-180) nằm trong `RoleRoute allowedRoles={[UserRole.STAFF]}`. Admin/manager editor route tương tự dưới RoleRoute đúng role.
- **RBAC workflow:** Nút approve/reject/publish/archive/rollback chỉ render ở trang Admin/Manager (dưới RoleRoute tương ứng); trang Staff detail không có → Staff không thể thao tác workflow.
- **UI primitives:** Dùng shadcn (`@/components/ui/*`: Dialog, Checkbox, Textarea, Badge, Button...). Không custom lại.
- **Contract:** status/category string-enum (khớp JsonStringEnumConverter), version.status & template.category numeric, filter `?Status=`/`?Category=` map sang int qua `KbArticleStatusCode`/`KbCategoryCode`. Đã verify từ BE source.
- **Không** `console.log` sót; **không** dùng `localStorage`.

🟡 **Warning:**
- `features/{admin,manager,staff}/pages/KbEditorPage.tsx` + `shared/.../KbEditorPanel.tsx` — form submit dùng `handleErrorApi({ error })` **không truyền `setError`**. Theo rule FE form nên `handleErrorApi({ error, setError })` để map lỗi field xuống input. Tác động thấp: Zod client đã enforce cùng giới hạn với BE (title≤200/symptoms≤2000/...) nên `EntityError` hiếm khi xảy ra; ngoài ra BE trả `Field` PascalCase ("Title") còn field RHF lowercase ("title") nên mapping cũng không khớp trực tiếp → toast là fallback hợp lý. Gợi ý: để nguyên (toast) hoặc bổ sung `setError` + map case nếu cần field-level UX.
- `features/{admin,manager}/components/KbArticleTable.tsx` — vẫn còn block nút "Xóa" guard bằng `{onDelete && ...}`. Hiện không trang nào truyền `onDelete` (delete out-of-scope) → không render, vô hại. Gợi ý: gỡ prop `onDelete` + block để sạch (không bắt buộc).
- `TicketKbReferencesPanel` (manager/staff) fetch `useXxxKbList({ status: Published, pageSize: 100 })` cho selector — giới hạn cứng 100 bài. Đủ cho scope hiện tại; nếu KB lớn cần search-as-you-type server-side (ngoài scope ticket này).

### RỦI RO & LƯU Ý
- **Dependency BE:** ticket-kb references (list/add/remove) phụ thuộc 3 endpoint mới ở branch backend `feat/ticket-kb-references-list-remove` — **chưa merge & chưa build/test** (máy không có `dotnet`). Phần này của FE chỉ chạy thật sau khi BE lên. BE cần PR riêng + unit test 2 handler + build verify.
- **Lint scope:** đã chạy `eslint` trên toàn bộ file KB (0 issue) + `npm run build` (chạy `tsc -b`) PASS. Full-project `eslint .` để `/kltn-test` (repo còn file WIP file-storage của tác giả khác, không thuộc GH-84).
- **Customer/public KB + suggest/helpful:** out-of-scope (web chỉ wiki nội bộ) — đúng quyết định đã chốt.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
(0 Critical · 3 Warning tác động thấp · build & type-check sạch. Lưu ý dependency BE branch trước khi chạy live.)
