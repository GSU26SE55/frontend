# Plan — GH-40: [FE] Battery Types & Thresholds — data layer (9 endpoints)

## Metadata
- **Status:** REVIEWING (data layer ✅ · UI ✅) | **Role:** FE | **Ngày:** 2026-06-12
- **Issue:** #40 — https://github.com/GSU26SE55/frontend/issues/40
- **Sprint:** Sprint 1 (deadline 2026-05-30)

## Mục tiêu
Setup data layer (types · Zod schema · service · TanStack Query hooks) cho 2 nhóm API trong `docs/api-battery.md`:
- **Battery Types** (Nhóm 3 — 6 endpoints): loại pin (model, chemistry, dung lượng, điện áp...).
- **Threshold Configs** (Nhóm 6 — 3 endpoints): ngưỡng cảnh báo theo từng `BatteryType`.

**Không làm UI** — chỉ chuẩn hóa cấu trúc `features/admin` để các issue UI sau mount vào.

## Scope
**Trong scope:**
- Battery Types: types + enum + Zod schema + service (6 endpoints) + hooks (list/detail/mutations).
- Thresholds: types + Zod schema (cross-field) + service (3 endpoints) + hooks (list/byType/upsert).
- Cập nhật `endpoints.ts` + `queryKeys.ts`.
- **UI Admin**: trang quản lý Loại pin (list/search/CRUD/restore) + dialog cấu hình Ngưỡng theo loại pin (route `/admin/battery-types` + nav).

**Ngoài scope:**
- AnomalyType enum (thuộc Alerts feature — không cần cho 3 threshold endpoint).
- Ambient threshold configs (Nhóm 8 — domain khác).
- Trang danh sách toàn bộ Threshold (`GET /api/thresholds`) — hook đã có, UI để dành issue sau.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/utils/endpoints.ts` | modify | `BATTERY_TYPES` (write ops `/api/admin/...`) · thêm `THRESHOLDS` |
| `src/shared/utils/queryKeys.ts` | modify | `batteryTypes` · thêm `thresholds` |
| `src/features/admin/types/battery-type.types.ts` | done ✅ | DTO + params + payloads |
| `src/features/admin/schemas/battery-type.schema.ts` | done ✅ | create/update schema |
| `src/features/admin/services/battery-type.service.ts` | done ✅ | 6 endpoints |
| `src/features/admin/hooks/useBatteryTypes.ts` | done ✅ | list + detail |
| `src/features/admin/hooks/useBatteryTypesMutation.ts` | done ✅ | create/update/delete/restore |
| `src/features/admin/types/threshold.types.ts` | create ⏳ | DTO + params + upsert payload |
| `src/features/admin/schemas/threshold.schema.ts` | create ⏳ | upsert schema + cross-field refine |
| `src/features/admin/services/threshold.service.ts` | create ⏳ | 3 endpoints |
| `src/features/admin/hooks/useThresholds.ts` | create ✅ | list + byType query |
| `src/features/admin/hooks/useThresholdsMutation.ts` | create ✅ | upsert mutation |
| `src/features/admin/pages/BatteryTypesPage.tsx` | create ✅ | list + search + CRUD + restore |
| `src/features/admin/components/BatteryTypeTable.tsx` | create ✅ | bảng loại pin + actions |
| `src/features/admin/components/BatteryTypeFormDialog.tsx` | create ✅ | form create/edit (RHF + Zod) |
| `src/features/admin/components/ThresholdConfigDialog.tsx` | create ✅ | upsert ngưỡng theo loại pin |
| `src/router/index.tsx` | modify ✅ | route `/admin/battery-types` |
| `src/shared/components/layout/AppLayout.tsx` | modify ✅ | nav "Loại pin & Ngưỡng" |

## Enums
| Enum | File nguồn | Ghi chú |
|------|-----------|---------|
| `BatteryChemistryEnum` | `features/admin/enums/battery-asset.enum.ts` | LiFePO4=1, Nmc=2, Nca=3, Lco=4, Other=99 |

> Thresholds không cần enum mới — tất cả field là `decimal` / `bool` / `DateTime`.

## Types
```ts
// battery-type.types.ts
export interface BatteryTypeDto {
  id: string;
  name: string;
  manufacturer?: string;
  nominalCapacityAh: number;     // decimal → number
  nominalVoltage: number;        // decimal → number
  chemistry: BatteryChemistryEnum;
  maxCycleCount: number;
  description?: string;
  createdAt: string;
}
export interface BatteryTypeListParams {
  pageNumber?: number; pageSize?: number; keyword?: string; includeDeleted?: boolean;
}
export interface CreateBatteryTypePayload {
  name: string; manufacturer?: string;
  nominalCapacityAh: number; nominalVoltage: number;
  chemistry?: BatteryChemistryEnum;   // default LiFePO4 ở BE
  maxCycleCount?: number;             // default 2000 ở BE
  description?: string;
}
// PUT full update — name, nominalCapacityAh, nominalVoltage bắt buộc
export type UpdateBatteryTypePayload = CreateBatteryTypePayload;

// threshold.types.ts
export interface ThresholdConfigDto {
  id: string;
  batteryTypeId: string;
  batteryTypeName: string;
  voltageMin: number;
  voltageMax: number;
  temperatureMax: number;
  temperatureMin: number;
  socWarningThreshold: number;
  socCriticalThreshold: number;
  currentMaxCharge?: number;     // nullable — không giới hạn
  currentMaxDischarge?: number;  // nullable
  sohWarningThreshold?: number;  // nullable — không monitor SOH
  sohCriticalThreshold?: number; // nullable
  effectiveFromUtc: string;
  isActive: boolean;
}
export interface ThresholdListParams {
  pageNumber?: number; pageSize?: number; batteryTypeId?: string; isActive?: boolean;
}
export interface ThresholdByTypeParams {
  includeInactive?: boolean;     // default false
}
export interface UpsertThresholdPayload {
  voltageMin: number; voltageMax: number;
  temperatureMax: number; temperatureMin: number;
  socWarningThreshold: number; socCriticalThreshold: number;
  currentMaxCharge?: number; currentMaxDischarge?: number;
  sohWarningThreshold?: number; sohCriticalThreshold?: number;
  effectiveFromUtc?: string;     // default UtcNow ở BE
  // ⚠️ KHÔNG có batteryTypeId trong body — BE gán từ path param
}
```

## Schema (Zod)
```ts
// battery-type.schema.ts
createBatteryTypeSchema = z.object({
  name: z.string().min(1).max(100),
  manufacturer: z.string().max(100).optional(),
  nominalCapacityAh: z.number().positive(),
  nominalVoltage: z.number().positive(),
  chemistry: z.nativeEnum(BatteryChemistryEnum).optional(),
  maxCycleCount: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});
updateBatteryTypeSchema = createBatteryTypeSchema;  // PUT full update

// threshold.schema.ts
upsertThresholdSchema = z.object({
  voltageMin: z.number().positive(),
  voltageMax: z.number().positive(),
  temperatureMin: z.number(),
  temperatureMax: z.number(),
  socWarningThreshold: z.number().min(0).max(100),
  socCriticalThreshold: z.number().min(0).max(100),
  currentMaxCharge: z.number().positive().optional(),
  currentMaxDischarge: z.number().positive().optional(),
  sohWarningThreshold: z.number().min(0).max(100).optional(),
  sohCriticalThreshold: z.number().min(0).max(100).optional(),
  effectiveFromUtc: z.string().optional(),
})
  .refine(d => d.voltageMax > d.voltageMin,
    { message: "voltageMax phải lớn hơn voltageMin", path: ["voltageMax"] })
  .refine(d => d.temperatureMax > d.temperatureMin,
    { message: "temperatureMax phải lớn hơn temperatureMin", path: ["temperatureMax"] })
  .refine(d => d.socCriticalThreshold < d.socWarningThreshold,
    { message: "socCritical phải nhỏ hơn socWarning", path: ["socCriticalThreshold"] })
  .refine(d => d.sohWarningThreshold == null || d.sohCriticalThreshold == null
            || d.sohCriticalThreshold < d.sohWarningThreshold,
    { message: "sohCritical phải nhỏ hơn sohWarning", path: ["sohCriticalThreshold"] });
```

## Endpoints
| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/battery-types` | Admin/Manager/Staff | query: `pageNumber, pageSize, keyword?, includeDeleted?` | `PaginationResponse<BatteryTypeDto>` |
| GET | `/api/battery-types/{id}` | Admin/Manager/Staff | — | `CommonResponse<BatteryTypeDto>` |
| POST | `/api/admin/battery-types` | Admin | `CreateBatteryTypePayload` | `CommonResponse<BatteryTypeDto>` (201) |
| PUT | `/api/admin/battery-types/{id}` | Admin | `UpdateBatteryTypePayload` | `CommonResponse<BatteryTypeDto>` |
| DELETE | `/api/admin/battery-types/{id}` | Admin | — | `CommonResponse<null>` |
| PATCH | `/api/admin/battery-types/{id}/restore` | Admin | — | `CommonResponse<null>` |
| GET | `/api/thresholds` | Admin/Manager | query: `pageNumber, pageSize, batteryTypeId?, isActive?` | `PaginationResponse<ThresholdConfigDto>` |
| GET | `/api/thresholds/by-type/{batteryTypeId}` | Admin/Manager | query: `includeInactive?` | `CommonResponse<ThresholdConfigDto>` |
| PUT | `/api/admin/thresholds/by-type/{batteryTypeId}` | Admin | `UpsertThresholdPayload` (KHÔNG cần `batteryTypeId`) | `CommonResponse<ThresholdConfigDto>` |

```ts
// endpoints.ts shape
BATTERY_TYPES: {
  LIST: '/api/battery-types',
  DETAIL: (id) => `/api/battery-types/${id}`,
  CREATE: '/api/admin/battery-types',
  UPDATE: (id) => `/api/admin/battery-types/${id}`,
  DELETE: (id) => `/api/admin/battery-types/${id}`,
  RESTORE: (id) => `/api/admin/battery-types/${id}/restore`,
},
THRESHOLDS: {
  LIST: '/api/thresholds',
  BY_TYPE: (batteryTypeId) => `/api/thresholds/by-type/${batteryTypeId}`,
  UPSERT: (batteryTypeId) => `/api/admin/thresholds/by-type/${batteryTypeId}`,
},
```

```ts
// queryKeys.ts
KEY.batteryTypes = 'batteryTypes';
KEY.thresholds   = 'thresholds';
QUERY_KEY.batteryTypes = {
  list: (params?) => [KEY.batteryTypes, 'list', params],
  detail: (id) => [KEY.batteryTypes, 'detail', id],
};
QUERY_KEY.thresholds = {
  list: (params?) => [KEY.thresholds, 'list', params],
  byType: (batteryTypeId, params?) => [KEY.thresholds, 'by-type', batteryTypeId, params],
};
```

## Workflow
Task chỉ setup data layer — không có user flow/UI. Quy ước dùng cho issue UI sau:

**Invalidation:**
| Mutation | invalidateQueries | removeQueries |
|----------|-------------------|---------------|
| create/update/restore BatteryType | `KEY.batteryTypes` | — |
| delete BatteryType | `KEY.batteryTypes` | `QUERY_KEY.batteryTypes.detail(id)` |
| upsert Threshold | `KEY.thresholds` | — |

**Edge cases:**
- POST create trả `201` — Axios xử lý bình thường, vẫn check `isSuccess`.
- DELETE BatteryType: BE trả `409` nếu loại pin đang gán cho asset.
- GET threshold by-type: có thể `404` nếu loại pin chưa cấu hình ngưỡng và `includeInactive=false`.
- PUT upsert threshold idempotent: chưa có → tạo (`isActive=true`); có active → ghi đè.
- Field nullable (`currentMax*`, `soh*`) → không gửi nếu trống (không gửi `0`).
- Mutation không có form → `onError: handleErrorApi({ error })` → toast.

## Steps
- [x] Battery Types — types/schema/service/hooks + write-op prefix `/api/admin/...`
- [x] Thresholds — `endpoints.ts` thêm `THRESHOLDS` (3)
- [x] Thresholds — `queryKeys.ts` thêm `thresholds` root + factories
- [x] Thresholds — `threshold.types.ts`
- [x] Thresholds — `threshold.schema.ts` (upsert + 4 refine)
- [x] Thresholds — `threshold.service.ts` (3 functions)
- [x] Thresholds — `useThresholds.ts` (list + byType)
- [x] Thresholds — `useThresholdsMutation.ts` (upsert)
- [x] UI — `BatteryTypesPage` + `BatteryTypeTable` + `BatteryTypeFormDialog` + `ThresholdConfigDialog`
- [x] UI — route `/admin/battery-types` + nav "Loại pin & Ngưỡng"
- [x] `tsc --noEmit` + `eslint src/features/admin --max-warnings=0` + `npm run build` → PASS

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| `tsc --noEmit` không lỗi | `npx tsc --noEmit` |
| ESLint 0 warning | `npx eslint src/features/admin --max-warnings=0` |
| Build thành công | `npm run build` |

---

## Đối chiếu code thực tế (2026-06-14)

> Đối chiếu `plan.md` ⇄ `src/` (build PASS) ⇄ `docs/api-battery.md`. **Khớp ~99%** — không lệch contract.

| # | Mục | Plan gốc nói | Code thực tế | Ghi chú |
|---|-----|--------------|--------------|---------|
| 1 | `chemistry` (Zod) | `z.nativeEnum(BatteryChemistryEnum)` | `z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(99)])` | Tương đương chức năng. Code chọn union literal để khớp giá trị int của spec (1,2,3,4,99). Không lệch contract. |
| 2 | `BatteryChemistryEnum` key | LiFePO4/Nmc/Nca/Lco/Other | `LI_FE_PO4`/`NMC`/`NCA`/`LCO`/`OTHER` (CONSTANT_CASE) trong `enums/battery-asset.enum.ts` | Giá trị int đúng spec. Khác naming key (convention dự án). |
| 3 | File legacy `battery-type.enums.ts` | không nhắc | tồn tại (`features/admin/types/battery-type.enums.ts`, PascalCase, KHÔNG import) | Dead-code — dùng enum từ `enums/battery-asset.enum.ts`. Cleanup ở chore issue riêng. |

**Khớp đúng (kiểm chứng từ code):**
- 18/18 file plan đều tồn tại & implement đúng.
- `ThresholdConfigDto`, `UpsertThresholdPayload` (KHÔNG có `batteryTypeId` trong body — đúng spec dòng 1197), `BatteryTypeDto` — fields khớp 100%.
- 4 Zod `.refine()` threshold (voltageMax>voltageMin, temperatureMax>temperatureMin, socCritical<socWarning, sohCritical<sohWarning null-safe) — đúng spec.
- 9 endpoint, write-op `/api/admin/` prefix, query keys, invalidation/removeQueries — khớp.
