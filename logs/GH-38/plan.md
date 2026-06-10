# Plan — GH-38: [FE] Site Management & Dashboard

## Metadata
- **Status:** SHIPPED | **Role:** FE | **Ngày:** 2026-05-20
- **Issue:** #38 — https://github.com/GSU26SE55/frontend/issues/38
- **Sprint:** Sprint 1 (deadline 2026-05-30)

## Mục tiêu
Xây dựng FE cho quản lý địa điểm (site) — Admin có full CRUD, Manager có read-only list + detail, cả hai đều xem dashboard summary và danh sách pin tại site. Customer không có web page cho site (chỉ dùng mobile app).

## Scope
**Trong scope:**
- Admin: danh sách site (có filter/pagination), tạo/sửa/xoá/khôi phục site, trang detail với dashboard + danh sách pin
- Manager: danh sách site (read-only), trang detail với dashboard + danh sách pin
- Shared: DTO types, endpoints, query keys, AppLayout (minimal), SiteDashboardCard, SiteAssetsTable

**Ngoài scope:**
- Customer portal (dùng mobile app)
- Staff portal cho site
- Filter nâng cao (map view, chart SOH)
- Invite customer vào site

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/types/site.types.ts` | create | SiteDto, SiteDashboardDto, SiteStatusEnum, SiteCreatePayload, SiteUpdatePayload, SiteFilterParams, **SiteAssetsFilterParams** |
| `src/shared/types/battery.types.ts` | create | BatteryAssetDto (11 key fields), BatteryStatusEnum |
| `src/shared/utils/endpoints.ts` | **modify** | Thêm `SITES` group vào object `ENDPOINTS` hiện có — không tạo file mới |
| `src/shared/utils/queryKeys.ts` | **modify** | Thêm `KEY.sites` + `QUERY_KEY.sites.*` vào object hiện có — không tạo file mới |
| `src/shared/components/layout/AppLayout.tsx` | create | Minimal layout với `<Outlet />`, cần cho admin/* và manager/* routes |
| `src/shared/components/common/SiteDashboardCard.tsx` | create | Read-only card — **chứa toàn bộ healthScore color logic**, cross-feature |
| `src/shared/components/common/SiteAssetsTable.tsx` | create | Read-only paginated battery table, cross-feature |
| `src/features/admin/schemas/site.schema.ts` | create | Zod schema cho create/update form |
| `src/features/admin/services/site.service.ts` | create | Toàn bộ API calls site (full CRUD) |
| `src/features/admin/hooks/useSites.ts` | create | TanStack Query hooks cho admin (có staleTime override) |
| `src/features/admin/pages/SiteListPage.tsx` | create | List với filter bar + Create button + SiteTable |
| `src/features/admin/components/SiteTable.tsx` | create | Table với cột Edit/Delete/Restore |
| `src/features/admin/components/SiteFormDialog.tsx` | create | Create/Edit modal — dùng `try-catch` + `setError` |
| `src/features/admin/pages/SiteDetailPage.tsx` | create | Header + SiteDashboardCard + SiteAssetsTable + admin action buttons |
| `src/features/manager/services/site.service.ts` | create | Read-only API calls (list + detail + dashboard + assets) |
| `src/features/manager/hooks/useSites.ts` | create | Read-only hooks (có staleTime override cho dashboard) |
| `src/features/manager/pages/SiteListPage.tsx` | create | Read-only list, không có action columns |
| `src/features/manager/pages/SiteDetailPage.tsx` | create | Detail với dashboard + assets, không có action buttons |
| `src/router/index.tsx` | **modify** | Expand `admin/*` và `manager/*` với nested site routes + AppLayout |

## Enums

> **Note (thêm sau khi SHIPPED):** Enums được tách ra `src/shared/enums/` — không define inline trong types. Plan gốc dùng `export enum` (TypeScript native enum) — codebase thực tế đã đổi sang `as const` object pattern.

| Enum | File |
|------|------|
| `SiteStatusEnum` | `shared/enums/site.enum.ts` |
| `BatteryStatusEnum` | `shared/enums/battery.enum.ts` |

## Types

```ts
// shared/types/site.types.ts
export enum SiteStatusEnum { Active = 1, UnderMaintenance = 2, Decommissioned = 3 }

export interface SiteDto {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  capacityKw?: number;
  installDate: string;          // ISO UTC
  status: SiteStatusEnum;
  contactPersonName?: string;
  contactPersonPhone?: string;
  batteryGroupCount: number;
  batteryAssetCount: number;
  activeBatteryAssetCount: number;
  createdAt: string;
}

export interface SiteDashboardDto {
  siteId: string;
  name: string;
  customerId: string;
  totalAssets: number;
  activeAssets: number;
  assetsWithActiveAlerts: number;
  totalCapacityKw?: number;
  lastAlertAt?: string;
  healthScore: number;          // 0–100
}

export interface SiteFilterParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  customerId?: string;
  status?: SiteStatusEnum;
  includeDeleted?: boolean;
}

export interface SiteCreatePayload {
  name: string;
  customerId: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  capacityKw?: number | null;
  installDate: string;
  status?: SiteStatusEnum;
  contactPersonName?: string;
  contactPersonPhone?: string;
}

export type SiteUpdatePayload = SiteCreatePayload;
```

```ts
// shared/types/battery.types.ts
// 11 fields đủ cho site context. BE thực tế trả nhiều field hơn — TypeScript không
// complain về extra properties trong response, nhưng verify với BE trước khi implement
// SiteAssetsTable để tránh bỏ sót field cần hiển thị.
export enum BatteryStatusEnum { Active = 1, Inactive = 2, Decommissioned = 3 }

export interface BatteryAssetDto {
  id: string;
  serialNumber: string;
  batteryTypeName: string;
  batteryGroupName?: string;
  customerId: string;
  customerName: string;
  installDate: string;
  status: BatteryStatusEnum;
  location?: string;
  lastSensorReadingAt?: string;
  createdAt: string;
}
```

## Schema (Zod)

```ts
// admin/schemas/site.schema.ts
export const siteFormSchema = z.object({
  name:               z.string().min(1, 'Bắt buộc').max(200),
  customerId:         z.string().uuid('UUID không hợp lệ'),
  address:            z.string().optional(),
  latitude:           z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude:          z.coerce.number().min(-180).max(180).optional().nullable(),
  capacityKw:         z.coerce.number().positive().optional().nullable(),
  installDate:        z.string().min(1, 'Bắt buộc'),
  status:             z.nativeEnum(SiteStatusEnum).default(SiteStatusEnum.Active),
  contactPersonName:  z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;
```

## Endpoints (thêm vào `ENDPOINTS` trong `endpoints.ts`)

```ts
SITES: {
  LIST:          '/api/sites',
  ME:            '/api/sites/me',
  DETAIL:        (id: string) => `/api/sites/${id}`,
  DASHBOARD:     (id: string) => `/api/sites/${id}/dashboard`,
  ASSETS:        (siteId: string) => `/api/sites/${siteId}/assets`,
  RESTORE:       (id: string) => `/api/sites/${id}/restore`,
},
```

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/sites` | `SiteFilterParams` (query) | `CommonResponse<PaginationResponse<SiteDto>>` |
| GET | `/api/sites/me` | `pageNumber, pageSize` (query) | `CommonResponse<PaginationResponse<SiteDto>>` — cùng shape SiteDto |
| GET | `/api/sites/:id` | — | `CommonResponse<SiteDto>` |
| GET | `/api/sites/:id/dashboard` | — | `CommonResponse<SiteDashboardDto>` |
| GET | `/api/sites/:siteId/assets` | `pageNumber, pageSize, batteryGroupId?, status?` | `CommonResponse<PaginationResponse<BatteryAssetDto>>` — offset-based (relational data, không phải TimescaleDB) |
| POST | `/api/sites` | `SiteCreatePayload` | `CommonResponse<SiteDto>` |
| PUT | `/api/sites/:id` | `SiteUpdatePayload` | `CommonResponse<SiteDto>` |
| DELETE | `/api/sites/:id` | — | `CommonResponse<null>` |
| PATCH | `/api/sites/:id/restore` | — | `CommonResponse<null>` |

## Query Keys (thêm vào `queryKeys.ts`)

```ts
// KEY (root — dùng để invalidate broad)
KEY.sites = 'sites'

// QUERY_KEY factories
QUERY_KEY.sites = {
  list:      (params?: SiteFilterParams)        => [KEY.sites, 'list', params] as const,
  detail:    (id: string)                        => [KEY.sites, 'detail', id] as const,
  dashboard: (id: string)                        => [KEY.sites, 'dashboard', id] as const,
  assets:    (siteId: string, params?: SiteAssetsFilterParams) =>
               [KEY.sites, 'assets', siteId, params] as const,
}
```

`SiteAssetsFilterParams` định nghĩa trong `shared/types/site.types.ts` (kèm với SiteFilterParams):

```ts
export interface SiteAssetsFilterParams {
  pageNumber?: number;
  pageSize?: number;
  batteryGroupId?: string;
  status?: BatteryStatusEnum;
}
```

## staleTime Override (hooks — quan trọng với operational safety)

| Hook | staleTime | Lý do |
|------|-----------|-------|
| `useSiteList` | default (2 phút) | List ít thay đổi real-time |
| `useSiteDetail` | default (2 phút) | Metadata site ổn định |
| `useSiteDashboard` | **1 phút** | Dashboard stats rule — fe.md; healthScore/alerts ảnh hưởng safety |
| `useSiteAssets` | default (2 phút) | Asset list ổn định |

## Workflow

**Admin — Tạo site:**
```
Click "Tạo site" → SiteFormDialog mở
→ Điền form → submit → useCreateSite.mutateAsync(data)
→ OK:   invalidate QUERY_KEY.sites.list → dialog đóng → toast.success
→ FAIL: handleErrorApi({ error, setError })
         → EntityError: setError('customerId', ...) — hiện dưới field
         → HttpError:   toast.error(message)
```

**Admin — Sửa site:**
```
Click "Sửa" trên row → SiteFormDialog mở với defaultValues từ SiteDto
→ Submit → useUpdateSite.mutateAsync({ id, ...data })
→ OK:   invalidate list + detail → dialog đóng → toast
→ FAIL: handleErrorApi({ error, setError })   (same pattern)
```

**Admin — Xoá site:**
```
Click "Xoá" → confirm dialog → useDeleteSite.mutate(id)
→ OK:   invalidate list → toast | FAIL: onError → handleErrorApi({ error })
(không có form nên dùng onError của useMutation, không setError)
```

**Admin/Manager — Xem detail + dashboard:**
```
Click vào row → navigate /admin/sites/:id (hoặc /manager/sites/:id)
→ Parallel: useSiteDetail(id) + useSiteDashboard(id) + useSiteAssets(id)
→ Render SiteDashboardCard + SiteAssetsTable
```

**SiteFormDialog — error handling pattern (try-catch bắt buộc):**
```ts
const { handleSubmit, setError } = useForm<SiteFormValues>();
const { mutateAsync } = useCreateSite();   // hoặc useUpdateSite

const onSubmit = async (data: SiteFormValues) => {
  try {
    await mutateAsync(data);
    // success — đóng dialog, invalidate đã chạy trong hook
  } catch (error) {
    handleErrorApi({ error, setError });
    // EntityError → setError('customerId', { message: '...' }) — hiện dưới input
    // HttpError  → toast.error(message)
  }
};
```

## healthScore Color Logic — Đặt DUY NHẤT trong `SiteDashboardCard`

Color logic PHẢI nằm trong `SiteDashboardCard.tsx` (shared). **Không implement lại ở page component.**

```ts
// Trong SiteDashboardCard.tsx
function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-600';
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Tốt';
  if (score >= 50) return 'Cần theo dõi';
  return 'Nguy hiểm';
}
```

## Edge Cases
- Site chưa có asset: healthScore = 100, SiteAssetsTable hiện "Chưa có pin nào"
- `customerId` không tồn tại khi create → BE trả 409 → `handleErrorApi` map xuống field `customerId`
- `latitude`/`longitude` optional — render "—" nếu null
- Site đã xoá: Admin thấy badge "Đã xoá" + nút "Khôi phục"; Manager không thấy (includeDeleted mặc định false)
- Pagination assets: default `pageNumber=1, pageSize=10` (offset-based)
- `/api/sites/me` trả cùng `SiteDto` shape như `/api/sites` — manager service dùng chung type

## Success Criteria

| Tiêu chí | Cách verify |
|----------|------------|
| Admin tạo site thành công | POST /api/sites, site xuất hiện trong list |
| Admin sửa site | PUT /api/sites/:id, thông tin cập nhật trong detail |
| Admin xoá/khôi phục site | DELETE + PATCH restore, trạng thái thay đổi |
| Manager thấy list + detail, không có action buttons | Kiểm tra UI không render Edit/Delete/Create |
| healthScore hiển thị đúng màu (3 ngưỡng) | Xem SiteDashboardCard với data mock 3 trường hợp |
| SiteDashboardCard là nguồn duy nhất của color logic | Grep: không có `text-green-600`/`text-red-600` ngoài SiteDashboardCard |
| SiteAssetsTable phân trang | Next page hoạt động |
| 409 customerId error hiện dưới field, không chỉ toast | SiteFormDialog — submit với customerId sai |
| `tsc --noEmit` 0 error | `npx tsc --noEmit` |
| `eslint --max-warnings=0` | `npx eslint . --max-warnings=0` |
| `npm run build` | Build thành công |

## Steps

- [x] Bước 1: Tạo `shared/types/site.types.ts` + `shared/types/battery.types.ts` — 2026-05-20
- [x] Bước 2: **Modify** `shared/utils/endpoints.ts` — thêm `SITES` group. **Modify** `shared/utils/queryKeys.ts` — thêm `KEY.sites` + `QUERY_KEY.sites.*` — 2026-05-20
- [x] Bước 3: Tạo `shared/components/layout/AppLayout.tsx` (minimal `<Outlet />`) — 2026-05-20
- [x] Bước 4: Tạo `shared/components/common/SiteDashboardCard.tsx` (có color logic) + `SiteAssetsTable.tsx` — 2026-05-20
- [x] Bước 5: Tạo `admin/schemas/site.schema.ts` + `admin/services/site.service.ts` — 2026-05-20
- [x] Bước 6: Tạo `admin/hooks/useSites.ts` — chú ý `staleTime: 60_000` cho `useSiteDashboard` — 2026-05-20
- [x] Bước 7: Tạo `admin/components/SiteTable.tsx` + `admin/components/SiteFormDialog.tsx` (try-catch + setError) — 2026-05-20
- [x] Bước 8: Tạo `admin/pages/SiteListPage.tsx` + `admin/pages/SiteDetailPage.tsx` — 2026-05-20
- [x] Bước 9: Tạo `manager/services/site.service.ts` + `manager/hooks/useSites.ts` (staleTime dashboard) — 2026-05-20
- [x] Bước 10: Tạo `manager/pages/SiteListPage.tsx` + `manager/pages/SiteDetailPage.tsx` — 2026-05-20
- [x] Bước 11: **Modify** `router/index.tsx` — expand admin/* và manager/* với nested site routes + AppLayout — 2026-05-20
- [x] Bước 12: `npx tsc --noEmit` + `npx eslint . --max-warnings=0` + `npm run build` → PASS — 2026-05-20

## Câu hỏi đã giải đáp
- **Dashboard shape**: `SiteDashboardDto` — healthScore 0–100, công thức từ `api-battery.md §Nhóm 6`
- **Scope portals**: Admin = full CRUD, Manager = read-only. Customer không có web page.
- **BE availability**: Tất cả endpoints đã sẵn sàng.
- **Site entity fields**: 15 fields từ `api-battery.md §SiteDto`
- **`/api/sites/me` shape**: Cùng `PaginationResponse<SiteDto>` như `/api/sites`, chỉ lọc theo customer — dùng chung type
- **Pagination assets**: Offset-based (`pageNumber/pageSize`) — BatteryAsset lưu PostgreSQL, không phải TimescaleDB
- **healthScore color**: Logic đặt DUY NHẤT trong `SiteDashboardCard` (shared) để tránh duplicate
- **staleTime dashboard**: 1 phút (theo fe.md "dashboard stats" rule) — ghi rõ trong hooks
- **SiteFormDialog errors**: 409 customerId map xuống field qua `handleErrorApi({ error, setError })` — không chỉ toast
