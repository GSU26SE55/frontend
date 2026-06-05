## BÁO CÁO CODE REVIEW — design/ui (GH-58) — 2026-06-05
### Scope: FE (Web)
### Effort: Deep (14 files mới + 5 modified, cross-shared boundaries)

---

### TÓM TẮT

Implementation đầy đủ, kiến trúc đúng chuẩn, build + tsc + eslint đều PASS. Tuy nhiên có 1 lỗi Critical về invalidation key sẽ khiến filtered list không refresh sau mutation.

---

### PHÂN TÍCH

🔴 **Critical**

**`src/features/staff/hooks/useStaffTicketMutations.ts:19`**
`invalidateQueries({ queryKey: QUERY_KEY.staffTickets.list() })` truyền `['staffTickets', 'list', undefined]`.
TanStack Query v5 partial match so sánh từng phần tử — `undefined` ≠ `{status, pageNumber, pageSize}` object.
**Kết quả:** mọi filtered list query đang active KHÔNG bị invalidate sau mutation. User ở trang có filter sẽ thấy dữ liệu cũ.
**Fix:** thay bằng `{ queryKey: [KEY.staffTickets, 'list'] }` (prefix 2 phần tử khớp tất cả list variants).

---

🟡 **Warning**

**`src/features/staff/hooks/useStaffTicketMutations.ts:16-18`**
`onSuccess: () => toast.success(...)` gọi toast mà không check `response.data.isSuccess`.
Nếu BE trả HTTP 200 + `isSuccess: false` (sai state machine), user nhận toast "thành công" sai.
Ngay trong PR này `useChangePassword.ts` đã check `res.isSuccess` đúng. Cân nhắc áp dụng pattern tương tự.
*Gợi ý:* Thêm `data` vào callback và kiểm tra `data?.data?.isSuccess !== false` trước khi toast.success.

**`branch: design/ui`**
Branch name không theo convention `feature/GH-58-*` (workflow.md). PR sẽ bundle thêm K8s YAML deletion + auth fix commits — reviewer cần aware. Không ảnh hưởng runtime nhưng làm PR diff khó đọc.

---

✅ **Pass**

- **Feature isolation:** Không có cross-feature imports (`features/staff` không import từ `admin`/`manager`) — grep confirmed.
- **No API call in component:** tất cả qua `services/` → TanStack Query hooks.
- **QUERY_KEY factories:** dùng đúng, không inline string queryKey.
- **Auth/Route:** `/staff/*` wrap `ProtectedRoute` > `RoleRoute([UserRole.STAFF])` ✅
- **staleTime:** ticket list/detail đều 30_000ms đúng per plan.
- **Error handling:** tất cả mutations có `onError: (error) => handleErrorApi({ error })`.
- **Form dialogs:** Zod validation, form.handleSubmit — đúng pattern.
- **SlaCountdown:** clearInterval trả về cleanup function, guards Paused/Met/Breached đúng.
- **No localStorage token:** không tìm thấy.
- **No console.log:** không tìm thấy.
- **axiosInstance:** dùng `shared/lib/axios.ts`, không tạo instance mới.
- **Build gates:** `tsc --noEmit` TypeScript clean · `eslint --max-warnings=0` clean · `npm run build` success.
- **Resolver compat fix:** `form.tsx` FormField 3rd generic + schema `.default()` removed — đúng cách fix Zod v4 + resolvers v5.

---

### RỦI RO & LƯU Ý

- Sau khi fix Critical, invalidation pattern nên review lại cho các mutation hooks tương lai (`useAddComment`, `useAddMaintenanceLog` chỉ invalidate detail — ok vì comment/log chỉ hiển thị trong detail page).
- `TicketActionResponse` type (distinct từ `CommonResponse<T>`) đúng theo API spec nhưng không có xử lý `isSuccess: false` ở mutation onSuccess — để sau có thể refactor toàn bộ ticket mutations cùng lúc.

---

### FIX ĐÃ ÁP DỤNG

Critical #1 đã được fix:
- `useStaffTicketMutations.ts:19` — đổi `QUERY_KEY.staffTickets.list()` → `[KEY.staffTickets, 'list']`
- Import thêm `KEY` từ `queryKeys.ts`
- `tsc --noEmit` + `eslint --max-warnings=0` sau fix: PASS

---

### KẾT LUẬN

**PASS** — Độ tự tin: Cao

Critical đã fix. Warning là non-blocking. Code sẵn sàng để test.
