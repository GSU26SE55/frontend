# BÁO CÁO CODE REVIEW — GH-40: Battery Catalog (Types & Groups) — 2026-05-20

## TÓM TẮT
Data layer cho Battery Catalog: BatteryType + BatteryGroup — types, Zod schemas, services (12 endpoints), TanStack Query hooks (list, detail, mutations). Không có UI. `tsc --noEmit`, `eslint --max-warnings=0`, `npm run build` PASS.

---

## PHÂN TÍCH

### ✅ Pass — Quality gates

| Kiểm tra | Kết quả |
|----------|---------|
| `npx tsc --noEmit` | ✅ 0 lỗi |
| `npx eslint src --max-warnings=0` | ✅ 0 warning |
| `npm run build` | ✅ thành công |

### ✅ Pass — GH-40 scope

- `BatteryChemistryEnum`: `const object + type alias` pattern, 5 values (LiFePO4=1, Nmc=2, Nca=3, Lco=4, Other=99) ✅
- `UpdateBatteryTypePayload`: `Required<Pick<...>> & Omit<...>` pattern — name/nominalCapacityAh/nominalVoltage bắt buộc ✅
- `UpdateBatteryGroupPayload = CreateBatteryGroupPayload` (PUT full update, 3 fields bắt buộc) ✅
- `battery-type.schema.ts`: `z.union([z.literal(1), ..., z.literal(99)])` thay `z.nativeEnum` (Zod v4) ✅
- Endpoints RESTORE: `/api/battery-types/{id}/restore` và `/api/battery-groups/{id}/restore` ✅
- `useDeleteBatteryType` / `useDeleteBatteryGroup`: `invalidateQueries([KEY.xxx])` + `removeQueries(QUERY_KEY.xxx.detail(id))` ✅
- `KEY.batteryTypes`, `KEY.batteryGroups` thêm vào KEY object ✅
- Query key factories: `list(params?)` và `detail(id)` ✅
- `totalCount → totalItems` đã confirmed OK (không cần fix) ✅

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Data layer đúng hoàn toàn theo plan và api-battery.md. Sẵn sàng chạy `/kltn-test 40`.
