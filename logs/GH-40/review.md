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
