## BÁO CÁO CODE REVIEW — feat/GH-115-battery-dashboard-reports-analytics — 2026-06-28
### Scope: FE (Web)
### Effort: Deep (multi-file, cross-feature shared code + route + nav)

### TÓM TẮT
Trang Analytics (dashboard stats + 7 reports + filter + export) implement đúng plan, tôn trọng feature isolation (logic/UI ở `shared/`, page wrapper mỗi feature). Cả 3 gate (`tsc -b`, `eslint --max-warnings=0`, `npm run build`) PASS. Không phát hiện Critical. Kết luận **PASS**.

### PHÂN TÍCH

#### ✅ Pass
- **Architecture — no API in component:** Component chỉ render + state; mọi call qua `analytics.service.ts` → hook TanStack Query (`useBatteryDashboard.ts`, `useReports.ts`). ✅
- **Feature isolation:** `shared/components/analytics/*` chỉ import từ `shared/`; `features/admin/pages/AnalyticsPage.tsx` import `features/admin/*` + shared; `features/manager/...` tương tự. KHÔNG có cross-feature import (`features/admin` ⇄ `features/manager`). ESLint `no-restricted-imports` pass. ✅
- **Shared placement đúng:** code dùng bởi ≥2 feature (admin+manager) → đặt ở `shared/`. ✅
- **Axios:** dùng `axiosInstance` từ `shared/lib/axios.ts`, không tạo instance mới. ✅
- **queryKey factory:** `QUERY_KEY.batteryDashboard.*` / `QUERY_KEY.reports.*` từ `shared/utils/queryKeys.ts`, không inline array. Endpoint từ `ENDPOINTS.*`, không hardcode URL. ✅
- **Enum pattern:** `report.enum.ts` dùng `as const` + type alias (không TS `enum`). Reports field tên-enum khai `string` đúng (không map int). ✅
- **Error handling:** `useExportReport` (mutation) có `onError: handleErrorApi({ error })`. Xác minh interceptor `axios.ts:146-153` re-parse blob lỗi → JSON → reject `HttpError` → toast đúng. Query không cần onError. ✅
- **UI primitives:** dùng shadcn/Base UI từ `components/ui` (Button, Select, Table, Tabs, DropdownMenu, Skeleton, Input, Label) — không custom lại. ✅
- **Auth & route:** `/admin/analytics` + `/manager/analytics` nằm dưới `ProtectedRoute` (router:100) → `RoleRoute([ADMIN])` / `RoleRoute([MANAGER])` → AppLayout. Nav item thêm vào AppLayout. ✅
- **Loading/empty/nullable:** ReportTable + ReportTimeSeriesChart xử lý loading (Skeleton) + empty state; field nullable render `—`; `ambient-trend` chưa chọn site → empty state + không gọi API (`enabled`). ✅
- **No console.log / any / localStorage / hardcoded URL:** scan CLEAN. ✅

#### 🟡 Warning
- `ReportTimeSeriesChart.tsx:21` — prop `data: unknown[]` (mất type-safety) + cast `as Record<string,unknown>[]` tại boundary Recharts. **Lý do chấp nhận:** interface TS không thỏa `Record<string,unknown>` (thiếu index signature) — đây là giới hạn TS, không phải lỗi logic. Series `key` vẫn được kiểm soát qua config. Gợi ý (không bắt buộc): generic `<T extends object>` nếu muốn chặt hơn sau.
- `AnalyticsFilterBar.tsx` (date inputs) — `<Input type="date">` gửi `from`/`to` dạng `yyyy-MM-dd` (date-only). BE parse thành DateTime UTC 00:00 → khoảng "đến ngày" có thể **không bao trùm trọn ngày cuối** (loại các bản ghi trong ngày `to`). Cân nhắc cộng cuối ngày cho `to` khi test thực tế.
- `AnalyticsPage.tsx` (admin+manager) — site selector lấy `pageSize: 100`. Nếu hệ thống >100 site, danh sách bị cắt. Chấp nhận ở scope này (khớp pattern DashboardPage hiện tại 100/200); nâng lên hoặc search-select nếu cần sau.

### RỦI RO & LƯU Ý
- ⚠️ **Working tree có thay đổi KHÔNG thuộc GH-115** (từ git status đầu phiên): xoá `shared/types/*.enums.ts`, `features/admin/types/battery-type.enums.ts`, sửa `docs/api-*.md`, vài `logs/GH-*/plan.md`. **Khi `/kltn-ship`, CHỈ stage các file thuộc GH-115** (analytics, endpoints, queryKeys, router, AppLayout, logs/GH-115) — không commit lẫn các thay đổi orphan này vào PR.
- **Cần xác nhận BE khi test:** `?format=pdf` có bị reject (BE chỉ nhận csv/xlsx) — FE chỉ expose 2 option nên an toàn, nhưng nên verify hành vi export thực tế.
- **Type-check gate:** root `tsconfig.json` là solution file → `tsc --noEmit` không check gì. Gate thật là `tsc -b` (trong `npm run build`). Đã dùng đúng.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
Không có Critical. 3 Warning đều ở mức chấp nhận được trong scope (đã ghi rõ rationale). Bước tiếp theo: `/kltn-test 115` (xác minh export thực tế + render). Lưu ý surgical staging khi ship.
