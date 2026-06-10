# Plan — GH-40: [FE] Battery Catalog — Types & Groups

## Metadata
- **Status:** SHIPPED | **Role:** FE | **Ngày:** 2026-05-20
- **Issue:** #40 — https://github.com/GSU26SE55/frontend/issues/40
- **Sprint:** Sprint 1 (deadline 2026-05-30)

## Mục tiêu
Setup layer service cho Battery Catalog (BatteryType + BatteryGroup): types, Zod schemas, services, TanStack Query hooks. **Không làm UI** — chỉ chuẩn hóa cấu trúc `features/admin` để các issue UI sau mount vào.

## Scope
**Trong scope:**
- Types + enum (BatteryType, BatteryGroup, BatteryChemistry)
- Zod schemas cho create/update payload (validation rules từ `docs/api-battery.md`)
- Services gọi 12 endpoints
- TanStack Query hooks (list, detail, mutations)
- Cập nhật `endpoints.ts` + `queryKeys.ts`
- Fix `PaginationResponse.totalCount → totalItems` (confirmed từ docs — zero consumer hiện tại)

**Ngoài scope:**
- UI pages/components (table, form, dialog)
- Admin layout, Sidebar, AppLayout
- Route wiring (`/admin/battery-types`, `/admin/battery-groups`)

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/types/api.types.ts` | modify | `totalCount` → `totalItems` — confirmed từ docs + live BE response, zero consumer hiện tại |
| `src/shared/utils/endpoints.ts` | modify | Thêm `BATTERY_TYPES`, `BATTERY_GROUPS` |
| `src/shared/utils/queryKeys.ts` | modify | Thêm `batteryTypes`, `batteryGroups` |
| `src/features/admin/types/battery-type.types.ts` | create | BatteryType, BatteryChemistry enum (5 values), params, payloads |
| `src/features/admin/types/battery-group.types.ts` | create | BatteryGroup, params, payloads |
| `src/features/admin/schemas/battery-type.schema.ts` | create | Zod create/update schema với validation từ docs |
| `src/features/admin/schemas/battery-group.schema.ts` | create | Zod create/update schema với validation từ docs |
| `src/features/admin/services/battery-type.service.ts` | create | 6 endpoints |
| `src/features/admin/services/battery-group.service.ts` | create | 6 endpoints |
| `src/features/admin/hooks/useBatteryTypes.ts` | create | useQuery: list + detail |
| `src/features/admin/hooks/useBatteryTypesMutation.ts` | create | useMutation: create, update, delete, restore |
| `src/features/admin/hooks/useBatteryGroups.ts` | create | useQuery: list + detail |
| `src/features/admin/hooks/useBatteryGroupsMutation.ts` | create | useMutation: create, update, delete, restore |

## Enums

> **Note (thêm sau khi SHIPPED):** Enums được tách ra file riêng — không define inline trong types. Plan gốc dùng `export enum` (TypeScript native enum) — codebase thực tế đã đổi sang `as const` object pattern.

| Enum | File |
|------|------|
| `BatteryChemistryEnum` | `features/admin/enums/battery-asset.enum.ts` |
| `BatteryStatusEnum` | `shared/enums/battery.enum.ts` |

## Types (confirmed từ `docs/api-battery.md`)

```ts
// battery-type.types.ts
export enum BatteryChemistry {
  LiFePO4 = 1,
  Nmc = 2,
  Nca = 3,
  Lco = 4,
  Other = 99,
}

export interface BatteryType {
  id: string;
  name: string;
  manufacturer?: string;        // nullable — nhà sản xuất
  nominalCapacityAh: number;    // decimal từ BE → number trong TS
  nominalVoltage: number;       // decimal từ BE → number trong TS
  chemistry: BatteryChemistry;
  maxCycleCount: number;
  description?: string;
  createdAt: string;
}

export interface BatteryTypeListParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;             // docs dùng "keyword", không phải "search"
  includeDeleted?: boolean;
}

export interface CreateBatteryTypePayload {
  name: string;
  manufacturer?: string;
  nominalCapacityAh: number;
  nominalVoltage: number;
  chemistry?: BatteryChemistry; // optional, default LiFePO4 ở BE
  maxCycleCount?: number;       // optional, default 2000 ở BE
  description?: string;
}

export type UpdateBatteryTypePayload = Required<
  Pick<CreateBatteryTypePayload, 'name' | 'nominalCapacityAh' | 'nominalVoltage'>
> & Omit<CreateBatteryTypePayload, 'name' | 'nominalCapacityAh' | 'nominalVoltage'>;
// PUT là full update: name, nominalCapacityAh, nominalVoltage bắt buộc
```

```ts
// battery-group.types.ts
export interface BatteryGroup {
  id: string;
  siteId: string;
  siteName: string;
  name: string;
  batteryTypeId: string;
  batteryTypeName: string;
  batteryCount: number;         // denormalized counter, auto-updated bởi BE
  createdAt: string;
}

export interface BatteryGroupListParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  siteId?: string;
  batteryTypeId?: string;       // thêm từ docs
  includeDeleted?: boolean;
}

export interface CreateBatteryGroupPayload {
  siteId: string;
  name: string;
  batteryTypeId: string;
}

export type UpdateBatteryGroupPayload = CreateBatteryGroupPayload;
// PUT full update — tất cả 3 field đều bắt buộc
// ⚠️ Nếu group đang có asset: BE trả 409 khi đổi siteId hoặc batteryTypeId
```

## ENDPOINTS shape (trong `endpoints.ts`)

```ts
BATTERY_TYPES: {
  LIST: '/api/battery-types',
  DETAIL: (id: string) => `/api/battery-types/${id}`,
  CREATE: '/api/battery-types',
  UPDATE: (id: string) => `/api/battery-types/${id}`,
  DELETE: (id: string) => `/api/battery-types/${id}`,
  RESTORE: (id: string) => `/api/battery-types/${id}/restore`, // confirmed từ docs
},
BATTERY_GROUPS: {
  LIST: '/api/battery-groups',
  DETAIL: (id: string) => `/api/battery-groups/${id}`,
  CREATE: '/api/battery-groups',
  UPDATE: (id: string) => `/api/battery-groups/${id}`,
  DELETE: (id: string) => `/api/battery-groups/${id}`,
  RESTORE: (id: string) => `/api/battery-groups/${id}/restore`, // confirmed từ docs
},
```

## QUERY_KEY factories (trong `queryKeys.ts`)

```ts
export const KEY = {
  currentUser: 'currentUser',
  batteryTypes: 'batteryTypes',  // root — dùng để invalidate broad
  batteryGroups: 'batteryGroups',
} as const;

export const QUERY_KEY = {
  currentUser: {
    session: () => [KEY.currentUser, 'session'] as const,
  },
  batteryTypes: {
    list: (params?: BatteryTypeListParams) => [KEY.batteryTypes, 'list', params] as const,
    detail: (id: string) => [KEY.batteryTypes, 'detail', id] as const,
  },
  batteryGroups: {
    list: (params?: BatteryGroupListParams) => [KEY.batteryGroups, 'list', params] as const,
    detail: (id: string) => [KEY.batteryGroups, 'detail', id] as const,
  },
} as const;
```

## Zod Schemas (validation từ docs)

```ts
// battery-type.schema.ts
export const createBatteryTypeSchema = z.object({
  name: z.string().min(1).max(100),
  manufacturer: z.string().max(100).optional(),
  nominalCapacityAh: z.number().positive(),
  nominalVoltage: z.number().positive(),
  chemistry: z.nativeEnum(BatteryChemistry).optional(),
  maxCycleCount: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});

// updateBatteryTypeSchema — PUT yêu cầu name, nominalCapacityAh, nominalVoltage bắt buộc
// Dùng createBatteryTypeSchema với .required() override cho 3 fields đó
export const updateBatteryTypeSchema = createBatteryTypeSchema.extend({
  name: z.string().min(1).max(100),
  nominalCapacityAh: z.number().positive(),
  nominalVoltage: z.number().positive(),
});
// Note: createBatteryTypeSchema đã mark 3 fields này là required — schema thực tế giống nhau.
// updateBatteryTypeSchema được tạo riêng để semantic rõ ràng cho UI form sau.

// battery-group.schema.ts
export const createBatteryGroupSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().min(1).max(100),
  batteryTypeId: z.string().uuid(),
});

// updateBatteryGroupSchema — PUT full update, tất cả 3 fields bắt buộc (giống create)
export const updateBatteryGroupSchema = createBatteryGroupSchema;
```

## Workflow
Task này chỉ setup data layer — không có user flow hay UI. Workflow section sẽ được bổ sung khi làm issue UI sau (table, form, dialog).

## Invalidation Strategy (explicit)

| Mutation | invalidateQueries | removeQueries |
|----------|------------------|---------------|
| createBatteryType | `KEY.batteryTypes` | — |
| updateBatteryType | `KEY.batteryTypes` | — |
| deleteBatteryType | `KEY.batteryTypes` | `QUERY_KEY.batteryTypes.detail(id)` |
| restoreBatteryType | `KEY.batteryTypes` | — |
| createBatteryGroup | `KEY.batteryGroups` | — |
| updateBatteryGroup | `KEY.batteryGroups` | — |
| deleteBatteryGroup | `KEY.batteryGroups` | `QUERY_KEY.batteryGroups.detail(id)` |
| restoreBatteryGroup | `KEY.batteryGroups` | — |

## Edge Cases
- List API trả empty `items: []` → TanStack Query xử lý tự nhiên
- Mutation onError → `handleErrorApi({ error })` → toast (không có form)
- POST create trả `201` (không phải 200) — Axios xử lý bình thường, `isSuccess` vẫn check được
- PUT battery-groups: BE trả `409` nếu đổi `siteId`/`batteryTypeId` khi group đang có asset

## Success Criteria

| Tiêu chí | Cách verify |
|----------|------------|
| `tsc --noEmit` không lỗi | `npx tsc --noEmit` |
| ESLint 0 warning | `npx eslint src/features/admin --max-warnings=0` |
| Build thành công | `npm run build` |

## Steps
- [x] Bước 1: `api.types.ts` đã có `totalItems` — không cần fix — 2026-05-20
- [x] Bước 2: Cập nhật `endpoints.ts` — BATTERY_TYPES (6), BATTERY_GROUPS (6) — 2026-05-20
- [x] Bước 3: Cập nhật `queryKeys.ts` — batteryGroups root + factories; batteryTypes detail factory — 2026-05-20
- [x] Bước 4: Tạo `battery-type.types.ts` — BatteryChemistryEnum + BatteryTypeDto + payloads — 2026-05-20
- [x] Bước 5: Tạo `battery-group.types.ts` — BatteryGroupDto + payloads — 2026-05-20
- [x] Bước 6: Tạo `battery-type.schema.ts` — create/update schema (z.union literals) — 2026-05-20
- [x] Bước 7: Tạo `battery-group.schema.ts` — create/update schema — 2026-05-20
- [x] Bước 8: Cập nhật `battery-type.service.ts` — 6 API functions — 2026-05-20
- [x] Bước 9: Tạo `battery-group.service.ts` — 6 API functions — 2026-05-20
- [x] Bước 10: Cập nhật `useBatteryTypes.ts` — list + detail queries — 2026-05-20
- [x] Bước 11: Tạo `useBatteryTypesMutation.ts` — create/update/delete/restore — 2026-05-20
- [x] Bước 12: Tạo `useBatteryGroups.ts` — list + detail queries — 2026-05-20
- [x] Bước 13: Tạo `useBatteryGroupsMutation.ts` — create/update/delete/restore — 2026-05-20
- [x] Bước 14: `tsc --noEmit` + `eslint --max-warnings=0` → PASS — 2026-05-20

## Câu hỏi đã giải đáp

| Câu hỏi | Nguồn | Trả lời |
|---------|-------|---------|
| `totalCount` hay `totalItems`? | `docs/api-battery.md` pagination shape | **`totalItems`** — confirmed. Zero consumer hiện tại (`grep` xác nhận chỉ có `api.types.ts`). |
| Restore path: `/{id}` hay `/{id}/restore`? | `docs/api-battery.md` PATCH section | **`/{id}/restore`** — confirmed. Docs ghi rõ `PATCH /api/battery-types/{id}/restore`. |
| Shape BatteryType | `docs/api-battery.md` BatteryTypeDto | Confirmed — thêm `manufacturer?`, `decimal` fields |
| Shape BatteryGroup | BE response + docs | Confirmed — thêm `batteryTypeId` filter param |
| BatteryChemistry values | `docs/api-battery.md` BatteryChemistryEnum | LiFePO4=1, Nmc=2, Nca=3, Lco=4, Other=99 (5 values, không phải 3) |
| List params | `docs/api-battery.md` query params | `keyword` (không phải `search`) + `includeDeleted` + `batteryTypeId` cho groups |
| Description max length | `docs/api-battery.md` POST validation | **Max 500 ký tự** — confirmed |
| POST response code | `docs/api-battery.md` | **201** cho cả BatteryType lẫn BatteryGroup |
| UI scope | User xác nhận | Không làm UI — chỉ setup data layer |
