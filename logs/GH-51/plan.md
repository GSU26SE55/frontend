# Plan — GH-51: [FE] Demo normal battery flow với mock data

## Metadata
- **Status:** SHIPPED | **Role:** FE | **Ngày:** 2026-05-24
- **Issue:** #51 — https://github.com/GSU26SE55/frontend/issues/51
- **Sprint:** Sprint 1 (due: 2026-05-30)

## Mục tiêu
Tạo 1 màn hình demo độc lập hiển thị danh sách pin trạng thái Normal với mock data tĩnh.
Không cần auth, không cần BE — page truy cập thẳng qua `/demo/battery`.

## Scope
**Trong scope:**
- Feature mới `features/battery-demo/` tách biệt hoàn toàn
- 1 page duy nhất: grid battery cards + detail panel inline khi click
- Mock data tĩnh: 4 pin, trạng thái Normal, SOH %, voltage/current/temperature
- Route public `/demo/battery` (không cần ProtectedRoute)

**Ngoài scope:**
- Không kết nối BE/API thật
- Không có form tạo/sửa/xóa pin
- Không có chart phức tạp (chỉ hiển thị số)
- Không routing nội bộ trong feature

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/battery-demo/types/battery-demo.types.ts` | create | BatteryDemo, SensorReading types |
| `src/features/battery-demo/data/mockBatteries.ts` | create | 4 mock batteries, trạng thái Normal |
| `src/features/battery-demo/components/BatteryDemoCard.tsx` | create | Card pin — tên, SOH%, status badge |
| `src/features/battery-demo/components/BatteryDemoDetail.tsx` | create | Panel chi tiết — SOH, voltage, current, temp |
| `src/features/battery-demo/pages/BatteryDemoPage.tsx` | create | Page chính: grid cards + detail panel |
| `src/router/index.tsx` | modify | Thêm route `/demo/battery` public (không wrap ProtectedRoute) |

## Types
```ts
// battery-demo.types.ts
interface SensorReading {
  voltage: number;   // V
  current: number;   // A
  temperature: number; // °C
  recordedAt: string;  // ISO datetime
}

type BatteryStatus = 'Normal' | 'Degrading' | 'Failed';

interface BatteryDemo {
  id: string;
  name: string;
  serialNumber: string;
  location: string;
  status: BatteryStatus;
  soh: number;        // 0–100 %
  lastReading: SensorReading;
}
```

## Mock Data Shape
```ts
// mockBatteries.ts — 4 entries, tất cả Normal, SOH 85–98%
[
  { id: '1', name: 'Battery A1', serialNumber: 'SN-001', location: 'Site Hà Nội', status: 'Normal', soh: 95, lastReading: { voltage: 3.72, current: 1.50, temperature: 25.3, recordedAt: '2026-05-24T08:00:00Z' } },
  ...
]
```

## Approach
- `BatteryDemoPage` giữ `selectedId` state (useState) — click card → update selectedId
- Grid 2 cột (md:grid-cols-2): bên trái list cards, bên phải detail panel
- `BatteryDemoCard`: hiển thị tên, badge Normal (xanh), SOH % progress indicator
- `BatteryDemoDetail`: hiển thị full thông tin pin được chọn — SOH bar, bảng sensor readings
- Route `/demo/battery` đặt ngoài `ProtectedRoute`, truy cập trực tiếp không cần login

## Edge Cases
- Không có pin nào được chọn: detail panel hiển thị placeholder "Chọn một pin để xem chi tiết"
- Mock data không thay đổi — không cần loading/error state

## Success Criteria
| Tiêu chí | Cách verify |
|----------|------------|
| `/demo/battery` load được không cần đăng nhập | Mở trình duyệt truy cập thẳng URL |
| Hiển thị 4 battery cards với status Normal | Visual check trên trang |
| Click card → detail panel cập nhật đúng pin | Click từng card, kiểm tra data đúng |
| `tsc --noEmit` không lỗi | `npx tsc --noEmit` |
| `eslint --max-warnings=0` pass | `npx eslint src/features/battery-demo --max-warnings=0` |

## Steps
- [x] Bước 1: Tạo types — `battery-demo.types.ts` — 2026-05-24
- [x] Bước 2: Tạo mock data — `mockBatteries.ts` — 2026-05-24
- [x] Bước 3: Tạo `BatteryDemoCard.tsx` — 2026-05-24
- [x] Bước 4: Tạo `BatteryDemoDetail.tsx` — 2026-05-24
- [x] Bước 5: Tạo `BatteryDemoPage.tsx` (wire card + detail + useState) — 2026-05-24
- [x] Bước 6: Thêm route `/demo/battery` vào `router/index.tsx` — 2026-05-24
- [x] Bước 7: `tsc --noEmit` + `eslint --max-warnings=0` → PASS — 2026-05-24

## Câu hỏi đã giải đáp
- **Flow gồm mấy màn hình?** → 1 màn hình duy nhất (user confirm)
- **Feature riêng hay chung?** → Tách riêng thành `features/battery-demo/` (user confirm)
- **Mock data phức tạp không?** → Đơn giản, static file trong feature (tự quyết định)
- **Cần auth không?** → Không, route public để demo dễ (tự quyết định)
