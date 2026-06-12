# BÁO CÁO CODE REVIEW — fix/enum-fe — 2026-06-12
### Scope: FE (Web) — dọn endpoint Site/Asset/Type (đối chiếu `api-battery.md` cập nhật)
### Effort: Standard

## TÓM TẮT
Đợt dọn endpoint sau khi `api-battery.md` được cập nhật: thêm prefix `/admin` cho write ops (Site/BatteryAsset/BatteryType), xoá group `BATTERIES` phantom, gỡ field dead `capacityKw`/`totalCapacityKw` (BE đã drop column). Tất cả khớp BE source thật. Build sạch.

## PHÂN TÍCH

✅ **Pass — Write ops đúng prefix `/admin`**
`endpoints.ts`: `SITES`/`BATTERY_ASSETS`/`BATTERY_TYPES` write → `/api/admin/...`. Đối chiếu BE: `AdminSitesController [Route("api/admin/sites")]`, `AdminBatteryAssetsController`, `AdminBatteryTypesController` + ApiGateway `/api/admin/battery-assets/{**catch-all}` — khớp 100%. Read ops (`LIST/DETAIL/REALTIME/DASHBOARD/ASSETS`) giữ non-admin — đúng.

✅ **Pass — site.service.ts dùng đúng key write**
`create→SITES.CREATE`, `update→SITES.UPDATE(id)`, `delete→SITES.DELETE(id)` (trước reuse nhầm `LIST`/`DETAIL`). `SITES.LIST/DETAIL` còn lại chỉ cho GET (admin + manager getList/getById) — đã verify.

✅ **Pass — Xoá group `BATTERIES` phantom**
`/api/batteries/*` không tồn tại trong BE BatteryService; `grep ENDPOINTS.BATTERIES` → 0 usage. Xoá an toàn.

✅ **Pass — Gỡ field dead `capacityKw`/`totalCapacityKw`**
BE migration `20260611144042_RemoveSiteCapacityKw` đã drop column → field luôn null. Gỡ đồng bộ: `site.types.ts` (SiteDto/SiteDashboardDto/SiteCreatePayload), `site.schema.ts`, `SiteFormDialog.tsx` (default + payload + input block), admin/manager `DashboardPage.tsx`, `SiteDashboardCard.tsx`. `grep capacityKw|totalCapacityKw` → sạch.

✅ **Pass — Architecture & convention**
API qua `services/` → ENDPOINTS, không hardcode URL, không tạo Axios instance mới, không `console.log`, không cross-feature import phát sinh. `SiteDashboardCard` vẫn giữ độc quyền healthScore color logic (chỉ gỡ widget Công suất).

🟡 **Warning — `endpoints.ts` còn thay đổi song song ngoài scope**
Cùng file có thêm `SENSOR_READINGS`/`THRESHOLDS` + xoá `BATTERY_GROUPS` (việc song song trong branch). Không phải defect; khi commit nên tách hoặc ghi message bao quát để dễ truy vết diff.

## RỦI RO & LƯU Ý
- Đổi path write là breaking với chỗ gọi path cũ — đã grep xác nhận không còn `CREATE` non-admin cho asset/type.
- `battery-asset.service`/`battery-type.service` không cần sửa (dùng named key, value tự áp dụng) — verify qua tsc.
- Cần test runtime (tạo/sửa/xoá site + asset) ở bước `/kltn-test` để chắc BE nhận đúng `/admin` route.

## Quality Gate
- `npx tsc --noEmit` → ✅ No errors
- `npx eslint <scope files> --max-warnings=0` → ✅ No issues

## KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
(Giới hạn ở dọn endpoint Site/Asset/Type; đối chiếu BE source + build sạch. Thay đổi song song trong branch — enum migration, threshold/sensor-reading service, battery-group removal — KHÔNG nằm trong review này.)
