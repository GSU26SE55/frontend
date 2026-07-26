# Plan — Battery real-time log cho Manager & Staff

## Metadata
- **Status:** PLANNING | **Role:** FE (+ chạm 0 dòng BE — chỉ dùng endpoint sẵn có) | **Ngày:** 2026-07-22
- **Nguồn:** yêu cầu trực tiếp — "manager và staff cũng phải xem được log real-time của cục pin"

## Mục tiêu
Hiện chỉ **Admin** có trang battery detail (live SSE telemetry + chart cảm biến + tab AI dự đoán + cascade).
Manager/Staff chỉ thấy panel tĩnh nhỏ trong màn ticket. Bổ sung khả năng xem **real-time đầy đủ** cho Manager và Staff, đúng phân quyền BE.

## Quyết định đã chốt (qua hỏi–đáp)
1. **Manager**: có trang **list + detail đầy đủ** (BE cho Manager gọi cả LIST + detail + threshold).
2. **Staff**: **KHÔNG** trang list (BE chặn Staff gọi `GET /api/battery-assets`). Thay vào đó: trong màn **chi tiết ticket**, panel pin có nút **"Xem chi tiết real-time"** → mở trang battery detail đầy đủ cho đúng cục pin gán ticket.
3. **Tái sử dụng**: chuyển **cụm battery-detail read-only** từ `features/admin` → `shared/` để cả 3 role dùng chung.

## Phân quyền BE (đã verify từ controller — KHÔNG sửa BE)
| Endpoint | Admin | Manager | Staff | Ghi chú |
|---|:-:|:-:|:-:|---|
| `GET /api/battery-assets` (LIST) | ✅ | ✅ | ❌ | Staff KHÔNG có → Staff không có trang list |
| `GET /api/battery-assets/{id}` | ✅ | ✅ | ✅ | |
| `GET /api/battery-assets/{id}/realtime` | ✅ | ✅ | ✅ | |
| `GET /api/sensor-readings/{id}/history\|aggregate\|hourly\|latest` | ✅ | ✅ | ✅ | |
| `GET /api/sensor-readings/stream` (SSE) | ✅ | ✅ | ✅ | live telemetry |
| `GET /api/battery-assets/{id}/cascade-risk` | ✅ | ✅ | ✅ | |
| `GET /api/v1/soh-predictions` · `/anomaly-classifications` · feedback | ✅ | ✅ | ✅ | AI tab |
| `GET /api/thresholds/by-type/{id}` | ✅ | ✅ | ❌ | Staff KHÔNG → chỉ tô màu ngưỡng, `enabled` tự tắt cho Staff, KHÔNG lỗi |
| `POST /api/battery-assets/{id}/topology` | ✅ | ❌ | ❌ | Admin-only → SetTopologyDialog GIỮ Ở admin |

**Hệ quả:**
- Staff detail page vẫn chạy đủ (live + chart + AI + cascade), chỉ **không tô màu ngưỡng** (threshold 403 → hook `enabled:false` cho staff, phần còn lại bình thường).
- Nút topology (đặt lại cấu trúc cascade) **chỉ hiện cho Admin** → giữ trong admin, không chuyển shared.

## Scope
**Trong scope:**
- Move cụm read-only battery-detail: `features/admin/{components,hooks,services,types,enums}/battery` (phần read) → `shared/{components,hooks,services,types,enums}/battery`.
- Admin: cập nhật import trỏ sang shared (giữ hành vi cũ 100%).
- Manager: route `/manager/battery-assets` (list) + `/manager/battery-assets/:id` (detail) + nav item.
- Staff: route `/staff/battery-assets/:id` (detail, KHÔNG list) + nút "Xem real-time" trong panel ticket.
- Detail page dùng chung (shared) nhận prop `role`/`canManage` để ẩn nút CRUD (Sửa/Transfer/Xóa) cho Manager & Staff.

**Ngoài scope:**
- KHÔNG sửa BE (không thêm Staff vào LIST authz).
- KHÔNG cho Manager/Staff CRUD battery (create/update/delete/transfer) — chỉ Admin.
- KHÔNG chuyển nhóm CRUD/admin-only (BatteryAssetForm, TransferOwnerDialog, ThresholdConfigDialog, BatteryType*, BatteryAudit*, useCreate/Update/Delete/Restore/Transfer, các schema) — giữ nguyên ở admin.
- KHÔNG đụng Customer (dùng Mobile App).

## Files

### A. Move sang `shared/` (read-only battery-detail cluster)
> Cách move: tạo file ở shared với nội dung cũ, đổi self-import nội cụm sang đường dẫn shared; XÓA file admin cũ; sửa mọi import admin còn trỏ tới.

| File admin (nguồn) | → shared (đích) | Action |
|---|---|---|
| `components/battery/SensorChart.tsx` | `shared/components/battery/SensorChart.tsx` | move |
| `components/battery/ChargeDischargePeakChart.tsx` | `shared/components/battery/ChargeDischargePeakChart.tsx` | move |
| `components/battery/SensorHistoryTable.tsx` | `shared/components/battery/SensorHistoryTable.tsx` | move |
| `components/battery/CascadeRiskCard.tsx` | `shared/components/battery/CascadeRiskCard.tsx` | move (tách SetTopologyDialog: chỉ render khi `canManageTopology`) |
| `components/battery/AiPredictionCard.tsx` | `shared/components/battery/AiPredictionCard.tsx` | move |
| `hooks/battery/useReadingAggregate.ts` | `shared/hooks/battery/useReadingAggregate.ts` | move |
| `hooks/battery/useReadingAggregateHourly.ts` | `shared/hooks/battery/useReadingAggregateHourly.ts` | move |
| `hooks/battery/useReadingHistory.ts` | `shared/hooks/battery/useReadingHistory.ts` | move |
| `hooks/battery/useThresholds.ts` (chỉ `useThresholdByType` — read) | `shared/hooks/battery/useThresholds.ts` | move (mutation `useThresholdsMutation` GIỮ ở admin) |
| `hooks/battery/useCascadeRisk.ts` | `shared/hooks/battery/useCascadeRisk.ts` | move |
| `hooks/battery/useAiPredictions.ts` | `shared/hooks/battery/useAiPredictions.ts` | move |
| `hooks/battery/useBatteryAsset.ts` (getById) | `shared/hooks/battery/useBatteryAsset.ts` | move (thay cho useStaffBatteryAsset / manager) |
| `hooks/battery/useBatteryAssetRealtime.ts` | `shared/hooks/battery/useBatteryAssetRealtime.ts` | move |
| `hooks/battery/useBatteryAssets.ts` (list) | `shared/hooks/battery/useBatteryAssets.ts` | move (chỉ admin+manager dùng) |
| `services/battery/sensor-reading.service.ts` | `shared/services/battery/sensor-reading.service.ts` | move |
| `services/battery/threshold.service.ts` (read part) | `shared/services/battery/threshold.service.ts` | move (giữ mutation-only import ở admin nếu có) |
| `services/battery/cascade.service.ts` | `shared/services/battery/cascade.service.ts` | move |
| `services/battery/ai.service.ts` | `shared/services/battery/ai.service.ts` | move |
| `services/battery/battery-asset.service.ts` (read: getList/getById/getRealtime) | `shared/services/battery/battery-asset.service.ts` | **split**: read → shared; write (create/update/delete/restore/transfer) giữ ở admin `battery-asset-admin.service.ts` |
| `types/battery/sensor-reading.types.ts` | `shared/types/battery/sensor-reading.types.ts` | move |
| `types/battery/threshold.types.ts` | `shared/types/battery/threshold.types.ts` | move |
| `types/battery/ai.types.ts` | `shared/types/battery/ai.types.ts` | move (sửa import enum về shared) |
| `types/battery/battery-asset.types.ts` | `shared/types/battery/battery-asset.types.ts` | move (đã có `BatteryAssetDetailDto` refs ở shared theo fe.md) |
| `enums/ai.enum.ts` | `shared/enums/battery/ai.enum.ts` | move (theo rule: dùng ≥2 feature → shared/enums/{domain}) |

### B. Tạo mới — shared detail page dùng chung
| File | Action | Ghi chú |
|---|---|---|
| `shared/components/battery/BatteryRealtimeDetail.tsx` | create | Rút từ admin `BatteryAssetDetailPage` phần read-only (top bar + LiveTelemetryCard + Tabs: chart/peak/history/cascade/ai). Prop: `{ assetId, canManage?, canManageTopology?, backTo? }`. Nút Sửa/Transfer/Xóa chỉ render khi `canManage`. |

### C. Admin — cập nhật import + giữ CRUD
| File | Action | Ghi chú |
|---|---|---|
| `features/admin/pages/BatteryAssetDetailPage.tsx` | modify | Dùng `BatteryRealtimeDetail` với `canManage canManageTopology`; giữ dialog CRUD admin (Form/Transfer/Delete) ở wrapper admin. |
| `features/admin/pages/BatteryAssetsPage.tsx` | modify | Đổi import hook/type/service sang shared; giữ nút "Tạo mới" + BatteryAssetForm (admin). |
| `features/admin/components/battery/BatteryAssetTable.tsx` | modify | Đổi import type sang shared. |
| Mọi file admin còn import cụm đã move | modify | Sửa path import → shared (grep-driven). |
| `features/admin/components/iot/SetTopologyDialog.tsx` | keep | Vẫn ở admin; CascadeRiskCard shared nhận optional render-prop/flag để mở dialog này (admin truyền vào). |

### D. Manager — list + detail
| File | Action |
|---|---|
| `features/manager/pages/BatteryAssetsPage.tsx` | create (read-only: bảng list, KHÔNG nút Tạo/Sửa/Xóa; dùng shared hook `useBatteryAssets`) |
| `features/manager/pages/BatteryAssetDetailPage.tsx` | create (render `<BatteryRealtimeDetail canManage={false} backTo="/manager/battery-assets" />`) |
| `features/manager/config/managerNav.ts` | modify (thêm nav "Battery Assets" → `/manager/battery-assets`) |
| `router/index.tsx` | modify (thêm 2 route trong block MANAGER) |
| `features/manager/components/battery/*`, `hooks/battery/useBatteryAsset.ts`, `services/battery/*` | modify/delete (chuyển sang dùng shared; xóa bản copy manager nếu trùng) |

### E. Staff — detail (không list) + nút từ ticket
| File | Action |
|---|---|
| `features/staff/pages/BatteryAssetDetailPage.tsx` | create (render `<BatteryRealtimeDetail canManage={false} backTo={-1} />`) |
| `router/index.tsx` | modify (thêm route `/staff/battery-assets/:id` trong block STAFF; KHÔNG thêm list) |
| `features/staff/components/battery/BatteryAssetInfoPanel.tsx` | modify (thêm nút/link "Xem chi tiết real-time" → `/staff/battery-assets/${batteryAssetId}`) |
| `features/staff/hooks/battery/useBatteryAsset.ts`, `services/battery/*`, `components/battery/*` | modify/delete (dùng shared; xóa copy staff nếu trùng) |

## Enums
| Enum | File nguồn (sau move) |
|---|---|
| AnomalyClassificationEnum, StaffFeedbackEnum (+ Label maps) | `shared/enums/battery/ai.enum.ts` |
| BatteryStatusEnum, WarrantyStatusEnum | `shared/enums/battery/battery.enum.ts` (đã tồn tại) |

## Types
Không tạo type mới — chỉ **di chuyển** sang shared: `SohPredictionDto`, `AnomalyClassificationDto`, `*ListParams`, `BatteryAssetDto/DetailDto/RealtimeDto`, `SensorReading*`, `ThresholdConfigDto`, `CascadeRisk*`.

## Schema (Zod)
Không có form mới (Manager/Staff read-only). Các schema CRUD giữ nguyên ở admin.

## Endpoints
Đã có sẵn đầy đủ trong `shared/utils/endpoints.ts` — **không thêm mới**:
`BATTERY_ASSETS.{LIST,DETAIL,REALTIME,CASCADE_RISK}`, `SENSOR_READINGS.{LATEST,HISTORY,AGGREGATE,AGGREGATE_HOURLY,STREAM}`, `SOH_PREDICTIONS.LIST`, `ANOMALY_CLASSIFICATIONS.{LIST,FEEDBACK}`, `THRESHOLDS.BY_TYPE`.

## queryKeys
Đã có sẵn factory ở `shared/utils/queryKeys.ts` — **không thêm mới** (batteryAssets, sensorReadings, thresholds, sohPredictions, anomalyClassifications). Move không đổi key → cache dùng chung 3 role (đúng ý đồ hiện tại: staff/manager đã share `batteryAssets.detail`).

## Workflow (luồng người dùng)
**Staff (theo ticket):**
```
/staff/tickets/:id → panel pin (BatteryAssetInfoPanel) → click "Xem chi tiết real-time"
  → /staff/battery-assets/:batteryAssetId
  → BatteryRealtimeDetail (canManage=false): live SSE + chart + history + cascade + AI tab
  → back → về ticket
```
**Manager:**
```
nav "Battery Assets" → /manager/battery-assets (list read-only, filter)
  → click 1 pin → /manager/battery-assets/:id → BatteryRealtimeDetail (canManage=false)
```
**Admin (giữ nguyên):**
```
/admin/battery-assets → detail có đủ Sửa/Transfer/Xóa/Topology (canManage=true, canManageTopology=true)
```

## Rủi ro & kiểm soát
- **Regression admin** (đụng nhiều import): sau khi move, chạy `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build`; kiểm tra bằng grep không còn import `@/features/admin/.../battery/<moved>`.
- **Feature-isolation eslint**: sau move, manager/staff KHÔNG được import `features/admin`; admin KHÔNG import manager/staff. Tất cả cụm chung phải nằm ở `shared/`. Verify bằng eslint.
- **Threshold 403 cho Staff**: `useThresholdByType` phải `enabled: role===STAFF ? false : !!batteryTypeId` (hoặc truyền `canReadThreshold` prop) để tránh gọi 403. Telemetry vẫn hiển thị, chỉ không tô màu ngưỡng.
- **Cache key giữ nguyên** khi move → không vỡ cache hiện có.

## Steps
- [ ] B1: Move enums + types battery-detail sang shared, sửa self-import.
- [ ] B2: Move services (split battery-asset read/write) sang shared.
- [ ] B3: Move hooks read-only sang shared, sửa import.
- [ ] B4: Move 5 component chart/AI sang shared; tách SetTopologyDialog qua flag `canManageTopology`.
- [ ] B5: Tạo `shared/components/battery/BatteryRealtimeDetail.tsx` (prop canManage/canManageTopology/backTo + threshold-guard cho staff).
- [ ] B6: Refactor admin BatteryAssetDetailPage/AssetsPage/Table dùng shared (giữ CRUD admin).
- [ ] B7: Manager — tạo list + detail page, thêm route + nav.
- [ ] B8: Staff — tạo detail page, thêm route, thêm nút "Xem real-time" trong panel ticket.
- [ ] B9: Dọn file copy manager/staff trùng; grep xác nhận 0 import admin còn sót.
- [ ] B10: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS.
```
