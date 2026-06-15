# Test Report — GH-39
## Kết quả: PASS ✅
## Ngày chạy: 2026-06-12
### Scope: FE (Web) · Môi trường: local
### Phạm vi: Bước 10 (fix lệch docs) + Sensor Readings

## TÓM TẮT
FE không có unit test suite → chạy 3 quality gate (type check + lint + build). Tất cả PASS, không lỗi.

## Kiểm tra

| Bước | Lệnh | Kết quả |
|------|------|---------|
| Type check | `npx tsc --noEmit` | PASS — 0 errors |
| Lint | `npx eslint . --max-warnings=0` | PASS — 0 warnings |
| Build | `npm run build` | PASS — built in 2.89s |

> Build cảnh báo chunk > 500kB — pre-existing, không phải lỗi của ticket.

## Kiểm tra logic (static)

| Test case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| `ChargingStateEnum` đồng bộ docs | `FLOAT=4`, `BYPASS=5` (bỏ `FAULT=4`) | đúng | ✅ |
| `RealtimeDto.chargingState` nullable | `ChargingStateEnum \| null` | đúng | ✅ |
| `BatteryAssetListParams.siteId` | có `siteId?` | đúng | ✅ |
| Orphan enum file | `types/battery-asset.enums.ts` đã xoá | không còn | ✅ |
| `SENSOR_READINGS` endpoints | latest/history/aggregate (không có batch) | đúng | ✅ |
| `sensorReadingService` | 3 GET qua `axiosInstance` + `ENDPOINTS` | đúng | ✅ |
| `useLatestReading` | `staleTime:0`, `refetchInterval:30000` | đúng | ✅ |
| `useReadingHistory` cursor | `useInfiniteQuery` + `getNextPageParam` (`hasMore`/`nextCursor`) | đúng | ✅ |
| `useReadingAggregate` purity | `Date.now()` trong `queryFn`, không trong render | đúng | ✅ |
| `SensorChart` | Recharts LineChart + range select, loading + empty | đúng | ✅ |
| `SensorHistoryTable` | Table + "Tải thêm" theo cursor, loading + empty | đúng | ✅ |
| Wire detail page | Tabs Biểu đồ / Lịch sử cảm biến | đúng | ✅ |

## Lỗi (nếu có)
Không có lỗi chặn. 2 warning nhỏ (xem `review.md`): sensor components thiếu UI `isError`; `key={r.time}` rủi ro trùng thấp.

## Chưa cover (manual / cần BE local)
- Render thực với data BE: chart vẽ, infinite scroll "Tải thêm", auto-refresh 30s.
- `POST /api/sensor-readings/batch` — ngoài scope web FE (IoT gateway, API Key).

## KẾT LUẬN
**PASS** — Độ tự tin: **Cao** (quality gates xanh; UI cần manual verify với BE local trước demo).
