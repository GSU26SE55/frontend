# Plan — GH-39: [FE] Battery Asset Management — CRUD & Operations

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-05-20
- **Issue:** #39 — https://github.com/GSU26SE55/frontend/issues/39
- **Sprint:** Sprint 1 (deadline 2026-05-30)

## Mục tiêu
Implement Admin portal cho quản lý battery assets: danh sách, tạo, sửa, xóa mềm, khôi phục, chuyển chủ sở hữu, và xem realtime snapshot. Tập trung vào logic (types, service, hooks) và base UI structure — không áp dụng design polish.

## Scope
**Trong scope:**
- 8 endpoints: GET list, GET detail, GET realtime, POST create, PUT update, DELETE, PATCH restore, PUT transfer-owner
- Admin portal only
- AppLayout shell (minimal wrapper + Outlet)
- Battery types service/hook (dependency dropdown cho Create/Edit form)
- Customer list service/hook (dropdown — filter `roleId = 44444444-4444-4444-4444-444444444444`)

**Ngoài scope:**
- `GET /api/battery-assets/me` — Customer dùng mobile app
- Manager / Staff portal
- Design, styling, responsive layout
- Battery groups, sites management

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | Thêm BATTERY_ASSETS, BATTERY_TYPES, ADMIN_ACCOUNTS |
| `src/shared/utils/queryKeys.ts` | modify | Thêm batteryAssets, batteryTypes, adminAccounts factories |
| `src/shared/components/layout/AppLayout.tsx` | create | Layout shell: `<Outlet />` only — ProtectedRoute đã xử lý ở router level, không double-guard |
| `src/shared/constants/roleIds.ts` | create | `CUSTOMER_ROLE_ID = '44444444-...'` — named constant, không magic string inline |
| `src/features/admin/types/battery-asset.types.ts` | create | BatteryAssetDto, BatteryAssetRealtimeDto, enums, payloads |
| `src/features/admin/services/battery-asset.service.ts` | create | 8 API calls — type `axiosInstance.get<CommonResponse<PaginationResponse<T>>>` cho list |
| `src/features/admin/services/battery-type.service.ts` | create | GET /api/battery-types (dropdown dependency) |
| `src/features/admin/services/account.service.ts` | create | GET /api/admin/accounts với CUSTOMER_ROLE_ID filter |
| `src/features/admin/hooks/useBatteryAssets.ts` | create | useQuery list với params |
| `src/features/admin/hooks/useBatteryAsset.ts` | create | useQuery detail by id |
| `src/features/admin/hooks/useBatteryAssetRealtime.ts` | create | useQuery realtime — staleTime:0 + refetchInterval:30s |
| `src/features/admin/hooks/useCreateBatteryAsset.ts` | create | useMutation create |
| `src/features/admin/hooks/useUpdateBatteryAsset.ts` | create | useMutation update |
| `src/features/admin/hooks/useDeleteBatteryAsset.ts` | create | useMutation soft delete |
| `src/features/admin/hooks/useRestoreBatteryAsset.ts` | create | useMutation restore |
| `src/features/admin/hooks/useTransferOwner.ts` | create | useMutation transfer owner |
| `src/features/admin/hooks/useBatteryTypes.ts` | create | useQuery battery types list |
| `src/features/admin/hooks/useCustomers.ts` | create | useQuery customer accounts — import CUSTOMER_ROLE_ID |
| `src/features/admin/schemas/battery-asset.schema.ts` | create | Zod schema cho Create/Edit + TransferOwner |
| `src/features/admin/components/BatteryAssetTable.tsx` | create | Table với actions (edit, delete, restore) |
| `src/features/admin/components/BatteryAssetForm.tsx` | create | Create/Edit form (shared) + dropdown battery types + customers |
| `src/features/admin/components/TransferOwnerDialog.tsx` | create | Dialog chuyển chủ sở hữu + customer dropdown |
| `src/features/admin/components/BatteryRealtimeCard.tsx` | create | Card hiển thị realtime snapshot với null-safe fields |
| `src/features/admin/pages/BatteryAssetsPage.tsx` | create | List page: table + filter bar + pagination |
| `src/features/admin/pages/BatteryAssetDetailPage.tsx` | create | Detail page: info + BatteryRealtimeCard + actions |
| `src/router/index.tsx` | modify | Thêm AppLayout + Admin routes /admin/battery-assets + /:id |

## Types

```ts
// battery-asset.types.ts
export type BatteryStatusEnum = 1 | 2 | 3        // Active | Inactive | Decommissioned
export type WarrantyStatusEnum = 1 | 2 | 3        // Active | Expired | Void
export type ChargingStateEnum = 1 | 2 | 3 | 4     // Idle | Charging | Discharging | Fault
export type BatteryChemistryEnum = 1 | 2 | 3 | 4 | 99  // LiFePO4 | Nmc | Nca | Lco | Other

export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeId: string;
  batteryTypeName: string;
  siteId: string | null;
  siteName: string | null;
  batteryGroupId: string | null;
  batteryGroupName: string | null;
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
  chargingState: ChargingStateEnum;
  activeAlerts: number;
}

// PUT là full-replace — required fields giống POST (confirmed: docs "Request body: Giống POST, thêm")
export interface CreateBatteryAssetPayload {
  serialNumber: string;
  batteryTypeId: string;
  customerId: string;
  siteId?: string;
  batteryGroupId?: string;
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
  status?: BatteryStatusEnum;
  includeDeleted?: boolean;
}

// Dropdown dependency — src/features/admin/types/battery-type.types.ts
export interface BatteryTypeDto {
  id: string;
  name: string;
  manufacturer: string | null;
  nominalCapacityAh: number;
  nominalVoltage: number;
  chemistry: BatteryChemistryEnum;
  maxCycleCount: number;
  description: string | null;
  createdAt: string;
}

// Dropdown dependency — slim subset của AccountDto dùng cho customer select
// Full AccountDto có profile/staffProfile lồng nhau — không cần thiết ở đây
export interface CustomerDropdownItem {
  id: string;
  fullName: string;
  email: string;
}
```

## Schema (Zod)

```ts
// battery-asset.schema.ts
const createSchema = z.object({
  serialNumber: z.string().min(5).max(64).regex(/^[A-Z0-9-]+$/, 'Chỉ chứa A-Z, 0-9, dấu -'),
  batteryTypeId: z.string().uuid(),
  customerId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  batteryGroupId: z.string().uuid().optional(),
  // <input type="date"> trả "YYYY-MM-DD" — transform thành ISO 8601 trước khi submit
  // BE expect "2026-05-19T00:00:00.000Z", không nhận "2026-05-19" raw
  installDate: z.string()
    .min(1, 'Bắt buộc')
    .refine((val) => new Date(val) <= new Date(), 'Ngày lắp đặt không được ở tương lai')
    .transform((val) => new Date(val).toISOString()),
  warrantyEndDate: z.string()
    .optional()
    .transform((val) => (val ? new Date(val).toISOString() : undefined)),
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

> **Response wrapper:** Tất cả endpoints đều bọc trong `CommonResponse<T>`. List endpoints trả `CommonResponse<PaginationResponse<T>>` — hook access data qua `.data?.items` và `.data?.totalCount`.
> **Lưu ý `totalCount`:** BE docs dùng tên `totalItems`, FE `api.types.ts` khai báo `totalCount`. Dùng theo FE type (`totalCount`) — sẽ xác nhận lại khi BE deploy và có thể cần alias nếu BE trả `totalItems`.

| Method | Path | Request Body / Params | Response |
|--------|------|-----------------------|----------|
| GET | `/api/battery-assets` | `BatteryAssetListParams` | `CommonResponse<PaginationResponse<BatteryAssetDto>>` |
| GET | `/api/battery-assets/{id}` | — | `CommonResponse<BatteryAssetDto>` |
| GET | `/api/battery-assets/{id}/realtime` | — | `CommonResponse<BatteryAssetRealtimeDto>` |
| POST | `/api/battery-assets` | `CreateBatteryAssetPayload` | `CommonResponse<BatteryAssetDto>` |
| PUT | `/api/battery-assets/{id}` | `UpdateBatteryAssetPayload` | `CommonResponse<BatteryAssetDto>` |
| DELETE | `/api/battery-assets/{id}` | — | `CommonResponse` |
| PATCH | `/api/battery-assets/{id}/restore` | — | `CommonResponse` |
| PUT | `/api/battery-assets/{id}/transfer-owner` | `TransferOwnerPayload` | `CommonResponse` |
| GET | `/api/battery-types` | `{ pageNumber, pageSize, keyword? }` | `CommonResponse<PaginationResponse<BatteryTypeDto>>` |
| GET | `/api/admin/accounts` | `{ roleId, pageNumber, pageSize }` | `CommonResponse<PaginationResponse<AccountDto>>` |

## Workflow

**List flow:**
```
BatteryAssetsPage → useBatteryAssets(params)
  → BatteryAssetTable + pagination controls + keyword/status filter
  → "Tạo" button → BatteryAssetForm dialog (create mode)
  → row click → navigate('/admin/battery-assets/{id}')
  → "Xóa" action → useDeleteBatteryAsset.mutate(id) → invalidate KEY.batteryAssets
  → "Khôi phục" (khi includeDeleted=true) → useRestoreBatteryAsset.mutate(id)
```

**Create/Edit flow:**
```
BatteryAssetForm mount → load useBatteryTypes() + useCustomers()
  → React Hook Form + Zod (schema transform installDate → ISO 8601 trước submit)
  → submit: mutateAsync trong try-catch → handleErrorApi({ error, setError })
  → OK: invalidate KEY.batteryAssets → toast.success → close dialog
  → FAIL: lỗi field hiện dưới input, HttpError → toast

⚠️ KHÔNG copy pattern từ useLogin (onError trong useMutation) — useLogin là code cũ chưa refactor.
   Mutation hook cho battery dùng: mutateAsync + try-catch trong component là đúng rule.
```

**Realtime flow:**
```
BatteryAssetDetailPage → useBatteryAssetRealtime(id)
  config: staleTime:0 + refetchInterval:30000
  → BatteryRealtimeCard: voltage, current, temp, SOH%, activeAlerts
  → null fields (chưa có reading) → hiện "—"
```

**Transfer owner flow:**
```
"Transfer" button → TransferOwnerDialog
  → useCustomers() để load dropdown
  → validate: newCustomerId !== asset.customerId (client-side)
  → mutateAsync(TransferOwnerPayload) → onSuccess: invalidate detail + list
```

## Edge Cases
- `includeDeleted=true`: soft-deleted items hiển thị với visual indicator (muted/strikethrough)
- Realtime null fields: pin chưa có sensor reading → hiện "—", không crash
- Transfer owner: guard `newCustomerId !== currentCustomerId` trước khi submit
- 409 serial number conflict → `handleErrorApi({ error, setError })` map xuống `serialNumber` field
- `installDate` validation: không ở tương lai
- Customer dropdown lấy tất cả: `pageSize=100` (assume ít hơn 100 customers trong scope capstone)

## Success Criteria

| Tiêu chí | Cách verify |
|----------|------------|
| List load + pagination hoạt động | Hook trả `items[]` + `totalCount` |
| Create thành công, item xuất hiện trong list | POST → list invalidated |
| Edit cập nhật đúng | PUT → detail invalidated → values cập nhật |
| Delete → item ẩn khỏi list (includeDeleted=false) | DELETE → list refetch |
| Restore → item hiện lại | PATCH → list invalidated |
| Transfer owner → `customerName` đổi | PUT → detail invalidated |
| Realtime tự refresh mỗi 30s | Network tab: request đều đặn 30s |
| Build sạch | `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` PASS |

## Router Structure (Bước 8 — chi tiết)

Thay thế block admin hiện tại (`/admin/*` wildcard) trong `router/index.tsx`:

```tsx
{
  element: <RoleRoute allowedRoles={[UserRole.ADMIN]} />,
  children: [
    {
      path: "/admin",
      element: <AppLayout />,           // AppLayout dùng <Outlet /> để render children
      children: [
        { index: true, element: <Navigate to="battery-assets" replace /> },
        { path: "battery-assets", element: <BatteryAssetsPage /> },
        { path: "battery-assets/:id", element: <BatteryAssetDetailPage /> },
      ],
    },
  ],
},
```

`AppLayout` là minimal shell — không có sidebar/header design:
```tsx
// shared/components/layout/AppLayout.tsx
import { Outlet } from 'react-router-dom';
export default function AppLayout() {
  return <Outlet />;
}
```

> Router phải implement **trước pages** (Bước 8 trước Bước 6–7) để có thể test navigate.
> Wildcard `/admin/*` cũ phải bị xóa — không để lại hai entries `/admin/*` và `/admin` song song.

## Steps
- [x] Bước 1: Types — `battery-asset.types.ts` (enums + interfaces + payloads) — 2026-05-20
- [x] Bước 2: Shared — cập nhật `endpoints.ts` + `queryKeys.ts` + tạo `shared/constants/roleIds.ts` — 2026-05-20
- [x] Bước 3: Services — `battery-asset.service.ts`, `battery-type.service.ts`, `account.service.ts` — 2026-05-20
- [x] Bước 4: Hooks — `useBatteryAssets`, `useBatteryAsset`, `useBatteryAssetRealtime`, `useBatteryTypes`, `useCustomers` + 5 mutation hooks — 2026-05-20
- [x] Bước 5: Schema — `battery-asset.schema.ts` — 2026-05-20
- [x] Bước 6: Router — thêm battery-assets routes vào admin block — 2026-05-20
- [x] Bước 7: Components — `BatteryAssetTable`, `BatteryAssetForm`, `TransferOwnerDialog`, `BatteryRealtimeCard` — 2026-05-20
- [x] Bước 8: Pages — `BatteryAssetsPage`, `BatteryAssetDetailPage` — 2026-05-20
- [x] Bước 9: `tsc --noEmit` + `eslint --max-warnings=0` → PASS — 2026-05-20

## Câu hỏi đã giải đáp
- `GET /api/battery-assets/me` (Customer): ngoài scope — Customer dùng mobile app
- Role scope: Admin only
- Customer roleId cho dropdown: `44444444-4444-4444-4444-444444444444` (system default) — define tại `shared/constants/roleIds.ts` as `CUSTOMER_ROLE_ID`, không hardcode inline
- AppLayout: base shell only — không áp dụng design trong sprint này
- PUT full-replace hay partial: **full-replace** (confirmed từ API docs — required fields giống POST)
- Response wrapper: `CommonResponse<PaginationResponse<T>>` — `.data?.items` để access list
- `totalCount` vs `totalItems`: dùng FE type `totalCount`, xác nhận lại khi BE deploy
