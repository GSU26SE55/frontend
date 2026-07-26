# Plan — Trang so sánh ticket trước khi gộp (Merge Compare Page)

## Metadata
- **Status:** PLANNING | **Role:** FE | **Ngày:** 2026-07-22
- **Issue:** _chưa tạo — cần `/kltn-task` để lấy số issue trước khi implement_
- **Sprint:** Sprint hiện tại

## Mục tiêu

Gộp ticket là thao tác **không hoàn tác được** (ticket nguồn bị đóng vĩnh viễn). Hiện tại Manager
chỉ thấy `code — title` của các ứng viên trong 1 dropdown, không đủ cơ sở để xác nhận
"2 ticket là cùng 1 sự cố trên cùng cục pin" như chính dialog yêu cầu.

Thay dialog bằng **trang so sánh side-by-side** để Manager đối chiếu đầy đủ 2 ticket
(trường cơ bản, mô tả, nhận định AI, bằng chứng sensor) rồi mới quyết định gộp ngay tại chỗ.

## Scope

**Trong scope:**
- Trang so sánh mới, đặt ở `shared/` để **cả manager và admin** dùng lại được
- Chọn ticket đích ngay trên trang (thay cho dialog)
- 4 khối nội dung: bảng đối chiếu trường cơ bản · nhận định AI · mô tả đầy đủ · bằng chứng sensor
- Cảnh báo (không chặn) khi khác pin / khác khách hàng
- Nút xác nhận gộp ngay trên trang
- Route cho manager; xoá đường dùng `MergeTicketDialog` của manager

**Ngoài scope:**
- Sửa `features/admin/components/ticket/MergeTicketDialog.tsx` (hiện nhập tay GUID) — làm ở issue riêng,
  nhưng component đặt ở `shared/` nên admin wire vào sau không tốn công
- Thêm API mới ở BE — toàn bộ dữ liệu đã có sẵn
- Undo merge / lịch sử merge

## Kiến trúc — vì sao đặt ở `shared/`

`features/admin` và `features/manager` bị ESLint `no-restricted-imports` chặn import chéo.
Admin cũng có nhu cầu gộp ticket (hiện đang nhập tay GUID — tệ hơn manager).
→ Component + hook đặt tại `shared/components/ticket/` và `shared/hooks/ticket/`,
mỗi feature chỉ giữ 1 file page mỏng khai báo route và truyền `basePath`.

## Files

| File | Action | Ghi chú |
|------|--------|---------|
| `src/shared/components/ticket/MergeCompareView.tsx` | create | Component chính — nhận `sourceTicketId`, `basePath`, `onMerged`; chứa toàn bộ UI so sánh |
| `src/shared/components/ticket/CompareFieldTable.tsx` | create | Bảng đối chiếu trường cơ bản, highlight dòng khác nhau |
| `src/shared/components/ticket/CompareEvidencePanel.tsx` | create | Bằng chứng sensor 2 cột, dùng lại `useReadingEvidence` |
| `src/shared/hooks/ticket/useMergeCandidates.ts` | create | Lọc + sắp xếp ứng viên (tách logic đang nằm trong dialog) |
| `src/features/manager/pages/MergeComparePage.tsx` | create | Page mỏng — lấy `:id` từ URL, render `MergeCompareView` |
| `src/router/index.tsx` | modify | Thêm route `manager/tickets/:id/merge` |
| `src/features/manager/pages/TicketDetailPage.tsx` | modify | 2 nút "Gộp ticket" → `navigate(...)` thay vì mở dialog; bỏ `dialog === "merge"` |
| `src/features/manager/components/ticket/MergeTicketDialog.tsx` | delete | Bị thay thế hoàn toàn |

## Enums

Không tạo enum mới. Dùng lại:

| Enum | File nguồn |
|------|-----------|
| TicketStatusEnum | `shared/enums/ticket/ticket.enum.ts` |
| TicketCategoryEnum | `shared/enums/ticket/ticket.enum.ts` |
| TicketPriorityEnum | `shared/enums/ticket/ticket.enum.ts` |
| TicketOriginEnum | `shared/enums/ticket/ticket.enum.ts` |

## Types

Không thêm type vào `shared/types/ticket/ticket.types.ts` — `TicketDTO` / `TicketDetailDTO` đã đủ.
Chỉ khai báo type nội bộ cho component:

```ts
// MergeCompareView.tsx — props
interface MergeCompareViewProps {
  sourceTicketId: string;   // ticket sẽ bị gộp (đóng lại)
  basePath: string;         // "/manager" | "/admin" — để navigate về sau khi gộp
}

// CompareFieldTable.tsx — 1 dòng đối chiếu
interface CompareRow {
  label: string;
  source: string;           // giá trị đã format của ticket nguồn
  target: string;           // giá trị đã format của ticket đích
  isDiff: boolean;          // true → highlight
  isCritical?: boolean;     // khác pin / khác khách hàng → cảnh báo đỏ
}
```

## Schema (Zod)

Không có form phức tạp → **không cần Zod schema mới**. Chỉ 1 `<Select>` chọn ticket đích,
state giữ bằng `useState` (UI state thuần, đúng rule).

## Endpoints

Không thêm endpoint mới. Dùng lại toàn bộ:

| Method | Path | Dùng cho | Hook sẵn có |
|--------|------|----------|-------------|
| GET | `/api/tickets/{id}` | Chi tiết 2 ticket (có `description`) | `useManagerTicketDetail` |
| GET | `/api/tickets` | Danh sách ứng viên đích | `useAdminTicketList` |
| GET | `/api/batteries/{id}/readings` | Bằng chứng sensor | `useReadingEvidence` |
| POST | `ENDPOINTS.ADMIN.TICKETS.MERGE(id)` | Thực hiện gộp | `useMergeTicket` |

## Workflow

**Vào trang:**
```
TicketDetailPage → bấm "Gộp ticket" (nút header HOẶC panel AI nghi trùng)
  → navigate(`${basePath}/tickets/${id}/merge`)
  → nếu có suspectedDuplicateOfTicketId → truyền qua router state để chọn sẵn
```

**Trên trang so sánh:**
```
Load song song:
  useManagerTicketDetail(sourceId)          → ticket nguồn (có description)
  useAdminTicketList({pageSize:100})        → ứng viên đích
  useManagerTicketDetail(targetId)          → ticket đích (enabled khi đã chọn)
  useReadingEvidence(sourceAssetId, sourceDetectedAt)
  useReadingEvidence(targetAssetId, targetDetectedAt)

Chưa chọn đích → chỉ hiện cột trái + Select + empty state cột phải
Đã chọn đích  → render đủ 4 khối, tính isDiff từng dòng
```

**Xác nhận gộp:**
```
Bấm "Gộp ticket" → AlertDialog xác nhận (nêu rõ ticket nào bị đóng)
  → merge.mutateAsync(targetId)
  → OK:   toast success → navigate(`${basePath}/tickets/${targetId}`)   ← về ticket ĐƯỢC GIỮ
  → FAIL: handleErrorApi({ error }) trong onError của hook (non-form → toast)
```

**Cảnh báo khác pin / khác khách hàng (chỉ cảnh báo, KHÔNG chặn — theo quyết định):**
```
sourceBatteryAssetId !== targetBatteryAssetId  → banner đỏ "Khác cục pin"
sourceCustomerId     !== targetCustomerId      → banner đỏ "Khác khách hàng"
→ nút Gộp vẫn bấm được, nhưng AlertDialog xác nhận nhắc lại cảnh báo
```

## Nội dung 4 khối

**1. Bảng đối chiếu trường cơ bản** — highlight dòng khác nhau:
Mã ticket · Pin / Serial · Category · Khách hàng · Trạng thái · Priority ·
Thời điểm phát hiện (`detectedAt`) · Ngày tạo · Nguồn tạo (`origin`)

**2. Nhận định AI** — `duplicateReason`, `aiVerifyStatus`, `aiVerifyScore`, `aiVerifyReason`

**3. Mô tả đầy đủ** — `description` 2 cột cạnh nhau (từ `TicketDetailDTO`)

**4. Bằng chứng sensor** — `useReadingEvidence` + `toWarningRows` cho từng ticket
> ⚠️ Hook có `enabled: !!assetId && !!detectedAt`. Ticket auto-gen (`[Auto] … SOH Degradation Alert`)
> **không có `detectedAt`** → phải render empty state "Ticket tự động — không có mốc phát hiện",
> KHÔNG để loading spinner treo vĩnh viễn.

## Steps

- [ ] Bước 1: `useMergeCandidates` — tách logic lọc/sắp xếp ứng viên khỏi dialog cũ
- [ ] Bước 2: `CompareFieldTable` + `CompareEvidencePanel`
- [ ] Bước 3: `MergeCompareView` — ghép 4 khối, Select đích, cảnh báo, AlertDialog xác nhận
- [ ] Bước 4: `MergeComparePage` (manager) + route `manager/tickets/:id/merge`
- [ ] Bước 5: Wire 2 nút ở `TicketDetailPage` → navigate; xoá `MergeTicketDialog` của manager
- [ ] Bước 6: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS

## Rủi ro

| Rủi ro | Xử lý |
|--------|-------|
| Ticket auto-gen không có `detectedAt` → không có bằng chứng sensor | Empty state rõ ràng, không treo loading |
| 4 query song song (2 detail + 2 evidence) làm chậm trang | Query đích + evidence `enabled` theo điều kiện; skeleton từng khối thay vì chặn cả trang |
| Ticket đích cũng có `batteryAssetIds` nhiều pin | So sánh theo `batteryAssetId` chính, ghi chú nếu mảng khác nhau |
| Sau khi gộp, điều hướng về ticket nguồn (đã đóng) gây khó hiểu | Điều hướng về **ticket đích** — ticket được giữ lại |
