## BÁO CÁO CODE REVIEW — feat/GH-59-manager-ticket-management — 2026-06-05

### Scope: FE (Web)

### Effort: Deep

---

### TÓM TẮT

Implementation đầy đủ 22 files (18 mới, 4 sửa) cho portal Manager quản lý ticket — types, service, hooks, 5 dialogs, 3 pages, routing. Code sạch, không vi phạm feature isolation, không cross-feature import. Có 2 Warning nhỏ cần ghi nhận nhưng không block ship.

---

### PHÂN TÍCH

#### Architecture

✅ Không gọi API trực tiếp trong component — mọi call đi qua `managerTicketService` → TanStack Query hooks
✅ Files đặt đúng vị trí: types/schemas/services/hooks/components/pages trong `features/manager/`
✅ `features/manager` không import từ `features/staff`, `features/admin` (ESLint: 0 issues)
✅ Không tạo Axios instance mới — dùng `shared/lib/axios.ts` (kiểm tra bằng grep)
✅ Zustand không dùng cho server state
✅ Staff list trong AssignDialog/ReassignDialog fetch trực tiếp qua `axiosInstance.get(ENDPOINTS.STAFF.LIST)` — đúng pattern, tránh cross-import từ `features/staff/`

#### Code Quality

✅ Tất cả components PascalCase
✅ Không hardcode URL — dùng `ENDPOINTS.ADMIN.TICKETS.*` và `ENDPOINTS.TICKETS.*`
✅ Loading state + error state xử lý đúng (Skeleton, empty state, disabled button)
✅ Không có `console.log` sót lại

#### Error Handling

🟡 **Warning** `AssignDialog.tsx:24` + `ReassignDialog.tsx:24` — inline `queryKey: ['manager', 'staff-list']` thay vì dùng QUERY_KEY factory:

```ts
// Hiện tại:
queryKey: ['manager', 'staff-list'],
// Đúng convention (fe.md §TanStack Query):
// Cần thêm vào queryKeys.ts: QUERY_KEY.manager.staffList: () => [...KEY.manager.staff, 'list']
// Sau đó: queryKey: QUERY_KEY.manager.staffList(),
```

→ Không ảnh hưởng correctness nhưng vi phạm "queryKey dùng QUERY_KEY factory" và khó invalidate nếu cần.

🟡 **Warning** `AddCommentForm.tsx:25` — `mutateAsync` trong `onSubmit` không có `try-catch`:

```ts
// Hiện tại:
const onSubmit = async (values: AddCommentFormValues) => {
  await mutateAsync({ ticketId, payload: values }); // nếu throw → unhandled
  form.reset();
};
// FE rules yêu cầu try-catch cho form submit:
const onSubmit = async (values: AddCommentFormValues) => {
  try {
    await mutateAsync({ ticketId, payload: values });
    form.reset();
  } catch (error) {
    handleErrorApi({ error });
  }
};
```

→ Thực tế `onError` trong hook vẫn fire và hiện toast. Không crash nhưng vi phạm convention.

✅ Tất cả mutations dùng `onError: (error) => handleErrorApi({ error })`
✅ `invalidateQueries` dùng QUERY_KEY factories (trừ staff-list case ở trên)
✅ Không toast.error trực tiếp trong hooks

#### UI / UX

✅ Dùng shadcn components đúng: Dialog, Form, Select, Textarea, Checkbox, Badge, Card, Skeleton
✅ Không tự custom primitive đã có trong shadcn
✅ `SlaCountdown`: Met → xanh, Breached → đỏ, Paused → vàng, Running → countdown (đỏ khi < 1h) ✅

#### Auth & Security

✅ 3 routes mới (`tickets`, `tickets/queue`, `tickets/:id`) nằm trong block `/manager` → đã wrap `ProtectedRoute` + `RoleRoute(['MANAGER'])` — auth guard đúng
✅ Token không lưu localStorage
✅ Không render sensitive data không cần thiết

#### Đặc biệt kiểm tra

✅ `approve` endpoint: `axios.post(url, null, { params: comment ? { comment } : undefined })` — đúng (query param, không phải body)
✅ `addComment`: `(ticketId: string, payload: AddCommentPayload)` — ticketId path param tách biệt payload
✅ `TriageDialog`: không dùng `form.watch()` — dùng local `useState` cho impact/urgency (React Compiler compatible)
✅ `TicketDetailPage`: `[...].includes(status)` cast đúng `as TicketStatusEnum[]`
✅ `addCommentSchema`: `z.boolean()` (không default) + `defaultValues: { isInternal: false }` → resolver type match

---

### RỦI RO & LƯU Ý

- **Type duplication**: `src/shared/types/ticket.types.ts` (từ GH-58) và `src/features/manager/types/ticket.types.ts` define cùng enums (TicketStatusEnum, TicketPriorityEnum, ...). Đây là quyết định có chủ đích trong plan ("chỉ manager dùng sprint này") nhưng cần consolidate vào `shared/types/` khi Staff/Manager/Admin đều cần cùng enums. Không block PR này.
- **Staff list queryKey**: Nếu một feature khác invalidate `['manager', 'staff-list']` thì phải nhớ dùng đúng mảng đó — không type-safe. Nên thêm vào QUERY_KEY trong sprint tiếp theo.
- Route `tickets/queue` vs `tickets/:id`: React Router v6 ưu tiên static segment trước dynamic → `queue` không bị match vào `:id`. Không có vấn đề.

---

### KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Không có Critical. 2 Warning nhỏ về QUERY_KEY convention và try-catch — có thể fix trong PR tiếp theo hoặc ghi chú vào tech debt. Build sạch, TypeScript không lỗi, ESLint 0 warning.
