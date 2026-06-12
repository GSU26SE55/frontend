## BÁO CÁO CODE REVIEW (UI) — fix/enum-fe (scope GH-40) — 2026-06-12
### Scope: FE (Web) — UI Admin Loại pin & Ngưỡng
### Effort: Standard

### TÓM TẮT
UI Admin (BatteryTypesPage + 3 component + route + nav) đạt chuẩn: không gọi API trong component (chỉ qua hooks), dùng shadcn primitives, form RHF + Zod + `handleErrorApi({error,setError})`, route wrap đúng `ProtectedRoute → RoleRoute([ADMIN])`. `tsc` + `eslint` + `build` PASS.

### PHÂN TÍCH

✅ **Pass — Architecture**
- Không có `axios`/`fetch` trong component — tất cả qua hooks (`useBatteryTypes`, `useDeleteBatteryType`, `useRestoreBatteryType`, `useThresholdByType`, `useUpsertThreshold`).
- Không cross-feature import (grep `features/manager|staff|auth` rỗng).
- File đặt đúng `features/admin/{pages,components}/`.

✅ **Pass — UI/UX**
- UI primitive 100% từ `@/components/ui` (Button, Input, Label, Textarea, Dialog, Select, Table, Badge, Skeleton, AlertDialog, Card, Checkbox) — không tự custom.
- Loading state (Skeleton), empty state (icon + text) đều có.
- `Select` chemistry dùng `Controller` (base-ui giữ kiểu number) — đúng pattern `CreateAccountDialog`.

✅ **Pass — Error Handling (form)**
- Cả 2 dialog form submit dùng `try { await mutateAsync } catch { handleErrorApi({ error, setError }) }` — `EntityError` map xuống field, `HttpError` toast.
- Mutation list-level (delete/restore) qua hook có `onError: handleErrorApi` (data layer).
- Số: required dùng `valueAsNumber`; optional dùng `setValueAs` ''→undefined (không gửi `0` cho field nullable) — khớp lưu ý plan.

✅ **Pass — Auth & Security**
- Route `/admin/battery-types` (router/index.tsx:94) nằm trong `ProtectedRoute → RoleRoute([ADMIN]) → AppLayout` — đúng gate.
- Không render data nhạy cảm; không hardcode URL/token (grep sạch).
- Nav item thêm đúng nhóm "Hạ tầng pin".

🟡 **Warning — Giới hạn DTO (restore UX)** — *đã đối chiếu `api-battery.md` dòng 539–549*
- `BatteryTypeDto` thực sự **không có** `isDeleted` (doc xác nhận). Table không phân biệt từng dòng deleted/active. Giải pháp hiện tại: toggle "Hiển thị đã xoá" → bật nút Khôi phục cho mọi dòng trong view đó. Chấp nhận được; nếu BE thêm `isDeleted` thì render theo cờ từng dòng.

✅ **Pass — `GET threshold by-type` khi chưa cấu hình** — *đã đối chiếu `api-battery.md` dòng 1156–1168*
- Doc: `Response thành công 200: CommonResponse<ThresholdConfigDto>` — **KHÔNG có lỗi 404**. Khi chưa cấu hình → `200` với `data: null`.
- Code `useThresholdByType` `.then(r => r.data.data)` → `config = null` → `reset({})` → form rỗng để tạo mới. Không error state, không retry thừa. ✅ Đúng hành vi.
- *(Đính chính: bản review trước ghi "404" — đó là suy đoán sai, không có trong doc.)*

### KẾT LUẬN (UI)
**PASS** — Độ tự tin: **Cao**.
Lưu ý DTO `isDeleted` + branch lẫn thay đổi ngoài scope (xem phần data layer bên dưới).

### ⚠️ RỦI RO BRANCH (cập nhật re-review 2026-06-12)
- Branch hiện tại đổi thành **`feat/GH-72-alerts-feature`** — đang chứa **trộn lẫn 2 ticket**: GH-40 (battery-types/thresholds + UI) **và** GH-72 (alerts: `AlertsPage`, `alert.enum.ts`, `useAlerts.ts`, `shared/components/alerts/`…), tất cả uncommitted.
- Tên branch (`GH-72`) không khớp ticket đang review (`GH-40`).
- **Khuyến nghị trước khi ship:** tách GH-40 và GH-72 thành 2 branch/PR riêng (1 issue = 1 branch theo `rules/workflow.md`). Nếu ship chung, PR sẽ gói cả 2 ticket → khó review & sai quy ước.

---

## BÁO CÁO CODE REVIEW — fix/enum-fe (scope GH-40) — 2026-06-12
### Scope: FE (Web) — data layer Battery Types & Thresholds
### Effort: Standard

### TÓM TẮT
Phần GH-40 (Thresholds data layer mới + Battery Types prefix `/api/admin` + dọn Battery Group) đạt chuẩn: đúng kiến trúc service → hook, dùng `ENDPOINTS`/`QUERY_KEY`/`KEY` factory, error handling chuẩn. `tsc` + `eslint` + `build` PASS. Không có Critical về code. Lưu ý chính nằm ở **scope branch** (lẫn nhiều thay đổi không liên quan).

### PHÂN TÍCH

✅ **Pass — Architecture**
- API qua `services/threshold.service.ts` → hook TanStack Query (`useThresholds`, `useThresholdByType`, `useUpsertThreshold`). Không fetch trực tiếp trong component.
- File đặt đúng `features/admin/{types,schemas,services,hooks}/` — threshold là domain admin.
- Không cross-feature import (chỉ import `@/shared/*` và `@/features/admin/*`).
- Dùng `axiosInstance` từ `shared/lib/axios.ts` — không tạo instance mới.

✅ **Pass — Error Handling**
- `queryKey` dùng factory: `QUERY_KEY.thresholds.list/byType` (`useThresholds.ts:11,21`).
- `invalidateQueries` dùng root `[KEY.thresholds]` (`useThresholdsMutation.ts:13`).
- Mutation non-form có `onError: (error) => handleErrorApi({ error })` (`useThresholdsMutation.ts:15`) — không tự `toast.error` trong hook.

✅ **Pass — Code Quality & Spec**
- Không hardcode URL — tất cả qua `ENDPOINTS.THRESHOLDS.*`.
- Write op `UPSERT` đúng prefix `/api/admin/thresholds/by-type/{id}`; GET không prefix — khớp `docs/api-battery.md` Nhóm 6 + đồng nhất codebase.
- `UpsertThresholdPayload` **không** chứa `batteryTypeId` (BE lấy từ path) — đúng lưu ý doc.
- Zod `upsertThresholdSchema`: `voltageMin/Max` `.positive()`; `temperatureMin/Max` để `z.number()` (cho phép âm — đúng vì nhiệt độ có thể < 0°C); SOC/SOH `min(0).max(100)`; 4 cross-field `.refine()` (voltageMax>min, tempMax>min, socCritical<warning, sohCritical<warning với guard null).
- `useThresholdByType` có `enabled: !!batteryTypeId` — tránh query rỗng.
- Không còn reference `batteryGroup` nào trong `src` (grep sạch); không có `console.*`.

🟡 **Warning — Scope branch** (`fix/enum-fe`)
- Branch chứa lượng lớn thay đổi KHÔNG thuộc GH-40 (enum refactor toàn app, site/dashboard, file-storage…) + nhiều file uncommitted không phải của task (`SiteFormDialog.tsx`, `site.schema.ts`, `site.service.ts`, `admin/DashboardPage.tsx`, xóa `battery-asset.enums.ts`…). → Nếu ship từ branch này, PR sẽ gói cả phần không liên quan.
- Gợi ý: tách commit/branch riêng cho GH-40, hoặc xác nhận chủ đích gộp với refactor enum trước khi `/kltn-ship`.

🟡 **Warning — Không verify runtime với BE**
- Path `/api/admin/thresholds/by-type/{id}` đối chiếu theo doc, chưa gọi thật. Gợi ý: smoke test khi BE sẵn sàng (đặc biệt `409`/`404` của threshold by-type & delete battery-type).

### RỦI RO & LƯU Ý
- Data layer thuần — chưa có UI/route, nên không phát sinh rủi ro auth/ProtectedRoute trong task này.
- Field nullable (`currentMax*`, `soh*`) cần UI gửi `undefined` (không gửi `0`) khi trống — đã ghi trong plan, áp dụng khi làm form.
- Battery Type files là tài sản hợp lệ của #40 (không xoá) — đã xác nhận còn nguyên.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao** (cho scope GH-40 data layer).
Lưu ý branch lẫn thay đổi ngoài scope — cân nhắc tách trước khi ship.
