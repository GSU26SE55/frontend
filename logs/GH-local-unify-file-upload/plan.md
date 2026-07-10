# Plan — local: Gộp tải ảnh và tái sử dụng ảnh thành Dialog 2 Tabs kèm nút Xác nhận

## Metadata
- **Status:** DONE | **Role:** FE | **Ngày:** 2026-07-10
- **Issue:** local (gộp tải ảnh & tái sử dụng ảnh cũ trong Ticket thành Dialog 2 Tabs)

## Mục tiêu
Tối ưu hóa trải nghiệm đính kèm ảnh/tệp tin trong phần bình luận ticket: gộp hai tính năng tải lên thiết bị và chọn từ thư viện ticket vào một hộp thoại duy nhất, cải tiến thiết kế và bổ sung nút Xác nhận để người dùng kiểm soát danh sách tệp đính kèm trước khi áp dụng.

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/file-storage/components/FileUploadField.tsx` | modify | Thêm state `dialogAttachments`, thiết kế lại Dialog với Tabs ("Thư viện" và "Tải lên"), hỗ trợ drag & drop, và bổ sung footer Hủy/Xác nhận |
| `src/features/staff/components/AddCommentForm.tsx` | modify | Truyền prop `existingFileIds` xuống cho `FileUploadField` |
| `src/features/manager/components/AddCommentForm.tsx` | modify | Truyền prop `existingFileIds` xuống cho `FileUploadField` |
| `src/features/admin/components/AddCommentForm.tsx` | modify | Truyền prop `existingFileIds` xuống cho `FileUploadField` |
| `src/features/staff/pages/TicketDetailPage.tsx` | modify | Thu thập fileId từ ticket và các comment cũ để truyền cho `AddCommentForm` |
| `src/features/manager/pages/TicketDetailPage.tsx` | modify | Thu thập fileId từ ticket và các comment cũ để truyền cho `AddCommentForm` |
| `src/features/admin/pages/AdminTicketDetailPage.tsx` | modify | Thu thập fileId từ ticket và các comment cũ để truyền cho `AddCommentForm` |

## Các thay đổi chi tiết

### 1. Đồng bộ luồng truyền dữ liệu từ Trang Chi tiết Ticket xuống Form
* Tại các trang chi tiết ticket của Staff, Manager, và Admin: tổng hợp toàn bộ danh sách `fileId` từ ảnh đính kèm của ticket, nhật ký bảo trì (maintenance logs), và bình luận cũ để truyền prop `existingFileIds` xuống form bình luận (`AddCommentForm`).
* `AddCommentForm` nhận `existingFileIds` và forward tiếp xuống `<FileUploadField />`.

### 2. Thiết kế lại Hộp thoại Đính kèm (Dialog 2 Tabs)
* **Logic thông minh**:
  - Nếu `existingFileIds.length > 0`: Khi click "Thêm" sẽ mở Dialog.
  - Ngược lại: Trực tiếp trigger click input tệp để mở hộp thoại duyệt file của thiết bị, tiết kiệm thao tác.
* **Cải tiến Dialog**:
  - Đổi tên và tối giản Tabs thành **"Thư viện"** và **"Tải lên"** cho gọn nhẹ.
  - **Tab Thư viện**: Hiển thị ảnh cũ trong ticket dạng grid, click vào ảnh để bật/tắt (toggle) trạng thái chọn. Khi chọn sẽ có viền sáng màu primary và tích xanh đánh dấu ở góc.
  - **Tab Tải lên**: Khu vực kéo thả tệp tin kích thước vừa phải, hỗ trợ drag & drop hoặc click để chọn file. Tệp tải lên thành công sẽ được tự động chọn.
  - **Footer điều khiển**: Bổ sung nút **Hủy** (đóng Dialog không lưu) và **Xác nhận (N)** (áp dụng các tệp đã chọn vào comment).

## Các bước thực hiện & Kết quả
- [x] Truyền prop `existingFileIds` từ TicketDetailPage -> AddCommentForm -> FileUploadField
- [x] Khai báo state tạm thời `dialogAttachments` đồng bộ với `items` khi mở Dialog
- [x] Triển khai UI Tabs ("Thư viện", "Tải lên") cùng checkbox/checkmark tích xanh khi chọn ảnh
- [x] Tích hợp Drag & Drop cùng loader khi tải tệp mới trong Dialog
- [x] Tạo footer Xác nhận và Hủy để kiểm soát việc lưu danh sách tệp đính kèm
- [x] Chạy lệnh `npx tsc --noEmit` kiểm tra biên dịch hệ thống → **PASS**
