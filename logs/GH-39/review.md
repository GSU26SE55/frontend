# BÁO CÁO CODE REVIEW — GH-39: Battery Asset Management — 2026-05-20

## TÓM TẮT
Implement đầy đủ Battery Asset Management cho Admin: types, schemas, service (8 endpoints), hooks (CRUD + realtime), components (table, form, dialog), pages (list + detail), routing. `tsc --noEmit`, `eslint --max-warnings=0`, `npm run build` PASS.

---

## PHÂN TÍCH

### ✅ Pass — Quality gates

| Kiểm tra | Kết quả |
|----------|---------|
| `npx tsc --noEmit` | ✅ 0 lỗi |
| `npx eslint src --max-warnings=0` | ✅ 0 warning |
| `npm run build` | ✅ thành công |

### ✅ Pass — GH-39 scope

- `battery-asset.types.ts`: BatteryStatusEnum, WarrantyStatusEnum, ChargingStateEnum, BatteryAssetDto, BatteryAssetRealtimeDto, payloads, CustomerDropdownItem ✅
- `battery-asset.schema.ts`: Zod schema dùng `z.string()` cho numeric fields (Zod v4) ✅
- `battery-asset.service.ts`: 8 endpoints (list, detail, realtime, create, update, delete, restore, transfer) ✅
- `useBatteryAssetRealtime`: `staleTime: 0, refetchInterval: 30_000` ✅
- `BatteryAssetForm`: `toNumOrNull` helper convert string → number trong `onSubmit` ✅
- `BatteryAssetTable`: `onClick={(e) => e.stopPropagation()}` trên action cell ✅
- `TransferOwnerDialog`: client-side guard `newCustomerId === currentCustomerId` ✅
- `BatteryAssetDetailPage`: parallel data fetch (asset detail + realtime card) ✅
- `BatteryAssetsPage`: `data?.totalItems ?? 0` và `data?.totalPages ?? 1` đúng ✅
- Routes `/admin/battery-assets` và `/admin/battery-assets/:id` wired đúng ✅
- `BatteryChemistryEnum` re-export từ `battery-type.types.ts` (không duplicate) ✅

---

## RỦI RO & LƯU Ý

- `account.service.ts` (admin) có `CUSTOMER_ROLE_ID` hardcoded từ `shared/constants/roleIds.ts` — acceptable nếu đây là constant cố định từ BE
- Native `<select>` thay shadcn Select — do chưa có component, acceptable

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Tất cả files đúng plan, patterns đúng FE rules. Sẵn sàng chạy `/kltn-test 39`.
