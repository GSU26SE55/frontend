# Plan — GH-85: [FE] Upload ảnh cho comment & maintenance log trên web (Staff/Manager)

## Metadata
- **Status:** REVIEWING | **Role:** FE | **Ngày:** 2026-06-17
- **Issue:** #85 — https://github.com/GSU26SE55/frontend/issues/85
- **Sprint:** Sprint 3 (deadline 2026-06-27)

## Mục tiêu
Cho phép **Staff/Manager** đính kèm ảnh từ web khi (a) thêm bình luận ticket và (b) ghi nhật ký bảo trì.
Tạo 1 widget upload tái dùng (`FileUploadField`) wire vào các form sẵn có. Đây là phần **write-path** —
read-path (hiển thị ảnh) đã hoàn tất ở follow-up GH-36.

## Scope
**Trong scope:**
- Component upload tái dùng `FileUploadField` (controlled, dùng `useUploadFile` + preview qua `AuthImage`).
- Wire vào **3 form**:
  - `features/staff/components/AddCommentForm.tsx` → field `attachments` (purpose `TicketAttachment`).
  - `features/manager/components/AddCommentForm.tsx` → field `attachments` (purpose `TicketAttachment`).
  - `features/staff/components/MaintenanceLogDialog.tsx` → field `beforePhotos` + `afterPhotos` (purpose `MaintenancePhoto`).
- Chỉ nhận **ảnh** (`accept="image/*"`), tối đa **5 ảnh/nhóm**.
- Disable nút submit khi đang upload; reset attachments sau khi submit thành công.

**Ngoài scope:**
- Maintenance `attachments` (nhóm tài liệu) — chỉ làm before/after (theo quyết định).
- Tài liệu không-ảnh (`.pdf/.doc/.docx`) — chỉ ảnh, không nâng cấp read-path.
- KbImage (KB article toàn text — không có field ảnh) và Firmware (FE chưa có feature) — không thuộc FE.
- Xóa file orphan khỏi storage khi user hủy/bỏ chọn — chấp nhận, để cleanup job xử lý (theo doc FileStorage).
- Thay đổi service/schema/types/hook — đã có sẵn đầy đủ, không động tới.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/file-storage/components/FileUploadField.tsx` | create | Widget upload controlled (`value`/`onChange`), preview + xóa |
| `src/features/staff/components/AddCommentForm.tsx` | modify | Bind `attachments` qua Controller; disable submit khi uploading |
| `src/features/manager/components/AddCommentForm.tsx` | modify | Bind `attachments` qua Controller; disable submit khi uploading |
| `src/features/staff/components/MaintenanceLogDialog.tsx` | modify | Bind `beforePhotos` + `afterPhotos`; disable submit khi uploading |

> **Không đổi:** `file-storage.service.ts`, `useUploadFile`, schema (`staff-ticket.schema.ts`, `manager/schemas/ticket.schema.ts`),
> request types (`AddCommentRequest`, `AddMaintenanceLogRequest`), `TicketAttachments`/`AuthImage` (read-path).

## Enums
| Enum | File nguồn |
|------|-----------|
| FilePurposeEnum (`TicketAttachment`, `MaintenancePhoto`) | `features/file-storage/enums/file-storage.enum.ts` (re-export qua `types/file-storage.types.ts`) |

## Types
Dùng lại type có sẵn — KHÔNG tạo mới. `FileUploadField` định nghĩa props nội bộ:
```ts
// shape khớp CommentAttachmentInput / MaintenanceAttachmentInput sẵn có
interface UploadedAttachment { fileId: string; fileName?: string; contentType?: string; sizeBytes?: number; }

interface FileUploadFieldProps {
  purpose: FilePurposeEnum;                         // TicketAttachment | MaintenancePhoto
  value: UploadedAttachment[];                      // controlled (mặc định [])
  onChange: (next: UploadedAttachment[]) => void;
  onUploadingChange?: (uploading: boolean) => void; // để form disable submit
  max?: number;                                     // default 5
  label?: string;
  disabled?: boolean;
}
```

## Schema (Zod)
Dùng schema có sẵn (`staff-ticket.schema.ts`, `manager/schemas/ticket.schema.ts`) — không tạo mới. Field `attachments`/`beforePhotos`/`afterPhotos` là mảng fileId.

## Endpoints
Không thêm endpoint. Dùng lại `useUploadFile` → `POST /api/files/upload` (multipart, đã có).

## Workflow

**Upload per-file flow (Pha A — ngay khi chọn ảnh):**
```
Chọn ảnh (accept="image/*", tối đa max=5/nhóm) → useUploadFile.mutateAsync({ file, purpose })
  → OK:   onChange([...value, { fileId, fileName, contentType, sizeBytes }])
          preview <AuthImage fileId compact /> + nút X (X chỉ bỏ khỏi value, không delete)
          onUploadingChange(false) khi hết ảnh đang upload
  → FAIL: handleErrorApi({ error }) → toast (413 quá lớn / 400 sai extension) → KHÔNG chèn vào value
```

**Submit flow (Pha B — form gửi mảng fileId):**
```
Đang upload → onUploadingChange(true) → nút "Gửi"/"Lưu" disabled
Submit (RHF, Controller attachments/beforePhotos/afterPhotos = mảng fileId) → mutateAsync
  → OK:   form.reset() → xóa attachments + clear preview → toast
  → FAIL: handleErrorApi({ error, setError }) → toast
```

## Approach
- `FileUploadField` là **controlled component**: nhận `value`/`onChange` → hoạt động ở cả 2 kiểu wiring
  (staff comment form nhận props `onSubmit`; manager comment form self-contained).
- Upload xảy ra **ngay khi chọn file** (Pha A), form chỉ submit mảng `fileId` (Pha B):
  ```
  chọn file → useUploadFile.mutateAsync({ file, purpose })
    → OK:   onChange([...value, { fileId, fileName, contentType, sizeBytes }])  (lấy từ FileUploadResponse)
    → FAIL: handleErrorApi({ error })  // 413 quá lớn | 400 sai extension → toast; KHÔNG thêm vào value
  ```
- Preview mỗi ảnh đã upload bằng `<AuthImage fileId={...} compact />` + nút X (X chỉ bỏ khỏi `value`, không gọi delete).
- Track số upload đang chạy → `onUploadingChange(true/false)`; form giữ state `uploading` để disable nút submit.
- Bind vào RHF bằng `Controller name="attachments|beforePhotos|afterPhotos"` → `field.value`/`field.onChange`.
- Đạt `max` → disable input chọn thêm.

## Edge Cases
- Ảnh > 20MB → `413` → `HttpError` → toast, không chèn.
- Sai định dạng (user vẫn có thể chọn qua "all files" dù `accept` lọc) → `400 listErrors[file]` → toast, không chèn.
- Đạt `max=5` → ẩn/disable nút chọn thêm.
- Submit khi đang upload → nút submit `disabled` (chặn gửi thiếu fileId).
- `value` undefined (field chưa set) → coi như `[]`.
- User hủy form/bỏ ảnh sau khi đã upload → file orphan trên storage (chấp nhận, cleanup job).
- Sau submit thành công → `form.reset()` xóa luôn attachments + clear preview.

## Acceptance Criteria
- [ ] Staff & Manager: trong form bình luận chọn được nhiều ảnh → ảnh upload, hiện thumbnail; gửi comment kèm `attachments` → reload thấy ảnh trong comment.
- [ ] Staff: trong dialog nhật ký bảo trì chọn ảnh "trước"/"sau" → lưu log kèm `beforePhotos`/`afterPhotos` → reload thấy ảnh.
- [ ] Ảnh > 20MB hoặc sai định dạng → toast lỗi, ảnh đó không được chèn; các ảnh hợp lệ khác vẫn upload.
- [ ] Mỗi nhóm tối đa 5 ảnh.
- [ ] Nút "Gửi"/"Lưu" bị disable khi còn ảnh đang upload.
- [ ] `npx tsc --noEmit` + `npx eslint --max-warnings=0` + `npm run build` → PASS.

## Steps
- [x] Bước 1: Tạo `FileUploadField.tsx` (input image multiple, upload per-file, preview AuthImage + xóa, max, onUploadingChange) — 2026-06-17
- [x] Bước 2: Wire vào `staff/components/AddCommentForm.tsx` (Controller `attachments`, purpose TicketAttachment, disable submit khi uploading) — 2026-06-17
- [x] Bước 3: Wire vào `manager/components/AddCommentForm.tsx` (tương tự staff) — 2026-06-17
- [x] Bước 4: Wire vào `staff/components/MaintenanceLogDialog.tsx` (2 FileUploadField: `beforePhotos`/`afterPhotos`, purpose MaintenancePhoto) — 2026-06-17
- [x] Bước 5: Reset attachments sau submit (comment: `form.reset`; maintenance: clear ảnh khi mở dialog) + chặn submit khi uploading ở cả 3 form — 2026-06-17
- [x] Bước 6: `tsc --noEmit` + `eslint --max-warnings=0` + `npm run build` → PASS — 2026-06-17

## Câu hỏi đã giải đáp
| Câu hỏi | Quyết định |
|---------|-----------|
| Maintenance làm nhóm ảnh nào? | Chỉ `beforePhotos` + `afterPhotos` (bỏ nhóm attachments). |
| Comment cho phép định dạng nào? | Chỉ ảnh (`accept="image/*"`) — không đụng read-path. |
| File orphan khi hủy/xóa? | Bỏ qua, cleanup job xử lý (không gọi `useDeleteFile`). |
| Giới hạn số ảnh/nhóm? | Tối đa 5/nhóm. |
| `AddCommentForm` có mấy file? | 2 — staff (props `onSubmit`) + manager (self-contained `useAddComment`); cả 2 đều wire. |
| Đặt `FileUploadField` ở đâu? | `features/file-storage/components/` — ESLint không enforce cross-feature; đúng pattern import hook file-storage hiện có. |
