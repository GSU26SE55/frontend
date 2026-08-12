## BÁO CÁO CODE REVIEW — feat/GH-114-battery-realtime-telemetry — 2026-06-28
### Scope: FE (Web)
### Effort: Standard

### TÓM TẮT
Nền tảng SSE telemetry (5 file shared mới) + wire live card vào admin `BatteryAssetDetailPage` (thay block Realtime inline, net −146/+8). Code sạch, đúng kiến trúc shared/feature, build + eslint PASS, không có lỗi Critical.

### PHẠM VI DIFF
- `src/shared/enums/telemetry.enum.ts` (new) — `SensorSourceTypeEnum`, `SensorSourceCodeEnum`
- `src/shared/types/sensor-stream.types.ts` (new) — `LiveReadingDto` (18-field), `SensorStreamState`
- `src/shared/lib/sse.ts` (new) — `liveReadingSchema` + `parseReading` + `openSse` (native EventSource)
- `src/shared/hooks/useSensorStream.ts` (new) — lifecycle + recreate cap + prefer primary
- `src/shared/components/common/LiveTelemetryCard.tsx` (new) — presentational, `TelemetryDisplay`
- `src/features/admin/pages/BatteryAssetDetailPage.tsx` (mod) — wire card, gỡ helper thừa
- `src/shared/utils/endpoints.ts` (mod) — `SENSOR_READINGS.STREAM`

### PHÂN TÍCH

✅ **Architecture**
- Không có business logic trong component — page chỉ `live = stream.reading ?? rt`; logic SSE nằm ở `useSensorStream`; card presentational.
- Không fetch trực tiếp trong component — SSE qua wrapper `shared/lib/sse.ts` → hook (tương đương service layer; đúng pattern `signalr.ts`).
- Đặt chỗ đúng: toàn bộ foundation ở `shared/` (dùng ≥2 feature — GH-114 admin + GH-116 reuse). Card ở `shared/components/common`.
- **Không cross-feature import** — card (shared) KHÔNG import `features/admin`; charging labels định nghĩa nội bộ trong card (value 1–5) thay vì `ChargingStateEnum` từ admin → giữ đúng chiều phụ thuộc.
- KHÔNG tạo Axios instance mới — SSE dùng `EventSource` (đúng, axios không stream được).

✅ **Code Quality**
- `LiveTelemetryCard` PascalCase.
- Không hardcode URL/token — URL ghép từ `env.VITE_API_BASE_URL` + `ENDPOINTS.SENSOR_READINGS.STREAM`; token từ `Cookies.get("accessToken")`.
- Loading/error state: `SensorStreamState.status` (connecting/open-idle/live/error/closed) + card "Chưa có dữ liệu sensor".
- Không còn `console.log`.

✅ **Error Handling**
- SSE không phải query → không có queryKey/invalidate/mutation/form ở scope này. `rt` (existing) vẫn dùng queryKey factory.
- Không tự `toast.error` trong hook.
- Payload SSE parse defensive `liveReadingSchema.safeParse` → lệch shape/JSON hỏng → drop, không crash.

✅ **UI/UX**
- Không re-implement primitive shadcn — card tái dùng markup StatTile/grid y hệt block cũ (không regress layout).
- Responsive giữ nguyên (grid-cols-2).

✅ **Auth & Security**
- Không route mới (wire vào page admin đã có `ProtectedRoute` + `RoleRoute(['ADMIN'])`).
- Token cookie qua `js-cookie`, không `localStorage`.

🟡 **Warning**
- `src/shared/lib/sse.ts:openSse` — token truyền qua query `?access_token=` → có thể lộ vào access-log server / lịch sử trình duyệt. Đây là **ràng buộc cố hữu của native EventSource** (không set được header), đúng theo contract §3. Chấp nhận cho scope này; nếu cần header thì đổi sang fetch-based client (issue khác).
- `src/shared/hooks/useSensorStream.ts` — `lastPingAt` được set vào state nhưng chưa được UI nào tiêu thụ (dành cho phát hiện stale/ tương lai). Không gây lỗi; cân nhắc dùng để cảnh báo "mất nhịp" sau.
- `useSensorStream` chỉ nhận reading `primary`/null làm headline — nếu 1 pin chỉ phát `redundant`/`external-temp` (không có `primary`), card sẽ fallback `rt` thay vì hiện SSE. Đúng §5.4 (ưu tiên primary), nhưng lưu ý khi test.

### RỦI RO & LƯU Ý
- **Runtime chưa verify**: các hành vi live ~5s, `Realtime:Enabled=false` (chỉ ping), recreate cap khi token hết hạn, fallback khi 403/4xx — KHÔNG kiểm được lúc build, cần `/kltn-test 114` với gateway + iot-simulator chạy.
- **Branch stack trên `feat/GH-113`**: diff vs `dev` chứa cả thay đổi GH-113. Trước khi ship/merge cần GH-113 vào dev trước rồi rebase 114 để PR 114 sạch (không phải lỗi code).
- StrictMode dev mount kép: `cancelled` flag + `es.close()` trong cleanup xử lý đúng, không leak listener (listeners GC cùng EventSource).

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao** (build `tsc -b` + vite PASS, `eslint . --max-warnings=0` PASS, đúng kiến trúc, không cross-feature import, không Critical). Hành vi runtime verify ở bước test.
