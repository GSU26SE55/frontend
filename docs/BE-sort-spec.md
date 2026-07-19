# [BE] Yêu cầu: Server-side Sort toàn diện cho tất cả bảng list

> **Đối tượng:** BE (tất cả service có endpoint list)
> **Người yêu cầu:** FE
> **Trạng thái:** ✅ **BE ĐÃ IMPLEMENT** (`SortBy`/`SortDir`, chi tiết trong `api-battery.md`/`api-ticket.md`/`api-auth.md` mục "Server-side Sort"). FE đang wire sort server-side + bỏ sort client-side. Sensor History dùng **Hướng B** (sort field ≠ time → bắt buộc from/to, không cursor).

---

## 1. Bối cảnh — vấn đề toàn hệ thống

Hầu hết các bảng trên Web đang cho **click sort theo cột** ở header (Thời điểm, Trạng thái, Ngày tạo, Điện áp…). **Nhưng sort này chạy CLIENT-SIDE** (`useSortableData`) — chỉ sort trên **các record đã tải về trang hiện tại**, không phải toàn bộ dataset.

Vì đa số endpoint dùng **offset pagination** (`pageNumber`/`pageSize`) và BE chỉ trả 1 page với thứ tự **mặc định cố định** (thường `CreatedAt DESC`):

- User đang xem page 1 (100 record), bấm sort "Tên A→Z" → FE chỉ sắp lại 100 record của page 1.
- Record thuộc page 2, 3… **không được tính vào**. Sang page 2 thì lại sort riêng page 2.

→ **Sort không toàn diện trên mọi bảng.** Muốn sort đúng phải **sort ở server** rồi phân trang trên kết quả đã sort.

Đây **không phải vấn đề riêng của Lịch sử cảm biến** — nó xảy ra ở **18 bảng** (xem §5).

## 2. Giải pháp — Convention chung: thêm `SortBy` + `SortDir`

Thêm 2 query param cho **mọi endpoint list** (offset pagination). Query gửi dạng **PascalCase** (đúng convention hiện tại của BE).

| Param | Type | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|
| `SortBy` | `string?` | Không | field mặc định của endpoint | Tên field để sort — **theo whitelist per-endpoint** ở §5 |
| `SortDir` | `string?` | Không | `desc` | `asc` \| `desc` |

**Behavior:**
- BE `ORDER BY <mapped column> <dir>` **trước khi** phân trang → page trả về đã đúng thứ tự toàn cục.
- Không truyền `SortBy` → giữ nguyên default hiện tại (không phá behavior cũ).

### Quy tắc bắt buộc

1. **Whitelist per-endpoint** — chỉ chấp nhận đúng các field liệt kê ở §5. Dùng **switch-case** map `SortBy` (string client) → property entity. **KHÔNG dùng dynamic LINQ / reflection theo string thô** từ client (tránh injection + sort theo cột không index).
2. `SortBy` ngoài whitelist → coi như field mặc định (an toàn) — hoặc trả `400`, BE chọn và ghi rõ.
3. `SortDir` khác `asc`/`desc` → coi như `desc`.
4. **Tie-breaker ổn định:** luôn thêm khóa phụ cố định để thứ tự không đổi giữa các page khi field sort có giá trị trùng, ví dụ `ORDER BY <sortField> <dir>, Id ASC` (hoặc `CreatedAt DESC`). Bắt buộc vì thiếu tie-breaker → offset pagination có thể lặp/thiếu record khi phân trang.
5. **Index:** đảm bảo cột cho phép sort có index phù hợp (nhất là bảng lớn), tránh full-scan.

### Về param `IsDescending` đang có ở vài endpoint

2 endpoint (`/api/admin/tickets`, `/api/admin/iot-devices`) **đã có** `IsDescending` (chỉ đảo chiều, không chọn được cột). Xử lý:

- **Ưu tiên:** thêm `SortBy` mới; giữ `IsDescending` cho tương thích ngược nhưng **nếu có `SortDir` thì `SortDir` thắng**. Hoặc deprecate `IsDescending`, gộp vào `SortDir`. BE quyết, ghi rõ để FE wire đúng.

## 3. Response — giữ nguyên shape

Không đổi `PaginationResponse<T>` (`items`/`totalItems`/`pageNumber`/`pageSize`/`totalPages`/`hasNextPage`/`hasPreviousPage`). Chỉ đổi **thứ tự `items`** theo `SortBy`/`SortDir`.

## 4. ⚠️ Ba trường hợp đặc biệt (không phải offset thuần)

### 4a. Sensor History — CURSOR pagination (chi tiết)

`GET /api/sensor-readings/{assetId}/history` dùng **cursor = timestamp** record cuối (`time < cursor`). Cursor kiểu này **chỉ đúng khi sort theo `time`**. Khi `SortBy != time`, timestamp-cursor **mất ý nghĩa** (data không còn xếp theo time). Whitelist `SortBy`: `time`, `voltage`, `current`, `temperature`, `socPercent` → map switch-case sang property `Timestamp`, `Voltage`, `Current`, `Temperature`, `SocPercent`. Param cũ giữ nguyên: `from`, `to`, `limit`, `cursor`.

**Chọn 1 trong 2 hướng — BE quyết, báo FE để wire nút "Tải thêm":**

**Hướng A — Keyset cursor theo `(sortField, time)` — khuyến nghị.**
Cursor encode cả **giá trị field đang sort** + **time** (tie-breaker khi trùng giá trị). Ví dụ cursor = base64 của `{ v: <sortValue>, t: <time> }`.
- Điều kiện lấy trang sau (sort `desc`): `(sortField, time) < (cursorValue, cursorTime)` theo thứ tự từ điển.
- `ORDER BY sortField DESC, Timestamp DESC` (đảo `ASC` khi `SortDir=asc`).
- Giữ cursor pagination hiệu quả trên TimescaleDB, không offset.
- `nextCursor` = keyset cursor mới (base64), FE truyền lại nguyên văn vào `cursor`.

**Hướng B — Đơn giản hóa: khi `SortBy != time`, sort trong `[from, to]`, KHÔNG cursor.**
- Bắt buộc client truyền `from`/`to` khi `SortBy != time` (giới hạn scan, tránh full-scan hàng triệu row) → thiếu thì `400`.
- Sort toàn bộ range ở DB, trả theo `limit`; khi `SortBy != time` thì `nextCursor = null` (FE tắt "Tải thêm").
- Đơn giản hơn A nhưng không load thêm được khi đang sort field khác time.

**Response:** giữ nguyên `SensorReadingHistoryResponseDto` (`items`/`nextCursor`/`hasMore`).
**Validation riêng:** `from > to` → `422`; `limit` ngoài `1–1000` → `400` (giữ rule cũ). `SortBy` ngoài whitelist → coi như `time` hoặc `400`; `SortDir` lạ → `desc`.
**Doc:** cập nhật Swagger + `docs/api-battery.md` §Nhóm 4 (`GET /history`).

### 4b. LOAD-ALL — không phân trang
`GET /api/admin/sms-gateway/devices` và `GET /api/iot-devices/calibrations-expiring` trả **mảng thẳng, load hết**. Với 2 endpoint này **sort client-side đã toàn diện** (vì có đủ data) → **KHÔNG bắt buộc** thêm `SortBy` server-side. Chỉ thêm nếu sau này chuyển sang phân trang.

### 4c. Endpoint dùng key phân trang `page` thay vì `pageNumber`
`/api/admin/iot-devices` và `/api/admin/iot-firmware-releases` dùng **`page`** (không phải `pageNumber`). Không cần đổi, chỉ lưu ý để nhất quán khi thêm `SortBy`/`SortDir`.

## 5. Danh sách endpoint × whitelist field sort

> Cột "Sort BE hiện có" phản ánh trạng thái hôm nay. FE sẽ chỉ wire header-sort khi endpoint đã hỗ trợ `SortBy`.

### Nhóm OFFSET pagination — cần thêm `SortBy` + `SortDir`

| # | Bảng (màn hình) | Endpoint | Sort BE hiện có | Whitelist `SortBy` cần hỗ trợ | Default |
|---|---|---|---|---|---|
| 1 | Tickets (Admin) | `GET /api/admin/tickets` | 🟡 `IsDescending` (không chọn cột) | `code`, `title`, `category`, `status`, `priority`, `createdAt` | `createdAt` desc |
| 2 | Tickets (Manager) | `GET /api/admin/tickets` | 🟡 `IsDescending` | *(dùng chung #1)* | `createdAt` desc |
| 3 | Battery Assets | `GET /api/battery-assets` | ❌ không | `serialNumber`, `batteryTypeName`, `customerName`, `siteName`, `status`, `installDate` | `createdAt` desc |
| 4 | Battery Audit Log | `GET /api/admin/battery/audit-logs` | ❌ không | `occurredAt`, `actionCode`, `severity`, `targetDisplay`, `actorAccountId`, `isSuccess` | `occurredAt` desc |
| 5 | Battery Types | `GET /api/battery-types` | ❌ không | `name`, `manufacturer`, `chemistry`, `nominalCapacityAh`, `nominalVoltage`, `maxCycleCount` | `createdAt` desc |
| 6 | IoT Devices | `GET /api/admin/iot-devices` (`page`) | 🟡 `IsDescending` | `deviceCode`, `displayName`, `siteName`, `status`, `currentFirmwareVersion`, `lastSeenAt` | `createdAt` desc |
| 7 | IoT Firmware | `GET /api/admin/iot-firmware-releases` (`page`) | ❌ không | `version`, `hardwareRevision`, `channel`, `status`, `artifactSizeBytes`, `createdAt` | `createdAt` desc |
| 8 | KB Articles (Admin/Manager/Staff) | `GET /api/knowledge-base` | ❌ không | `code`, `title`, `category`, `status`, `viewCount`, `helpfulCount` | `createdAt` desc |
| 9 | Sites (Admin/Manager/**Staff**) | `GET /api/sites` | ❌ không | `name`, `customerName`, `status`, `batteryAssetCount`, `installDate` | `createdAt` desc |
| 10 | Site Assets | `GET /api/sites/{siteId}/assets` | ❌ không | `serialNumber`, `batteryTypeName`, `status`, `installDate`, `lastSensorReadingAt` | `installDate` desc |
| 11 | Login History | `GET /api/accounts/me/login-history` | ❌ không | `createdAt`, `result`, `method`, `ipAddress` | `createdAt` desc |
| 12 | Accounts (Admin) | `GET /api/admin/accounts` | ❌ không | `fullName`, `role`, `status`, `createdAt` | `createdAt` desc |

> **Lưu ý #8, #9:** cùng endpoint được nhiều portal (Admin/Manager/Staff) dùng chung → chỉ cần thêm `SortBy` 1 lần cho endpoint đó.
> **Lưu ý #9 (Sites — Staff):** GH-145 thêm site list cho **Staff** (`features/staff/services/site.service.ts` + `useSites.ts`, để chọn `siteId` khi report sự cố thủ công). Staff dùng **chung `GET /api/sites`** — endpoint này vốn `[Authorize(Roles="Admin,Manager")]`, đã được mở cho Staff ở branch BE `fix/GH-146-open-sites-list-staff`. Khi thêm `SortBy`/`SortDir` cho `/api/sites`, **áp dụng cho cả 3 portal** (không cần endpoint riêng cho Staff).
> **Lưu ý #10 (Site Assets):** hiện FE **chưa** bật header-sort (không có `sortKey`), nhưng nên hỗ trợ để FE bật sau.

### Nhóm CURSOR — xử lý riêng (§4a)

| # | Bảng | Endpoint | Whitelist `SortBy` | Ghi chú |
|---|---|---|---|---|
| 13 | Sensor History | `GET /api/sensor-readings/{assetId}/history` | `time`, `voltage`, `current`, `temperature`, `socPercent` | Cursor — chọn Hướng A/B (chi tiết §4a) |

### Nhóm LOAD-ALL — KHÔNG bắt buộc (§4b)

| # | Bảng | Endpoint | Ghi chú |
|---|---|---|---|
| 14 | SMS Gateway Devices | `GET /api/admin/sms-gateway/devices` | Trả mảng, load hết → client-sort đã toàn diện |
| 15 | Calibrations Expiring | `GET /api/iot-devices/calibrations-expiring` | Trả mảng, param `within` → client-sort ổn |

## 6. Ví dụ request

```http
# Accounts — sort theo tên A→Z, toàn dataset, page 1
GET /api/admin/accounts?PageNumber=1&PageSize=10&SortBy=fullName&SortDir=asc

# Battery Assets — sort theo ngày lắp mới nhất
GET /api/battery-assets?PageNumber=1&PageSize=20&SortBy=installDate&SortDir=desc

# Tickets — sort theo priority tăng dần
GET /api/admin/tickets?PageNumber=1&PageSize=20&SortBy=priority&SortDir=asc
```

## 7. Checklist BE (áp dụng cho mỗi endpoint ở §5)

- [ ] Thêm `SortBy` (string) + `SortDir` (string) vào `*GetListQuery` / `*ListParams`
- [ ] Switch-case whitelist `SortBy` → property entity (KHÔNG dynamic LINQ theo string thô)
- [ ] `ORDER BY <sortField> <dir>, <tie-breaker cố định>` — **trước** khi `.Skip().Take()`
- [ ] Field ngoài whitelist → default field (hoặc `400`); `SortDir` lạ → `desc`
- [ ] Đảm bảo có index cho cột cho phép sort (bảng lớn)
- [ ] `/api/admin/tickets`, `/api/admin/iot-devices`: hòa hợp `IsDescending` cũ với `SortDir` mới (SortDir thắng nếu có)
- [ ] Sensor History: chọn & implement Hướng A hoặc B, báo FE
- [ ] Cập nhật Swagger + `docs/api-*.md` tương ứng
- [ ] Báo FE endpoint nào đã xong để FE wire header-sort

---

## Phụ lục — phần FE tự làm sau (không cần BE)

- **Wire header-sort → gọi API:** sau khi BE hỗ trợ `SortBy`/`SortDir`, FE bỏ sort client-side (`useSortableData`), chuyển click header thành đổi query param + refetch. Chờ BE xong từng endpoint.
- **Filter form Lịch sử cảm biến (from date + to date, có chọn giờ):** dùng lại param `from`/`to` **đã có sẵn** — **BE không cần thêm gì cho filter này**. FE làm sau cùng đợt wire sort của Sensor History.
