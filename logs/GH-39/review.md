## BÁO CÁO CODE REVIEW — fix/enum-fe — 2026-06-12

### Scope: FE (Web)
### Effort: Standard
### Phạm vi review: thay đổi GH-39 (Bước 10 fix lệch docs + Sensor Readings)

### TÓM TẮT
Code GH-39 đạt chất lượng tốt — tuân thủ kiến trúc service → hook → component, dùng đúng `ENDPOINTS`/`QUERY_KEY`/`axiosInstance`, UI primitive shadcn. `tsc` + `eslint --max-warnings=0` + `build` đều PASS. Có 2 warning nhỏ (error-state UI, row key) và 1 rủi ro về scope branch (working tree trộn nhiều ticket).

### PHÂN TÍCH

#### ✅ Pass
- **Architecture:** API call qua `sensor-reading.service.ts` → hooks TanStack Query → component; không fetch trực tiếp trong component.
- **Axios:** dùng `shared/lib/axios.ts`, không tạo instance mới.
- **Endpoints:** thêm `SENSOR_READINGS` (latest/history/aggregate) vào `endpoints.ts`; POST `/batch` cố ý loại (IoT/API-Key). Write ops battery-asset đã chuẩn `/api/admin/...`.
- **QueryKeys:** dùng `QUERY_KEY.sensorReadings.*` factory, không inline array.
- **Cursor pagination:** `useReadingHistory` dùng `useInfiniteQuery`, `getNextPageParam` đọc `hasMore`/`nextCursor` đúng; không page-number, không phụ thuộc `totalItems`.
- **Purity:** `Date.now()` đặt trong `queryFn` của `useReadingAggregate` (không gọi trong render) — qua rule `react-hooks/purity`.
- **Fix lệch docs:** `ChargingStateEnum` → `FLOAT=4`/`BYPASS=5`; `RealtimeDto.chargingState` → `| null`; `BatteryAssetListParams` + `siteId?`; xoá orphan `types/battery-asset.enums.ts`.
- **UI:** Card/Button/Table/Tabs/Select/Chart đều từ `components/ui` (shadcn). Loading + empty state có xử lý.
- **Auth:** sensor components render trong `BatteryAssetDetailPage` đã wrap `RoleRoute([ADMIN])` — không thêm route mới, không cần wrap lại.
- **Isolation:** không có cross-feature import; toàn bộ trong `features/admin` + `shared`.
- **Cleanliness:** không còn `console.log`; không còn ref `batteryGroup` sót trong page/component.

#### 🟡 Warning
- `SensorChart.tsx` / `SensorHistoryTable.tsx` — không có UI cho `isError` (chỉ loading + empty). Query lỗi sẽ hiện "Chưa có dữ liệu" gây hiểu nhầm. Gợi ý: thêm nhánh `isError`. (Đồng nhất với `BatteryRealtimeCard` hiện tại cũng chưa có — không phải regression.)
- `SensorHistoryTable.tsx` — `key={r.time}`: nếu 2 reading trùng timestamp tuyệt đối sẽ trùng key React. Rủi ro thấp với time-series UTC; cân nhắc `${r.time}-${idx}` nếu BE có thể trả trùng.

### RỦI RO & LƯU Ý
- **Scope branch:** `fix/enum-fe` không theo chuẩn `feat/GH-39-...`; working tree đang trộn GH-39 với thay đổi khác chưa commit (battery-group removal, `THRESHOLDS` mới, sites `/admin` prefix, bỏ block `BATTERIES`). Khi `/kltn-ship` tạo PR cần xác nhận phạm vi PR đúng — hoặc các thay đổi này có chủ đích đi cùng đợt đồng bộ docs battery. Vi phạm "1 issue = 1 branch" → cần leader xác nhận.
- `POST /api/sensor-readings/batch` không implement — đúng scope (IoT gateway, API Key).
- `useReadingAggregate` đổi chữ ký sang `{ hours, interval }` (khác plan generic `from/to`) để né purity rule — `from` tính tại thời điểm fetch (cửa sổ trượt), `queryKey` ổn định theo `{hours, interval}`.

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
(Quality gates xanh; chỉ warning nhỏ không chặn ship. Rủi ro scope branch là vấn đề quy trình, cần leader xác nhận trước khi mở PR.)
