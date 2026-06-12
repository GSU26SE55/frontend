# BÁO CÁO CODE REVIEW — feat/GH-73-ambient-environmental-incidents — 2026-06-12

## TÓM TẮT
Data layer + UI cho Ambient Readings (Nhóm 8) + Environmental Incidents (Nhóm 9), 11 endpoint FE gọi. Code bám sát pattern feature Alerts (#72), tuân thủ kiến trúc services → hooks → shared View → per-role page. Gate tự động (tsc / eslint / build) đều PASS. Không phát hiện lỗi Critical.

## PHẠM VI REVIEW
Diff GH-73 (working tree vs base `feat/GH-72-alerts-feature`):
- Sửa: `endpoints.ts`, `queryKeys.ts`, `router/index.tsx`, `layout/AppLayout.tsx`, `site.types.ts`
- Mới: 2 enum, 2 types, 2 schema, 2 service, 2 hook, 4 component (+`incidentLabels`), 5 page

## PHÂN TÍCH

### ✅ Pass
- **Không gọi API trong component** — đều qua `services/` → hook TanStack Query.
- **Enum pattern** `as const` + type alias đúng chuẩn; đặt ở `shared/enums/`; types re-export enum, không define inline.
- **ENDPOINTS single source** — service dùng `ENDPOINTS`, không hardcode URL; pages chỉ import hook/service, không import `ENDPOINTS`. 2 endpoint IoT (API Key) được loại trừ đúng, có comment ghi chú.
- **queryKeys factory** — dùng `QUERY_KEY.*`; mutation invalidate qua `[KEY.*]` broad + key cụ thể.
- **Error handling đúng rule:** form (resolve / false-alarm / threshold) dùng `try-catch mutateAsync` + `handleErrorApi({ error, setError })`; non-form (acknowledge) dùng `onError` của mutation. Không lẫn lộn.
- **Cache strategy** theo fe.md: incident list 30s + poll 30s; ambient latest 1′; history 5′; threshold 10′; active-by-site staleTime0 + poll 30s.
- **Feature isolation** — không có cross-feature import; shared component nhận `sites` qua prop (không import `features/*` vào `shared/`). ESLint `no-restricted-imports` pass.
- **RBAC UI** — `checkRole(user, ADMIN, MANAGER)` gate nút "Báo động giả"; ack/resolve mở cho A/M/S. BE vẫn là source of truth.
- **Edge cases** 404 (`useAmbientLatest`/`useAmbientThresholdBySite` đặt `retry:false`, View render empty state / form tạo mới) + 409 (toast message từ BE) đã xử lý.
- **Type-safety** — `tsc --noEmit` sạch; `Checkbox` base-ui controlled qua `Controller` đúng kiểu.
- **`useState` chỉ cho UI state** (selectedId, panel, siteId, page) — không dùng làm server cache.

### 🟡 Warning
1. ~~`EnvironmentalIncidentsView.tsx` (filter `to`) — date input trả `YYYY-MM-DD` → filter `to` loại trừ incident trong chính ngày đó.~~ **✅ ĐÃ FIX (2026-06-12):** gửi `to` dạng `${to}T23:59:59` để bao trọn ngày được chọn; tsc + eslint re-check PASS.
2. `useEnvironmentalIncidents.ts` (`useActiveIncidentsBySite`) + `environmental.service.ts` (`getActiveBySite`) — đã implement nhưng **chưa có UI consumer** (active widget không nằm trong scope đã chốt — không động `SiteDetailPage`). Giữ lại hợp lý vì endpoint `by-site/{siteId}/active` nằm trong 13 endpoint issue yêu cầu integrate (data-layer completeness). Ghi nhận để task dashboard widget sau tái dùng.
3. `AmbientConfigView` (`ThresholdForm`) — khi đổi site, trong khoảng query mới đang load (`threshold` undefined, `isError` false) form giữ giá trị site cũ một nhịp trước khi reset. Rủi ro thấp (load nhanh, ít khi submit trong nhịp đó). Có thể reset form theo `siteId` change nếu muốn chặt hơn.

## RỦI RO & LƯU Ý
- **Branch base = `feat/GH-72` (chưa merge):** PR GH-73 sẽ kèm diff #72 cho tới khi #72 vào dev rồi rebase #73. Cần lưu ý khi ship/review trên GitHub.
- Tái dùng `AlertSeverityEnum` + `AlertSeverityBadge` từ #72 — nếu #72 đổi shape severity, #73 ảnh hưởng theo.
- Site selector dùng `pageSize:100` để lấy danh sách site cho dropdown — đủ cho scope hiện tại; nếu site > 100 cần chuyển sang search/async select (ngoài scope).

## KẾT LUẬN
**PASS** — Độ tự tin: **Cao**

Không có Critical. 3 warning đều non-blocking (UX nhỏ / data-layer dư / stale nhịp ngắn). Code nhất quán pattern, type-safe, gate tự động xanh. Đề xuất: cân nhắc fix warning #1 (`to` end-of-day) trong task này hoặc ghi nhận follow-up.
