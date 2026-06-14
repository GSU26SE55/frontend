# Plan — GH-38: [FE] Site Management & Dashboard

## Metadata
- **Status:** TESTING | **Role:** FE | **Ngày:** 2026-05-20
- **Issue:** #38 — https://github.com/GSU26SE55/frontend/issues/38
- **Sprint:** Sprint 1 (deadline 2026-05-30)

## Mục tiêu
Xây dựng FE quản lý địa điểm (Site) cho hệ thống Solar Battery Maintenance — Admin có full CRUD, Manager read-only list + detail; cả hai xem dashboard tổng hợp (healthScore, alert) và danh sách pin tại site. Customer dùng mobile app, không có web page cho site.

## Scope
**Trong scope:**
- Admin: list site (filter + pagination), tạo / sửa / xoá / khôi phục site, trang detail (dashboard + danh sách pin)
- Manager: list site (read-only), trang detail (dashboard + danh sách pin)
- Shared: DTO types, endpoints, query keys, `AppLayout`, `SiteDashboardCard`, `SiteAssetsTable`

**Ngoài scope:**
- Customer portal (mobile app)
- Staff portal cho site
- Filter nâng cao (map view, chart SOH)
- Invite customer vào site

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/types/site.types.ts` | create | `SiteDto`, `SiteDashboardDto`, `SiteFilterParams`, `SiteAssetsFilterParams`, `SiteCreatePayload`, `SiteUpdatePayload` |
| `src/shared/types/battery.types.ts` | create | `BatteryAssetDto` (field cần cho site context) |
| `src/shared/utils/endpoints.ts` | modify | Thêm group `SITES` vào `ENDPOINTS` |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `KEY.sites` + `QUERY_KEY.sites.*` |
| `src/shared/components/layout/AppLayout.tsx` | create | Layout `<Outlet />` cho admin/* và manager/* |
| `src/shared/components/common/SiteDashboardCard.tsx` | create | Card read-only — chứa toàn bộ healthScore color logic |
| `src/shared/components/common/SiteAssetsTable.tsx` | create | Table pin read-only, có phân trang |
| `src/features/admin/schemas/site.schema.ts` | create | Zod schema cho form create/update |
| `src/features/admin/services/site.service.ts` | create | API calls site (full CRUD) |
| `src/features/admin/hooks/useSites.ts` | create | TanStack Query hooks (có staleTime override) |
| `src/features/admin/pages/SiteListPage.tsx` | create | List + filter bar + nút Tạo + `SiteTable` |
| `src/features/admin/components/SiteTable.tsx` | create | Table với cột Edit / Delete / Restore |
| `src/features/admin/components/SiteFormDialog.tsx` | create | Modal create/edit — `try-catch` + `setError` |
| `src/features/admin/pages/SiteDetailPage.tsx` | create | Header + `SiteDashboardCard` + `SiteAssetsTable` + action buttons |
| `src/features/manager/services/site.service.ts` | create | API calls read-only (list + detail + dashboard + assets) |
| `src/features/manager/hooks/useSites.ts` | create | Hooks read-only (có staleTime override cho dashboard) |
| `src/features/manager/pages/SiteListPage.tsx` | create | List read-only, không có action column |
| `src/features/manager/pages/SiteDetailPage.tsx` | create | Detail read-only, không có action buttons |
| `src/router/index.tsx` | modify | Nested site routes cho admin/* và manager/* + `AppLayout` |

## Enums

| Enum | File nguồn |
|------|-----------|
| `SiteStatusEnum` | `shared/enums/site.enum.ts` |
| `BatteryStatusEnum` | `shared/enums/battery.enum.ts` |

```ts
// shared/enums/site.enum.ts
export const SiteStatusEnum = {
  Active: 1,
  UnderMaintenance: 2,
  Decommissioned: 3,
} as const;
export type SiteStatusEnum = (typeof SiteStatusEnum)[keyof typeof SiteStatusEnum];
```

## Types

```ts
// shared/types/site.types.ts
export interface SiteDto {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  installDate: string;          // ISO UTC
  status: SiteStatusEnum;
  contactPersonName?: string;
  contactPersonPhone?: string;
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

export interface SiteAssetsFilterParams {
  pageNumber?: number;
  pageSize?: number;
  status?: BatteryStatusEnum;
}

export interface SiteCreatePayload {
  name: string;
  customerId: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  installDate: string;
  status?: SiteStatusEnum;
  contactPersonName?: string;
  contactPersonPhone?: string;
}

export type SiteUpdatePayload = SiteCreatePayload;
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
  installDate:        z.string().min(1, 'Bắt buộc'),
  status:             z.nativeEnum(SiteStatusEnum).default(SiteStatusEnum.Active),
  contactPersonName:  z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;
```

## Endpoints

```ts
// thêm vào ENDPOINTS trong endpoints.ts
SITES: {
  LIST:      '/api/sites',
  ME:        '/api/sites/me',
  DETAIL:    (id: string)     => `/api/sites/${id}`,
  DASHBOARD: (id: string)     => `/api/sites/${id}/dashboard`,
  ASSETS:    (siteId: string) => `/api/sites/${siteId}/assets`,
  CREATE:    '/api/admin/sites',
  UPDATE:    (id: string)     => `/api/admin/sites/${id}`,
  DELETE:    (id: string)     => `/api/admin/sites/${id}`,
  RESTORE:   (id: string)     => `/api/admin/sites/${id}/restore`,
},
```

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/sites` | Admin/Manager | `SiteFilterParams` (query) | `CommonResponse<PaginationResponse<SiteDto>>` |
| GET | `/api/sites/me` | Customer | `pageNumber, pageSize` | `CommonResponse<PaginationResponse<SiteDto>>` |
| GET | `/api/sites/{id}` | Mọi role | — | `CommonResponse<SiteDto>` |
| GET | `/api/sites/{id}/dashboard` | Mọi role | — | `CommonResponse<SiteDashboardDto>` |
| GET | `/api/sites/{siteId}/assets` | Mọi role | `SiteAssetsFilterParams` | `CommonResponse<PaginationResponse<BatteryAssetDto>>` — offset-based |
| POST | `/api/admin/sites` | Admin | `SiteCreatePayload` | `CommonResponse<SiteDto>` |
| PUT | `/api/admin/sites/{id}` | Admin | `SiteUpdatePayload` | `CommonResponse<SiteDto>` |
| DELETE | `/api/admin/sites/{id}` | Admin | — | `CommonResponse<null>` |
| PATCH | `/api/admin/sites/{id}/restore` | Admin | — | `CommonResponse<null>` |

> Read endpoints nằm dưới `/api/sites` (SitesController). Write endpoints (create/update/delete/restore) nằm dưới `/api/admin/sites` (AdminSitesController).

## Query Keys

```ts
// queryKeys.ts
KEY.sites = 'sites'

QUERY_KEY.sites = {
  list:      (params?: SiteFilterParams) => [KEY.sites, 'list', params] as const,
  detail:    (id: string)                 => [KEY.sites, 'detail', id] as const,
  dashboard: (id: string)                 => [KEY.sites, 'dashboard', id] as const,
  assets:    (siteId: string, params?: SiteAssetsFilterParams) =>
               [KEY.sites, 'assets', siteId, params] as const,
}
```

## staleTime Override

| Hook | staleTime | Lý do |
|------|-----------|-------|
| `useSiteList` | default (2 phút) | List ít thay đổi real-time |
| `useSiteDetail` | default (2 phút) | Metadata site ổn định |
| `useSiteDashboard` | **1 phút** | Dashboard stats rule (fe.md) — healthScore/alert ảnh hưởng safety |
| `useSiteAssets` | default (2 phút) | Asset list ổn định |

## Workflow

**Admin — Tạo site:**
```
Click "Tạo site" → SiteFormDialog mở
→ submit → useCreateSite.mutateAsync(data)   // POST /api/admin/sites
→ OK:   invalidate QUERY_KEY.sites.list → đóng dialog → toast.success
→ FAIL: handleErrorApi({ error, setError })
         → EntityError: setError('customerId', ...) — hiện dưới field
         → HttpError:   toast.error(message)
```

**Admin — Sửa site:**
```
Click "Sửa" → SiteFormDialog với defaultValues từ SiteDto
→ submit → useUpdateSite.mutateAsync({ id, ...data })   // PUT /api/admin/sites/{id}
→ OK:   invalidate list + detail → đóng dialog → toast
→ FAIL: handleErrorApi({ error, setError })
```

**Admin — Xoá / Khôi phục site:**
```
Xoá:      confirm → useDeleteSite.mutate(id)   // DELETE /api/admin/sites/{id}
Khôi phục: useRestoreSite.mutate(id)            // PATCH  /api/admin/sites/{id}/restore
→ OK: invalidate list → toast | FAIL: onError → handleErrorApi({ error })
(không có form → dùng onError của useMutation, không setError)
```

**Admin/Manager — Xem detail + dashboard:**
```
Click row → navigate /admin/sites/{id} (hoặc /manager/sites/{id})
→ Parallel: useSiteDetail(id) + useSiteDashboard(id) + useSiteAssets(id)
→ Render SiteDashboardCard + SiteAssetsTable
```

**SiteFormDialog — error handling (try-catch bắt buộc):**
```ts
const { handleSubmit, setError } = useForm<SiteFormValues>();
const { mutateAsync } = useCreateSite();   // hoặc useUpdateSite

const onSubmit = async (data: SiteFormValues) => {
  try {
    await mutateAsync(data);
  } catch (error) {
    handleErrorApi({ error, setError });
  }
};
```

## healthScore Color Logic — DUY NHẤT trong `SiteDashboardCard`

```ts
// SiteDashboardCard.tsx — không implement lại ở page component
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
- Site chưa có asset: `healthScore = 100`, `SiteAssetsTable` hiện "Chưa có pin nào"
- `customerId` không tồn tại khi create → BE trả 409 → `handleErrorApi` map xuống field `customerId`
- `latitude` / `longitude` optional → render "—" nếu null
- Site đã xoá: Admin thấy badge "Đã xoá" + nút "Khôi phục"; Manager không thấy (`includeDeleted = false`)
- Pagination assets: offset-based, default `pageNumber=1, pageSize=10`
- `/api/sites/me` trả cùng `SiteDto` shape như `/api/sites` — dùng chung type

## Success Criteria

| Tiêu chí | Cách verify |
|----------|------------|
| Admin tạo site thành công | POST `/api/admin/sites`, site xuất hiện trong list |
| Admin sửa site | PUT `/api/admin/sites/{id}`, detail cập nhật |
| Admin xoá / khôi phục site | DELETE + PATCH restore, trạng thái đổi |
| Manager thấy list + detail, không có action buttons | UI không render Edit/Delete/Create |
| healthScore đúng màu (3 ngưỡng) | `SiteDashboardCard` với data mock 3 trường hợp |
| Color logic chỉ ở `SiteDashboardCard` | Grep: không có `text-green-600`/`text-red-600` ngoài card |
| `SiteAssetsTable` phân trang | Next page hoạt động |
| 409 customerId hiện dưới field | `SiteFormDialog` submit customerId sai |
| `tsc --noEmit` 0 error | `npx tsc --noEmit` |
| `eslint --max-warnings=0` | `npx eslint . --max-warnings=0` |
| `npm run build` | Build thành công |

## Steps
- [x] Bước 1: Tạo `shared/types/site.types.ts` + `shared/types/battery.types.ts` — 2026-05-20
- [x] Bước 2: Modify `shared/utils/endpoints.ts` (group `SITES`) + `shared/utils/queryKeys.ts` (`KEY.sites` + `QUERY_KEY.sites.*`) — 2026-05-20
- [x] Bước 3: Tạo `shared/components/layout/AppLayout.tsx` — 2026-05-20
- [x] Bước 4: Tạo `shared/components/common/SiteDashboardCard.tsx` (color logic) + `SiteAssetsTable.tsx` — 2026-05-20
- [x] Bước 5: Tạo `admin/schemas/site.schema.ts` + `admin/services/site.service.ts` — 2026-05-20
- [x] Bước 6: Tạo `admin/hooks/useSites.ts` (`staleTime: 60_000` cho dashboard) — 2026-05-20
- [x] Bước 7: Tạo `admin/components/SiteTable.tsx` + `admin/components/SiteFormDialog.tsx` (try-catch + setError) — 2026-05-20
- [x] Bước 8: Tạo `admin/pages/SiteListPage.tsx` + `admin/pages/SiteDetailPage.tsx` — 2026-05-20
- [x] Bước 9: Tạo `manager/services/site.service.ts` + `manager/hooks/useSites.ts` — 2026-05-20
- [x] Bước 10: Tạo `manager/pages/SiteListPage.tsx` + `manager/pages/SiteDetailPage.tsx` — 2026-05-20
- [x] Bước 11: Modify `router/index.tsx` — nested site routes + `AppLayout` — 2026-05-20
- [x] Bước 12: `npx tsc --noEmit` + `npx eslint . --max-warnings=0` + `npm run build` → PASS — 2026-05-20

---

## Đối chiếu code thực tế (2026-06-14)

> Đối chiếu `plan.md` ⇄ `src/` (build PASS) ⇄ `docs/api-battery.md`. **Khớp ~95%.** 32/32 file plan đều tồn tại. Code là nguồn sự thật.

| # | Mục | Plan gốc nói | Code thực tế | Đánh giá |
|---|-----|--------------|--------------|----------|
| 1 | `latitude`/`longitude` (Zod) | `z.coerce.number().min/max()` (-90..90 / -180..180) | `z.string()` + convert thủ công `toNumOrNull()` ở form submit | Range **không validate ở Zod** — chỉ dựa BE. Spec range tại dòng 1049-1050. Acceptable, kém chặt hơn plan. |
| 2 | Invalidation các mutation | targeted `QUERY_KEY.sites.list(params)` | broad `[KEY.sites]` (invalidate mọi site query) | Refetch rộng hơn nhưng tránh stale. Không lệch contract. |
| 3 | Admin filter UI | filter bar có keyword + status + customerId + includeDeleted | UI chỉ render keyword + includeDeleted | `status`/`customerId` BE hỗ trợ (spec dòng 911) nhưng **chưa có control UI**. → backlog UI nếu cần. |
| 4 | `manager/services/site.service.ts` | 4 method read-only | thêm `getStaffList` (5 method) | Support cho site assignment, ngoài scope #38 — không hại. |

**Khớp đúng (kiểm chứng):**
- `SiteDto`/`SiteDashboardDto` fields khớp 100% — **KHÔNG** có `capacityKw`/`totalCapacityKw` (đúng spec dòng 1056).
- `SiteStatusEnum` Active=1/UnderMaintenance=2/Decommissioned=3, endpoints read `/api/sites` vs write `/api/admin/sites`, query keys — khớp.
- `healthScore` color logic (`getHealthColor`/`getHealthLabel`, ngưỡng 80/50) nằm **duy nhất** trong `SiteDashboardCard.tsx` — đúng spec dòng 1008-1012 + rule plan.
- `useSiteDashboard` staleTime 1 phút (60_000) — khớp.
