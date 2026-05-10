# Plan — KAN-418: [FE] test workflow-ai -- CRUD static data (mock)

## Mục tiêu
Xây dựng trang CRUD đơn giản với dữ liệu tĩnh (mock), không gọi BE API thực.
Mục đích: kiểm tra toàn bộ luồng FE (types → service → hook → component → page → router) hoạt động đúng trước khi tích hợp AI module thực.

Dữ liệu mock đại diện cho **BatteryReading** — input/output của AI module (voltage, current, temperature, SOH%, classification status).

## Các file sẽ tạo/sửa

| File | Hành động | Mô tả |
|------|-----------|-------|
| `src/features/ai-workflow/types/battery-reading.types.ts` | create | TypeScript interfaces |
| `src/features/ai-workflow/data/mock-data.ts` | create | 10 bản ghi mẫu |
| `src/features/ai-workflow/services/battery-reading.service.ts` | create | Mock service: GET/POST/PUT/DELETE (simulate async) |
| `src/features/ai-workflow/hooks/useBatteryReadings.ts` | create | TanStack Query hooks: useQuery + 3 useMutation |
| `src/features/ai-workflow/components/BatteryReadingTable.tsx` | create | shadcn Table với actions (edit/delete) |
| `src/features/ai-workflow/components/BatteryReadingFormDialog.tsx` | create | shadcn Dialog + React Hook Form + Zod |
| `src/features/ai-workflow/pages/AIWorkflowPage.tsx` | create | Page tổng hợp (table + form dialog) |
| `src/router/index.tsx` | modify | Thêm route public `/ai-workflow` |

## Approach

**Data model — BatteryReading:**
```ts
{
  id: string           // UUID
  batteryId: string    // e.g. "B0005"
  voltage: number      // Volt
  current: number      // Ampere
  temperature: number  // Celsius
  soh: number          // State of Health 0–100%
  status: 'Normal' | 'Degrading' | 'Failed'
  timestamp: string    // ISO string
}
```

**Mock service pattern:**
- Dữ liệu lưu trong mutable array trong module (`let items = [...]`)
- Mỗi function return `Promise` với `setTimeout(100ms)` để simulate network latency
- GET: trả toàn bộ list
- POST: `crypto.randomUUID()` làm id, push vào array
- PUT: tìm theo id, merge fields
- DELETE: filter out theo id

**TanStack Query hooks:**
- `useGetBatteryReadings()` → `useQuery(['battery-readings'])`
- `useCreateBatteryReading()` → `useMutation` + `invalidateQueries`
- `useUpdateBatteryReading()` → `useMutation` + `invalidateQueries`
- `useDeleteBatteryReading()` → `useMutation` + `invalidateQueries`

**UI Flow:**
1. Page load → table hiển thị 10 bản ghi mock + skeleton khi loading
2. "Add New" button → dialog với form trống
3. "Edit" icon per row → dialog với form prefilled
4. "Delete" icon per row → `toast.warning` confirm → call delete mutation
5. Mọi mutation thành công → `toast.success`, thất bại → `toast.error`

**Route:** `/ai-workflow` (public — không qua ProtectedRoute, phù hợp mục đích testing)

## Dependencies & Edge Cases

- **Không cần auth** — route public để test dễ dàng
- **Validation:** voltage > 0, current ∈ [-10, 10], temperature ∈ [0, 80], soh ∈ [0, 100]
- **Optimistic UI không cần** — mock service đủ nhanh (100ms delay)
- **Pagination:** không cần cho mock 10 bản ghi

## Ước tính
- **Size:** Medium
- **Thời gian:** ~2–3 giờ
