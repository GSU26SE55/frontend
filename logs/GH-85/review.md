# BÁO CÁO CODE REVIEW — feat/GH-85-upload-comment-maintenance-images — 2026-06-17

### TÓM TẮT
GH-85 thêm write-path upload ảnh cho 2 comment form (staff + manager) và maintenance dialog (staff),
qua 1 widget tái dùng `FileUploadField`. Quality gates PASS (`tsc`, `eslint --max-warnings=0`, `build`).
Không có lỗi Critical. 2 điểm Warning về kiến trúc/idiom (không chặn ship).

Effort: **Standard** (1 feature, 4 file).

---

### PHÂN TÍCH

#### ✅ Pass — Architecture
- API qua hook TanStack Query: `FileUploadField` dùng `useUploadFile` (mutation), không fetch trực tiếp ✅
- Không tạo Axios instance mới — `useUploadFile`→`fileStorageService`→`shared/lib/axios`; preview qua `AuthImage` (đã có) ✅
- Không business logic trong component — chỉ upload + UI state ✅
- Tái dùng `AuthImage` cho preview, không tự fetch ✅

#### ✅ Pass — Code Quality
- `FileUploadField` PascalCase ✅
- Không hardcode URL/token (qua `ENDPOINTS`/hook) ✅
- Loading state (spinner `Loader2` khi upload) + error state (toast) ✅
- Không `console.log` ✅
- Accumulate cục bộ (`current`) trong vòng upload tuần tự → tránh stale closure khi nhiều ảnh ✅
- Submit bị disable khi `uploading` ở cả 3 form ✅
- Maintenance: 2 cờ uploading riêng (before/after) → không đua trạng thái ✅
- Maintenance: clear ảnh khi mở dialog (dialog mount sẵn) → log mới không dính ảnh cũ ✅

#### ✅ Pass — Error Handling (có chủ ý lệch checklist)
- `FileUploadField` xử lý lỗi upload **tường minh** (`EntityError` → `errors[0].detail`; `HttpError` → `message`;
  còn lại → toast) thay vì `handleErrorApi`. **Lý do:** `handleErrorApi` bỏ qua `EntityError` khi không có
  `setError` → 400 sai định dạng sẽ im lặng. Cách hiện tại đảm bảo luôn có toast → **đúng hơn** cho ngữ cảnh
  uploader per-file (không có form field để map). ✅
- Field `attachments`/`beforePhotos`/`afterPhotos` bind qua `Controller` + `field.value ?? []` (an toàn undefined) ✅
- Comment form: `form.reset()` đã có sẵn → clear attachments sau gửi ✅

#### ✅ Pass — UI/UX
- Dùng shadcn `Button`; picker dùng `<input type=file>` + lucide icon (không có primitive shadcn tương đương) ✅
- `accept="image/*"`, max 5/nhóm (theo plan) ✅
- Thumbnail `flex-wrap` (comment) / `grid-cols-2` (maintenance) — responsive cơ bản ✅

#### 🟡 Warning 1 — Vị trí `FileUploadField` (kiến trúc)
- `src/features/file-storage/components/FileUploadField.tsx` được dùng cross-feature (staff + manager).
  Theo rule "shared/ là nơi DUY NHẤT chứa code reuse cross-feature", widget reuse ≥2 feature *lẽ ra* đặt ở
  `shared/components/common/` (như `AuthImage`, `TicketAttachments`).
- **Tuy nhiên** đặt ở `shared/` thì `shared` phải import `useUploadFile` (feature hook) → đảo layering
  (shared phụ thuộc feature). Đặt cạnh hook trong `features/file-storage/` giữ được tính tự chứa và **theo đúng
  tiền lệ** đã có: `ProfilePage` (feature `auth`) đã import `useUploadFile`/`useFileBlobUrl` từ `file-storage`.
  ESLint không enforce `no-restricted-imports`.
- **Khuyến nghị:** giữ nguyên (pragmatic, nhất quán tiền lệ). Nếu Leader muốn chuẩn `shared/`, phương án sạch
  layering là tự upload bằng axios+ENDPOINTS như `AuthImage` (đánh đổi: lặp logic upload). Không chặn ship.

#### 🟡 Warning 2 — `onUploadingChange` gọi trong updater của `setUploadingCount`
- `FileUploadField.bumpUploading` gọi `onUploadingChange?.(...)` bên trong callback updater của `setUploadingCount`.
  Side effect trong state updater là non-idiomatic; StrictMode dev có thể chạy updater 2 lần → `onUploadingChange`
  bắn 2 lần (giá trị boolean idempotent nên không sai kết quả). Được gọi từ event handler async (không phải render)
  nên không gây cảnh báo "update during render".
- **Gợi ý (tùy chọn):** chuyển notify parent sang `useEffect([uploadingCount])`. Không bắt buộc — hiện tại đúng về hành vi.

---

### RỦI RO & LƯU Ý
- **File orphan:** upload xảy ra ngay khi chọn; user hủy/bỏ ảnh → file vẫn trên storage (đã thống nhất: cleanup job lo).
- **Preview tốn 1 round-trip:** `AuthImage(fileId)` tải lại ảnh vừa upload (không dùng local blob). Chấp nhận cho đơn giản.
- **Manager comment submit (pre-existing, ngoài scope):** `onSubmit` của `manager/AddCommentForm` gọi `await mutateAsync`
  không bọc try-catch/`handleErrorApi`. Đây là code có sẵn, diff GH-85 không đụng — nên xử lý ở ticket khác nếu cần.
- **Stacked branch:** `feat/GH-85` nằm trên `feat/GH-84` (chứa GH-36 follow-up). Khi PR sẽ kèm commit GH-84 cho tới khi GH-84 merge vào `dev` trước.

---

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**

Không có Critical. 2 Warning đều là lựa chọn kiến trúc/idiom có lý do, không chặn ship. Sẵn sàng `/kltn-test 85`.
