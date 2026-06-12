# Plan — GH-39: [FE] Battery Assets & Sensor Readings — Management + Monitoring

## Metadata
- **Status:** TESTING — Battery Assets + fix lệch docs + Sensor Readings (build PASS) | **Role:** FE | **Ngày:** 2026-05-20, cập nhật 2026-06-12
- **Issue:** #39 — https://github.com/GSU26SE55/frontend/issues/39
- **Sprint:** Sprint 1 (deadline 2026-05-30)

## Mục tiêu
Tích hợp **13 endpoint** thuộc 2 nhóm Battery Assets + Sensor Readings cho Admin portal: quản lý vòng đời tài sản pin (list/detail/realtime/CRUD/restore/transfer-owner) và giám sát dữ liệu cảm biến (latest snapshot, history, aggregate chart). Tập trung logic (types, service, hooks) + base UI, chưa polish design.

## Đồng bộ docs mới (2026-06-12)

> `docs/api-battery.md` viết lại lớn (+832/−259). Đối chiếu codebase thực tế (2026-06-12): **3/6 mục đã fix sẵn**, còn 3 mục.

| # | Mục | Cần | Trạng thái code thực tế |
|---|-----|-----|------------------------|
| 1 | Write endpoints `/admin/` prefix | POST/PUT/DELETE/PATCH restore/transfer | ✅ FIX (có sẵn) |
| 2 | `ChargingStateEnum` | thêm `Float=4`, `Bypass=5`; bỏ `Fault=4` sai | ✅ FIX 2026-06-12 |
| 3 | `RealtimeDto.chargingState` | → `ChargingStateEnum \| null` | ✅ FIX 2026-06-12 |
| 4 | `BatteryAssetListParams` | thêm `siteId?` | ✅ FIX 2026-06-12 |
| 5 | Bỏ `batteryGroupId/Name` | xoá khỏi DTO/payload | ✅ ĐÃ XOÁ (battery group bỏ hẳn) |
| 6 | Pagination | dùng `totalItems` | ✅ ĐÃ ĐÚNG — `api.types.ts` |

## Scope

**Trong scope — 13 endpoint:**
- **Battery Assets (9):** GET list, GET `/me`, GET `{id}`, GET realtime, POST create, PUT update, DELETE, PATCH restore, PUT transfer-owner
- **Sensor Readings (4):** GET latest, GET history, GET aggregate, POST batch
- Admin portal + AppLayout shell

**Ngoài scope:**
- `GET /api/battery-assets/me` — Customer; web chưa có portal Customer (mobile dùng). Liệt kê cho đủ domain, không build ở web.
- `POST /api/sensor-readings/batch` — IoT gateway (API Key `X-Api-Key`), web không gọi. Liệt kê cho đủ domain.
- Manager / Staff portal · design/styling/responsive · sites management
- Dropdown `batteryTypeId`/`customerId` trong form: lấy data từ **#40 (Battery Catalog)** và Account Management — không thuộc issue này.

## Files

**Battery Assets (9 endpoint):**

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | `BATTERY_ASSETS`: read `/api/battery-assets`, write `/api/admin/battery-assets` |
| `src/shared/utils/queryKeys.ts` | modify | `batteryAssets` factories |
| `src/shared/components/layout/AppLayout.tsx` | create | Layout shell — `<Outlet />` only |
| `src/features/admin/types/battery-asset.types.ts` | create | DTO, RealtimeDto, payloads, list params |
| `src/features/admin/services/battery-asset.service.ts` | create | 8 API calls (read 3 + write 5) |
| `src/features/admin/hooks/useBatteryAssets.ts` | create | useQuery list |
| `src/features/admin/hooks/useBatteryAsset.ts` | create | useQuery detail |
| `src/features/admin/hooks/useBatteryAssetRealtime.ts` | create | useQuery realtime — staleTime:0 + refetchInterval:30s |
| `src/features/admin/hooks/useCreateBatteryAsset.ts` | create | useMutation create |
| `src/features/admin/hooks/useUpdateBatteryAsset.ts` | create | useMutation update |
| `src/features/admin/hooks/useDeleteBatteryAsset.ts` | create | useMutation soft delete |
| `src/features/admin/hooks/useRestoreBatteryAsset.ts` | create | useMutation restore |
| `src/features/admin/hooks/useTransferOwner.ts` | create | useMutation transfer owner |
| `src/features/admin/schemas/battery-asset.schema.ts` | create | Zod Create/Edit + TransferOwner |
| `src/features/admin/components/BatteryAssetTable.tsx` | create | Table + actions |
| `src/features/admin/components/BatteryAssetForm.tsx` | create | Create/Edit form |
| `src/features/admin/components/TransferOwnerDialog.tsx` | create | Dialog chuyển chủ sở hữu |
| `src/features/admin/components/BatteryRealtimeCard.tsx` | create | Card realtime — null-safe |
| `src/features/admin/pages/BatteryAssetsPage.tsx` | create | List page |
| `src/features/admin/pages/BatteryAssetDetailPage.tsx` | create | Detail page + RealtimeCard + tab cảm biến |
| `src/router/index.tsx` | modify | AppLayout + routes `/admin/battery-assets` + `/:id` |

**Sensor Readings (3 GET — POST batch ngoài scope):**

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | `SENSOR_READINGS`: latest/history/aggregate |
| `src/shared/utils/queryKeys.ts` | modify | `sensorReadings` factories |
| `src/features/admin/types/sensor-reading.types.ts` | create | DTO, HistoryResponseDto, AggregateDto, params |
| `src/features/admin/services/sensor-reading.service.ts` | create | 3 GET calls |
| `src/features/admin/hooks/useLatestReading.ts` | create | useQuery — staleTime:0 + refetchInterval:30s |
| `src/features/admin/hooks/useReadingHistory.ts` | create | useInfiniteQuery — cursor |
| `src/features/admin/hooks/useReadingAggregate.ts` | create | useQuery — staleTime:1 phút |
| `src/features/admin/components/SensorHistoryTable.tsx` | create | Bảng raw — infinite scroll |
| `src/features/admin/components/SensorChart.tsx` | create | Recharts SOC/Voltage/Temp từ aggregate |

## Enums

| Enum | File nguồn | Giá trị |
|------|-----------|---------|
| `BatteryStatusEnum` | `shared/enums/battery.enum.ts` | Active=1, Inactive=2, Decommissioned=3 |
| `WarrantyStatusEnum` | `features/admin/enums/battery-asset.enum.ts` | Active=1, Expired=2, Void=3 |
| `ChargingStateEnum` | `features/admin/enums/battery-asset.enum.ts` | Idle=1, Charging=2, Discharging=3, **Float=4, Bypass=5** |

> Pattern `as const` object + type alias (không dùng TS `enum`).

## Types

```ts
// battery-asset.types.ts
export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeId: string;
  batteryTypeName: string;
  siteId: string | null;
  siteName: string | null;
  customerId: string;
  customerName: string;
  installDate: string;
  warrantyEndDate: string | null;
  warrantyStatus: WarrantyStatusEnum;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: BatteryStatusEnum;
  notes: string | null;
  lastSensorReadingAt: string | null;
  createdAt: string;
}

export interface BatteryAssetRealtimeDto {
  assetId: string;
  serialNumber: string;
  status: BatteryStatusEnum;
  time: string | null;
  voltage: number | null;
  current: number | null;
  temperature: number | null;
  socPercent: number | null;
  cycleCount: number | null;
  sohPercent: number | null;
  chargingState: ChargingStateEnum | null;
  activeAlerts: number;
}

// PUT full-replace — required fields giống POST
export interface CreateBatteryAssetPayload {
  serialNumber: string;
  batteryTypeId: string;
  customerId: string;
  siteId?: string;
  installDate: string;
  warrantyEndDate?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface UpdateBatteryAssetPayload extends CreateBatteryAssetPayload {
  warrantyStatus?: WarrantyStatusEnum;
  status?: BatteryStatusEnum;
}

export interface TransferOwnerPayload {
  newCustomerId: string;
  reason?: string;
}

export interface BatteryAssetListParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  customerId?: string;
  batteryTypeId?: string;
  siteId?: string;
  status?: BatteryStatusEnum;
  includeDeleted?: boolean;
}

// sensor-reading.types.ts
export interface SensorReadingDto {
  time: string;              // ISO 8601 UTC
  batteryAssetId: string;
  voltage: number;           // V
  current: number;           // A — âm = đang xả
  temperature: number;       // °C
  socPercent: number;        // 0–100
  cycleCount: number | null;
  sourceDeviceId: string | null;
}

export interface SensorReadingHistoryParams {
  from?: string;
  to?: string;
  limit?: number;   // 1–1000, default 100
  cursor?: string;  // BE lấy record có time < cursor
}

export interface SensorReadingHistoryResponseDto {
  items: SensorReadingDto[]; // sort time GIẢM DẦN
  nextCursor: string | null;
  hasMore: boolean;          // KHÔNG có totalItems
}

export interface SensorReadingAggregateParams {
  from?: string;
  to?: string;
  interval?: "1m" | "5m" | "15m" | "1h" | "1d"; // default "1h"
}

export interface SensorReadingAggregateDto {
  time: string;                  // bucket start (UTC) — field "time", không phải "bucket"
  avgVoltage: number;
  avgCurrent: number;
  avgTemperature: number;
  avgSocPercent: number;
  avgSohPercent: number | null;  // KHÔNG có sampleCount
}
```

## Schema (Zod)

```ts
// battery-asset.schema.ts
const createSchema = z.object({
  serialNumber: z.string().min(5).max(64).regex(/^[A-Z0-9-]+$/, "Chỉ A-Z, 0-9, dấu -"),
  batteryTypeId: z.string().uuid(),
  customerId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  // <input type="date"> trả "YYYY-MM-DD" → transform ISO 8601 trước submit
  installDate: z.string().min(1, "Bắt buộc")
    .refine((v) => new Date(v) <= new Date(), "Không ở tương lai")
    .transform((v) => new Date(v).toISOString()),
  warrantyEndDate: z.string().optional()
    .transform((v) => (v ? new Date(v).toISOString() : undefined)),
  location: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(1000).optional(),
});

const transferOwnerSchema = z.object({
  newCustomerId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});
```

## Endpoints

> **Wrapper:** tất cả bọc `CommonResponse<T>`; list trả `CommonResponse<PaginationResponse<T>>` — access `.data?.items` + `.data?.totalItems`.
> **Auth:** read battery-asset ở `/api/battery-assets`; write ở `/api/admin/battery-assets` (Admin only).

**Battery Assets (9):**

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/battery-assets` | Admin/Manager | `BatteryAssetListParams` | `CommonResponse<PaginationResponse<BatteryAssetDto>>` |
| GET | `/api/battery-assets/me` | Customer | `{ pageNumber, pageSize }` | `CommonResponse<PaginationResponse<BatteryAssetDto>>` *(ngoài scope web)* |
| GET | `/api/battery-assets/{id}` | Mọi role | — | `CommonResponse<BatteryAssetDto>` |
| GET | `/api/battery-assets/{id}/realtime` | Mọi role | — | `CommonResponse<BatteryAssetRealtimeDto>` |
| POST | `/api/admin/battery-assets` | Admin | `CreateBatteryAssetPayload` | `CommonResponse<BatteryAssetDto>` (201) |
| PUT | `/api/admin/battery-assets/{id}` | Admin | `UpdateBatteryAssetPayload` | `CommonResponse<BatteryAssetDto>` |
| DELETE | `/api/admin/battery-assets/{id}` | Admin | — | `CommonResponse` |
| PATCH | `/api/admin/battery-assets/{id}/restore` | Admin | — | `CommonResponse` |
| PUT | `/api/admin/battery-assets/{id}/transfer-owner` | Admin | `TransferOwnerPayload` | `CommonResponse` |

**Sensor Readings (4):**

| Method | Path | Auth | Query | Response |
|--------|------|------|-------|----------|
| GET | `/api/sensor-readings/{batteryAssetId}/latest` | Mọi role | — | `CommonResponse<SensorReadingDto>` |
| GET | `/api/sensor-readings/{batteryAssetId}/history` | Mọi role | `from?`, `to?`, `limit?` (1–1000, def 100), `cursor?` | `CommonResponse<SensorReadingHistoryResponseDto>` |
| GET | `/api/sensor-readings/{batteryAssetId}/aggregate` | Mọi role | `from?`, `to?`, `interval?` (`1m\|5m\|15m\|1h\|1d`, def `1h`) | `CommonResponse<SensorReadingAggregateDto[]>` |
| POST | `/api/sensor-readings/batch` | API Key (IoT) | — | *(ngoài scope web FE)* |

## Workflow

**List flow:**
```
BatteryAssetsPage → useBatteryAssets(params)
  → BatteryAssetTable + pagination + keyword/status filter
  → "Tạo" → BatteryAssetForm (create) · row click → /admin/battery-assets/{id}
  → "Xóa" → useDeleteBatteryAsset → invalidate KEY.batteryAssets
  → "Khôi phục" (includeDeleted=true) → useRestoreBatteryAsset
```

**Create/Edit flow:**
```
BatteryAssetForm → RHF + Zod (transform installDate → ISO 8601)
  → submit: mutateAsync trong try-catch → handleErrorApi({ error, setError })
  → OK: invalidate KEY.batteryAssets → toast.success → close
  → FAIL: EntityError → lỗi dưới input · HttpError → toast
⚠️ KHÔNG copy pattern useLogin (onError) — dùng mutateAsync + try-catch trong component.
```

**Realtime flow:**
```
BatteryAssetDetailPage → useBatteryAssetRealtime(id) [staleTime:0 + refetchInterval:30s]
  → BatteryRealtimeCard: voltage/current/temp/SOH%/activeAlerts · null → "—"
```

**Sensor readings flow (detail → tab "Lịch sử cảm biến"):**
```
useLatestReading(assetId)              → snapshot card (auto-refresh 30s)
useReadingAggregate(assetId, interval) → SensorChart (range ≥ 24h)
useReadingHistory(assetId, params)     → SensorHistoryTable (infinite scroll cursor)
```

**Transfer owner flow:**
```
"Transfer" → TransferOwnerDialog → validate newCustomerId !== asset.customerId
  → mutateAsync(TransferOwnerPayload) → onSuccess: invalidate detail + list
```

## Edge Cases
- `includeDeleted=true`: soft-deleted hiển thị muted/strikethrough
- Realtime/reading null fields → "—", không crash
- Transfer owner: guard `newCustomerId !== currentCustomerId` trước submit
- 409 serial conflict → `handleErrorApi({ error, setError })` map xuống `serialNumber`
- `installDate`: không ở tương lai
- Sensor history: KHÔNG page-number — dùng `hasMore`/`nextCursor` (không có `totalItems`)
- Sensor history/aggregate: luôn truyền `from`/`to`; range lớn → dùng `/aggregate`
- Swagger có query param thừa `BatteryAssetId` (trùng path) → FE bỏ qua, chỉ dùng path

## Success Criteria

| Tiêu chí | Verify |
|----------|--------|
| List load + pagination | Hook trả `items[]` + `totalItems` |
| Create → xuất hiện trong list | POST → list invalidated |
| Edit cập nhật đúng | PUT → detail invalidated |
| Delete → ẩn khỏi list | DELETE → list refetch |
| Restore → hiện lại | PATCH → list invalidated |
| Transfer owner → `customerName` đổi | PUT → detail invalidated |
| Realtime + latest reading refresh 30s | Network tab request đều đặn |
| History infinite scroll | cursor `nextCursor` nối trang |
| Aggregate chart render | SensorChart vẽ từ bucket |
| Build sạch | `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS |

## Router Structure

```tsx
{
  element: <RoleRoute allowedRoles={[UserRole.ADMIN]} />,
  children: [{
    path: "/admin",
    element: <AppLayout />,            // <Outlet />
    children: [
      { index: true, element: <Navigate to="battery-assets" replace /> },
      { path: "battery-assets", element: <BatteryAssetsPage /> },
      { path: "battery-assets/:id", element: <BatteryAssetDetailPage /> },
    ],
  }],
}
```

## Endpoints const (đề xuất `endpoints.ts`)

```ts
SENSOR_READINGS: {
  LATEST:    (assetId: string) => `/api/sensor-readings/${assetId}/latest`,
  HISTORY:   (assetId: string) => `/api/sensor-readings/${assetId}/history`,
  AGGREGATE: (assetId: string) => `/api/sensor-readings/${assetId}/aggregate`,
  // POST /batch: IoT gateway only — KHÔNG thêm vào FE
},
```

## Steps

**Battery Assets — đã ship (2026-05-20):**
- [x] Types · Shared (endpoints/queryKeys) · Service · Hooks · Schema · Router · Components · Pages · build PASS

**Fix lệch docs còn lại (Bước 10) — DONE 2026-06-12:**
- [x] `ChargingStateEnum` (`enums/battery-asset.enum.ts`): `FLOAT=4`, `BYPASS=5` (bỏ `FAULT=4`)
- [x] `BatteryAssetRealtimeDto.chargingState` → `ChargingStateEnum | null`
- [x] `BatteryAssetListParams` → thêm `siteId?`
- [x] (cleanup) xoá orphan `src/features/admin/types/battery-asset.enums.ts`
- [x] ~~`/admin/` prefix~~ · ~~bỏ `batteryGroup*`~~ · ~~`totalItems`~~ — đã có sẵn trong code

**Sensor Readings — mới — DONE 2026-06-12:**
- [x] Bước 11: `sensor-reading.types.ts` + `sensor-reading.service.ts` + `SENSOR_READINGS` (endpoints) + `sensorReadings` (queryKeys)
- [x] Bước 12: Hooks — `useLatestReading`, `useReadingHistory` (useInfiniteQuery cursor), `useReadingAggregate`
- [x] Bước 13: Components — `SensorChart` (Recharts LineChart + range select), `SensorHistoryTable` (cursor "Tải thêm"); wire vào BatteryAssetDetailPage (Tabs Biểu đồ/Lịch sử)
- [x] Bước 14: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS

## Câu hỏi đã giải đáp
- `GET /api/battery-assets/me`: Customer — web chưa có portal Customer, không build ở web
- `POST /api/sensor-readings/batch`: IoT gateway (API Key) — web không gọi
- Role scope: Admin
- PUT full-replace (required fields giống POST)
- Response wrapper: `CommonResponse<PaginationResponse<T>>` — `.data?.items`
- `totalCount` vs `totalItems`: `api.types.ts` **đã dùng `totalItems`** (khớp docs) — không cần sửa
- `batteryGroup*`: đã xoá hẳn khỏi code; battery group không còn trong #40 (retitled "Battery Types & Thresholds")
- Dropdown `batteryTypeId`/`customerId`: dependency từ #40 + Account Management — không thuộc issue này
