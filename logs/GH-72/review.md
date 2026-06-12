## BÁO CÁO CODE REVIEW — feat/GH-72-alerts-feature — 2026-06-12
### Scope: FE (Web)
### Effort: Standard

### TÓM TẮT
Feature Alerts (4 endpoint `/api/alerts`) cho 3 portal Admin/Manager/Staff. Data layer + UI
dùng chung ở `shared/`, 3 page portal mỏng. Kiến trúc đúng pattern dự án, quality gates đều
PASS (tsc clean · eslint 0 warning · build OK). Có 2 Warning không chặn ship.

### PHÂN TÍCH

✅ **Architecture**
- Không business logic trong component — fetch qua `services/alert.service.ts` → hook `useAlerts.ts` → TanStack Query.
- File placement đúng: data + UI dùng chung ở `shared/` (3 feature dùng), page riêng ở `features/{admin,manager,staff}/`.
- KHÔNG cross-feature import — verified: `shared/components/alerts/*` không import `@/features/*`; 3 page chỉ import `@/shared/components/alerts/AlertsView`.
- Dùng `shared/lib/axios` instance, không tạo mới. Không đụng Zustand.

✅ **Error Handling**
- `queryKey` dùng `QUERY_KEY.alerts.{list,detail}` factory — không inline array.
- `invalidateQueries({ queryKey: [KEY.alerts] })` dùng KEY root (broad) — đúng cho cả list + detail.
- Mutation non-form (acknowledge/resolve) có `onError: (error) => handleErrorApi({ error })` → toast. State machine 409/404 từ BE sẽ ra toast message.
- Hook chỉ `toast.success` (nhất quán với `useSites`), error delegate cho `handleErrorApi`.

✅ **Auth & Security**
- 3 route khai báo trong `router/index.tsx`, nested dưới `ProtectedRoute > RoleRoute([ROLE]) > AppLayout`.
- `/admin/alerts` (ADMIN), `/manager/alerts` (MANAGER), `/staff/battery-alerts` (STAFF) — gate role đúng.
- Không render sensitive data; token không đụng localStorage.

✅ **UI/UX & Code Quality**
- Dùng shadcn primitives (Button/Card/Dialog/Table/Badge/Skeleton/Select) — không custom.
- Loading skeleton + EmptyState xử lý đầy đủ. Nút Acknowledge/Resolve disable theo state machine (Ack khi Open; Resolve khi Open/Acknowledged) → giảm lỗi 409.
- Component PascalCase, không console.log sót, không hardcode URL (qua ENDPOINTS).
- Filter severity/status qua Select + `useUrlFilters` (reload-safe), `excludeMerged` để BE default true.

✅ **Warning #1 — ĐÃ FIX (2026-06-12)** — link "Xem ticket" dùng `href="#/tickets/${ticketId}"` là dead link (browser router, không phải hash; route ticket khác theo portal). Đã sửa: render `ticketId` dạng text monospace, bỏ anchor + bỏ import `ExternalLink`. Re-run tsc + eslint PASS.

🟡 **Warning** — `AlertsView.tsx` bảng — trên mobile viewport bảng 6 cột có thể tràn ngang (Card `overflow-hidden`). Gợi ý thêm wrapper `overflow-x-auto` nếu cần responsive chặt. Không chặn (desktop-first admin tool, nhất quán các bảng hiện có).

### RỦI RO & LƯU Ý
- Branch cắt từ `fix/enum-fe` (không phải `dev`) → khi ship cần đảm bảo PR target đúng và không kéo theo diff enum-migration không liên quan. `git diff dev...HEAD` rất lớn vì lý do này; review chỉ tính phần GH-72 (working tree).
- Detail dialog gọi `useAlertDetail` (endpoint `/api/alerts/{id}`) — đúng AC nhưng tốn 1 request khi mở mỗi alert; chấp nhận được vì data tươi sau acknowledge/resolve.
- Chưa có BE thật để chạy → hành vi 409/404 chỉ verify qua code path, cần test khi BE sẵn sàng.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
2 Warning đều cosmetic/ngoài scope plan, không chặn ship. Khuyến nghị xử lý Warning #1 (dead ticket link) trước khi merge cho gọn — có thể làm nhanh ở bước test.
