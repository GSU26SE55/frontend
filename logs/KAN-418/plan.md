# Plan — KAN-418: [FE] CRUD static data (mock) để test workflow AI

## Metadata
- **Status:** IN_PROGRESS
- **Ngày tạo:** 2026-05-10
- **Cập nhật lần cuối:** 2026-05-10

## Mục tiêu
Xây dựng màn hình `/admin/battery-readings` cho phép thực hiện đủ 4 thao tác CRUD trên `BatteryReading` (voltage, current, temperature, timestamp) bằng dữ liệu in-memory — không gọi BE API. Mục đích kiểm thử toàn bộ luồng: tạo data mẫu → AI đọc → hiển thị kết quả trong Sprint 1.

---

## Các file sẽ tạo/sửa

| File | Hành động | Mô tả |
|------|-----------|-------|
| `src/features/admin/types/battery-reading.types.ts` | create | Type `BatteryReading` + `BatteryReadingFormValues` |
| `src/features/admin/services/battery-reading.mock.ts` | create | In-memory array + 4 hàm async: `getList`, `createReading`, `updateReading`, `deleteReading` |
| `src/features/admin/hooks/useBatteryReadings.ts` | create | `useQuery` (list) + 3 `useMutation` (create/update/delete) |
| `src/features/admin/components/battery-readings/BatteryReadingForm.tsx` | create | RHF + Zod form, nhận `defaultValues?` để phân biệt Create vs Edit |
| `src/features/admin/components/battery-readings/BatteryReadingTable.tsx` | create | shadcn Table hiển thị list, mỗi row có nút Edit + Delete |
| `src/features/admin/pages/BatteryReadingsPage.tsx` | create | Page: nút "Thêm mới" + Dialog create/edit + BatteryReadingTable |
| `src/router/index.tsx` | modify | Thêm 1 route `{ path: 'battery-readings', element: <BatteryReadingsPage /> }` vào block `/admin` |
| `src/shared/components/layout/Sidebar.tsx` | modify | Push `{ to: '/admin/battery-readings', label: 'Battery Readings', icon: Activity }` vào `adminNav` |

---

## Chi tiết từng file

### 1. `battery-reading.types.ts`
```ts
export interface BatteryReading {
  id: string            // uuid tạo bằng crypto.randomUUID()
  batteryId: string     // mock: 'BAT-001' | 'BAT-002' | 'BAT-003'
  voltage: number       // V, range 0–5
  current: number       // A, range -10–10 (âm = đang xả)
  temperature: number   // °C, range -20–80
  timestamp: string     // ISO string, ví dụ: new Date().toISOString()
}

export type BatteryReadingFormValues = Omit<BatteryReading, 'id' | 'timestamp'>
// → { batteryId, voltage, current, temperature }
// timestamp tự sinh khi create, giữ nguyên khi update
```

### 2. `battery-reading.mock.ts`
```ts
// Module-level array — tồn tại suốt vòng đời app, reset khi reload
let store: BatteryReading[] = [/* 5 bản ghi seed cứng */]

// Seed data gồm 5 bản ghi với batteryId: BAT-001/002/003, timestamp trải đều
// voltage: 3.7–4.2, current: 0.5–2.0, temperature: 25–45

export async function getList(): Promise<BatteryReading[]> {
  return [...store] // trả copy để tránh mutation ngoài ý muốn
}

export async function createReading(values: BatteryReadingFormValues): Promise<BatteryReading> {
  const record = { ...values, id: crypto.randomUUID(), timestamp: new Date().toISOString() }
  store = [record, ...store]
  return record
}

export async function updateReading(id: string, values: BatteryReadingFormValues): Promise<BatteryReading> {
  const idx = store.findIndex(r => r.id === id)
  if (idx === -1) throw new Error('Reading not found')
  store[idx] = { ...store[idx], ...values }
  return store[idx]
}

export async function deleteReading(id: string): Promise<void> {
  store = store.filter(r => r.id !== id)
}
```

### 3. `useBatteryReadings.ts`
```ts
const QUERY_KEY = ['battery-readings'] as const

export function useBatteryReadingList() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getList, staleTime: 0 })
  // staleTime: 0 vì mock không có network, luôn lấy mới nhất
}

export function useCreateReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: BatteryReadingFormValues) => createReading(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); toast.success('Thêm thành công') },
    onError: () => toast.error('Thêm thất bại'),
  })
}

export function useUpdateReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BatteryReadingFormValues }) => updateReading(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); toast.success('Cập nhật thành công') },
    onError: () => toast.error('Cập nhật thất bại'),
  })
}

export function useDeleteReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReading(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); toast.success('Đã xóa') },
    onError: () => toast.error('Xóa thất bại'),
  })
}
```

### 4. `BatteryReadingForm.tsx`
```ts
// Zod schema:
const schema = z.object({
  batteryId: z.string().min(1, 'Bắt buộc'),
  voltage:     z.coerce.number().min(0).max(5),
  current:     z.coerce.number().min(-10).max(10),
  temperature: z.coerce.number().min(-20).max(80),
})

// Props:
interface Props {
  defaultValues?: BatteryReadingFormValues  // undefined = Create, có giá trị = Edit
  onSubmit: (values: BatteryReadingFormValues) => void
  isPending: boolean
}
```

UI layout:
- 1 `<Select>` cho `batteryId` (options: BAT-001, BAT-002, BAT-003) — dùng shadcn `select` (cần `npx shadcn@latest add select`)
- 3 `<Input type="number">` cho voltage, current, temperature, mỗi cái có label + error message
- 1 `<Button type="submit" disabled={isPending}>` — text "Thêm" hoặc "Cập nhật" tùy `defaultValues`

### 5. `BatteryReadingTable.tsx`
```ts
// Props:
interface Props {
  data: BatteryReading[]
  onEdit: (reading: BatteryReading) => void   // mở Dialog Edit với reading đó
  onDelete: (id: string) => void              // gọi deleteReading mutation trực tiếp
  isDeleting: boolean                         // disable nút Delete khi đang xóa
}
```

Columns: `#` (index) | `Battery ID` | `Voltage (V)` | `Current (A)` | `Temperature (°C)` | `Timestamp` | `Actions`

- `Timestamp`: format bằng `date-fns/format(new Date(timestamp), 'dd/MM/yyyy HH:mm')`
- `Actions`: 2 nút — `<Button variant="outline" size="sm">Edit</Button>` + `<Button variant="destructive" size="sm">Xóa</Button>`
- Xóa: không dùng `window.confirm`, dùng shadcn `AlertDialog` inline trong TableRow để xác nhận trước khi gọi `onDelete`

### 6. `BatteryReadingsPage.tsx`

State:
```ts
const [dialogOpen, setDialogOpen] = useState(false)
const [editTarget, setEditTarget] = useState<BatteryReading | null>(null)
// editTarget === null → Dialog đang ở chế độ Create
// editTarget !== null → Dialog đang ở chế độ Edit với reading đó
```

Luồng xử lý:
- Nút "Thêm mới" → `setEditTarget(null)` → `setDialogOpen(true)`
- `onEdit(reading)` từ Table → `setEditTarget(reading)` → `setDialogOpen(true)`
- `onSubmit` trong Form:
  - `editTarget === null` → gọi `createMutation.mutate(values)`
  - `editTarget !== null` → gọi `updateMutation.mutate({ id: editTarget.id, values })`
  - Sau `onSuccess` (từ toast trong hook) → `setDialogOpen(false)` + `setEditTarget(null)` bằng cách truyền `onSuccess` callback xuống page

Layout:
```
<div class="p-6 space-y-4">
  <div class="flex items-center justify-between">
    <h1>Battery Readings</h1>
    <Button onClick={() => { setEditTarget(null); setDialogOpen(true) }}>+ Thêm mới</Button>
  </div>

  {isLoading → <LoadingSpinner />}
  {!isLoading && data.length === 0 → <EmptyState title="Chưa có dữ liệu đo" />}
  {!isLoading && data.length > 0 → <BatteryReadingTable ... />}

  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editTarget ? 'Chỉnh sửa' : 'Thêm mới'} Battery Reading</DialogTitle>
      </DialogHeader>
      <BatteryReadingForm
        defaultValues={editTarget ?? undefined}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </DialogContent>
  </Dialog>
</div>
```

### 7. Router — thêm 1 dòng trong block `/admin`
```ts
{ path: 'battery-readings', element: <BatteryReadingsPage /> }
```

### 8. Sidebar — thêm 1 entry vào `adminNav`
```ts
import { Activity } from 'lucide-react'
{ to: '/admin/battery-readings', label: 'Battery Readings', icon: Activity }
```

---

## Dependencies & Edge Cases

| Tình huống | Xử lý |
|------------|-------|
| List rỗng (xóa hết) | `EmptyState` hiển thị |
| Edit rồi đóng dialog không submit | `setEditTarget(null)` trong `onOpenChange` của Dialog |
| Xóa trong khi đang pending | `isDeleting` prop disable nút Xóa toàn bảng |
| Nhập voltage sai range | Zod validate hiển thị lỗi inline ngay dưới input |
| shadcn `select` chưa có | Chạy `npx shadcn@latest add select` trước khi implement Form |
| shadcn `alert-dialog` chưa có | Chạy `npx shadcn@latest add alert-dialog` trước khi implement Table |

---

## Ước tính
- Size: Small
- Thời gian: 2 giờ

---

## Steps
- [x] Bước 1: Tạo branch `feature/KAN-418-fe-mock-crud-ai-workflow` từ `main` — 2026-05-10
- [x] Bước 2: Add shadcn `select` + `alert-dialog` (`npx shadcn@latest add select alert-dialog`) — 2026-05-10
- [x] Bước 3: Tạo `battery-reading.types.ts` — 2 type `BatteryReading` + `BatteryReadingFormValues` — 2026-05-10
- [x] Bước 4: Tạo `battery-reading.mock.ts` — seed 5 bản ghi + 4 hàm async CRUD — 2026-05-10
- [x] Bước 5: Tạo `useBatteryReadings.ts` — 4 hooks (list + create + update + delete) — 2026-05-10
- [x] Bước 6: Tạo `BatteryReadingForm.tsx` — Zod schema + RHF form (Select + 3 Input) — 2026-05-10
- [x] Bước 7: Tạo `BatteryReadingTable.tsx` — shadcn Table + AlertDialog xác nhận xóa — 2026-05-10
- [x] Bước 8: Tạo `BatteryReadingsPage.tsx` — page tổng hợp với Dialog + state quản lý Create/Edit — 2026-05-10
- [x] Bước 9: Update `router/index.tsx` + `Sidebar.tsx` — 2026-05-10
- [x] Bước 10: `npm run lint && npm run build` — pass clean — 2026-05-10
- [ ] Bước 11: Commit `feat(KAN-418): CRUD mock BatteryReading để test workflow AI`
