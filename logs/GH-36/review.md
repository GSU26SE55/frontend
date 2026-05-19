# BÁO CÁO CODE REVIEW — feature/GH-36-filestorage-api — 2026-05-20

## TÓM TẮT
Branch bao gồm 4 tickets: GH-36 (FileStorage API), GH-38 (Site Management + Dashboard + Sidebar), GH-39 (Battery Asset Management), GH-40 (Battery Catalog — Types & Groups). Tất cả quality gates PASS: `tsc --noEmit`, `eslint --max-warnings=0`, `npm run build`. Không tìm thấy vi phạm về console.log, localStorage, hay cross-feature import.

---

## PHÂN TÍCH

### ✅ Pass — Toàn bộ quality gates

| Kiểm tra | Kết quả |
|----------|---------|
| `npx tsc --noEmit` | ✅ 0 lỗi |
| `npx eslint src --max-warnings=0` | ✅ 0 warning |
| `npm run build` | ✅ build thành công (chunk size warning là thông báo, không phải lỗi) |

### ✅ Pass — Checklist FE rules

- **No API call trong component**: tất cả API calls đi qua `services/` → hooks ✅
- **No console.log**: không tìm thấy ✅
- **No localStorage**: không tìm thấy ✅
- **Cross-feature isolation**: không có `admin ↔ manager ↔ staff` import ✅
- **Axios instance**: tất cả services dùng `shared/lib/axios` ✅
- **Token cookie only**: không dùng localStorage cho token ✅
- **ENDPOINTS object**: tất cả API path qua `endpoints.ts` ✅
- **QueryKey factories**: `invalidateQueries` dùng array-wrapped `[KEY.xxx]`, detail dùng factory ✅

### ✅ Pass — GH-36: FileStorage API layer

- `FilePurposeEnum`, `FileStatusEnum` dùng `const object + type alias` đúng pattern ✅
- `uploadFile` dùng FormData, không set `Content-Type` thủ công (Axios tự handle boundary) ✅
- `usePresignedUrl` có `enabled: !!fileId` ✅
- `useDeleteFile` invalidate broad `[KEY.files]` ✅

### ✅ Pass — GH-40: Battery Catalog data layer

- `BatteryChemistryEnum` được định nghĩa canonical tại `battery-type.types.ts`, re-export từ `battery-asset.types.ts` ✅
- Endpoints RESTORE đúng path `/api/battery-types/{id}/restore` theo docs ✅
- `useDeleteBatteryType` / `useDeleteBatteryGroup`: vừa `invalidateQueries` list vừa `removeQueries` detail ✅
- Schema dùng `z.union([z.literal(...)])` thay vì `z.nativeEnum` (Zod v4) ✅

### ✅ Pass — GH-39: Battery Asset Management

- `BatteryAssetForm` convert numeric form fields via `toNumOrNull` helper trong `onSubmit` ✅
- `useBatteryAssetRealtime` có `staleTime: 0, refetchInterval: 30_000` ✅
- `BatteryAssetTable` dùng `onClick={(e) => e.stopPropagation()}` trên action cell ✅
- `TransferOwnerDialog` có client-side guard kiểm tra `newCustomerId === currentCustomerId` ✅

### ✅ Pass — Style fixes

- `--radius: 0.3125rem` (5px max) trong `index.css` — đúng yêu cầu ✅
- Sidebar collapsed/expanded dùng 2 header riêng biệt — toggle hoạt động đúng cả 2 chiều ✅

---

## RỦI RO & LƯU Ý

- Bundle size lớn (961KB JS unminified) — là warning từ Vite, không phải lỗi. Cần code-splitting sau khi hoàn thiện các feature chính.
- GH-38 và GH-39, GH-40 được implement trên cùng branch GH-36 — khi ship cần tạo PR references đủ 4 issues.

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao**

Tất cả 4 tickets (GH-36, GH-38, GH-39, GH-40) implement đúng FE rules, types đúng, service layer đúng, không có vi phạm. Sẵn sàng chạy `/kltn-test 36`.
