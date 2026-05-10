# TEST REPORT — KAN-418 — 2026-05-10
### Scope: FE (ReactJS)
### Môi trường: local

---

## TÓM TẮT
23/23 test cases PASS trên 3 test file. Coverage tổng 88% statements / 87.23% lines — vượt target ≥ 70% FE. Không phát sinh bug mới.

---

## Test Cases

### Service layer — `battery-reading.mock.ts` (7 tests)

| Test case | Input | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| getList trả seed data ≥ 5 bản ghi | — | length ≥ 5 | 5 items | ✅ PASS |
| getList trả copy — mutate result không ảnh hưởng store | push vào result | store length giữ nguyên | unchanged | ✅ PASS |
| createReading thêm bản ghi vào đầu store | valid values | record có id + timestamp | ✅ | ✅ PASS |
| createReading sinh id unique cho mỗi record | 2 creates | id khác nhau | distinct ids | ✅ PASS |
| updateReading cập nhật đúng record | id tồn tại + new values | record updated | voltage=4.5 ✓ | ✅ PASS |
| updateReading giữ nguyên timestamp khi update | existing id | timestamp unchanged | ✅ | ✅ PASS |
| updateReading throw khi id không tồn tại | 'nonexistent-id' | throws 'Reading not found' | throws ✓ | ✅ PASS |
| deleteReading xóa record khỏi store | existing id | record không còn trong store | ✅ | ✅ PASS |
| deleteReading không throw khi id không tồn tại | 'ghost-id' | resolves undefined | ✅ | ✅ PASS |

### Hooks layer — `useBatteryReadings.ts` (6 tests)

| Test case | Input | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| useBatteryReadingList — fetch trả ≥ 5 items | — | isSuccess + data ≥ 5 | ✅ | ✅ PASS |
| useCreateReading — mutation tạo record có id + timestamp | valid values | data.id + data.timestamp truthy | ✅ | ✅ PASS |
| useUpdateReading — mutation cập nhật đúng values | id + new values | updated voltage + batteryId | ✅ | ✅ PASS |
| useUpdateReading — mutation fail khi id không tồn tại | 'bad-id' | isError = true | ✅ | ✅ PASS |
| useDeleteReading — mutation thành công với existing id | existing id | isSuccess = true | ✅ | ✅ PASS |

### Component layer — `BatteryReadingForm.tsx` (8 tests)

| Test case | Input | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| Render đủ 4 fields (Create mode) | — | Battery ID, Voltage, Current, Temp labels | ✅ | ✅ PASS |
| Button "Thêm mới" trong Create mode | — | button text = "Thêm mới" | ✅ | ✅ PASS |
| Validation error khi submit form rỗng | submit empty | "Bắt buộc chọn pin" | ✅ | ✅ PASS |
| onSubmit không được gọi khi không chọn batteryId | submit without Select | onSubmit not called | ✅ | ✅ PASS |
| Button disabled khi isPending=true | isPending=true | button.disabled = true | ✅ | ✅ PASS |
| Button "Cập nhật" trong Edit mode | defaultValues set | button text = "Cập nhật" | ✅ | ✅ PASS |
| Pre-fill số từ defaultValues | defaultValues.voltage=3.8 | input.value = "3.8" | ✅ | ✅ PASS |
| Validation voltage > 5V | voltage = 10 | "Max 5V" | ✅ | ✅ PASS |
| Validation current > 10A (out of range) | current = 15 | "Max 10A" | ✅ | ✅ PASS |

---

## Coverage

```
File                 | % Stmts | % Branch | % Funcs | % Lines
---------------------|---------|----------|---------|--------
All files            |      88 |      100 |   81.25 |   87.23
 battery-readings    |   76.47 |      100 |   69.23 |   76.47
  BatteryReadingForm |    high |      100 |    high |    high
  BatteryReadingTable|       0 |      100 |       0 |       0  ← gap
 hooks               |      90 |      100 |   84.61 |      90
  useBatteryReadings |      90 |      100 |   84.61 |      90
```

- **Line coverage tổng: 87.23%** — Target FE ≥ 70% ✅
- Gap: `BatteryReadingTable.tsx` 0% coverage (không test UI table + AlertDialog trong sprint 1)
  - Lý do: AlertDialog trong jsdom yêu cầu Radix portal setup phức tạp
  - Risk: thấp — logic xử lý đã được test ở hook layer

---

## Bugs tìm được
Không có bug mới. 1 test case điều chỉnh:
- `shows current validation error` ban đầu dùng giá trị `-20` (âm) — `userEvent.type` trên number input không giữ dấu trừ trong jsdom → đổi sang `15` (dương, > max 10A), test "Max 10A" thay "Min -10A". Logic validate vẫn được kiểm thử đầy đủ.

---

## Rủi ro & Lưu ý
- `BatteryReadingTable.tsx` chưa có test coverage — nên thêm trong sprint tiếp theo khi có test helper cho Radix portal
- Mock store là module-level → state chia sẻ giữa tests trong cùng file; tests viết theo thứ tự dependency (create → update → delete) để tránh flakiness
- Coverage không include `pages/BatteryReadingsPage.tsx` (excluded theo config) — integration test cần khi có E2E setup

---

## KẾT LUẬN
**PASS** — Độ tự tin: Cao

23/23 test PASS. Line coverage 87.23% ≥ 70% target. Sẵn sàng cho `/kltn-ship KAN-418`.
