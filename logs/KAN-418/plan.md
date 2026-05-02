# Plan — KAN-418: [FE] test workflow-ai -- CRUD static data (mock)

## Mục tiêu
Tạo một màn hình CRUD đơn giản trong frontend hiện tại để test workflow AI Sprint 1, sử dụng dữ liệu tĩnh/mock trong client và không gọi Backend API.

Output mong đợi:
- Hiển thị danh sách dữ liệu mẫu (GET mock).
- Thêm mới item vào danh sách (POST mock).
- Cập nhật item đang có (PUT mock).
- Xóa item khỏi danh sách (DELETE mock).
- UI đủ trạng thái cơ bản: form nhập liệu, danh sách rỗng, thao tác edit/delete.

## Các file sẽ tạo/sửa
| File | Hành động | Mô tả |
|------|-----------|-------|
| `code/src/App.tsx` | modify | Thay màn hình Vite mặc định bằng entry render feature CRUD mock. |
| `code/src/App.css` | modify | Thay style Vite mặc định bằng style cho layout CRUD responsive. |
| `code/src/features/mock-crud/types/mockItem.ts` | create | Định nghĩa type dữ liệu item mock. |
| `code/src/features/mock-crud/data/mockItems.ts` | create | Danh sách dữ liệu mẫu ban đầu. |
| `code/src/features/mock-crud/components/MockCrudPage.tsx` | create | Component chính xử lý UI state và thao tác CRUD mock. |

## Approach
- Tạo feature riêng `mock-crud` trong `code/src/features/` để giữ đúng hướng feature-based.
- Dữ liệu mock ban đầu nằm trong `data/mockItems.ts`.
- `MockCrudPage` dùng `useState` vì toàn bộ dữ liệu chỉ là UI/local state phục vụ test workflow, không phải server state.
- Implement thao tác CRUD trên mảng local:
  - GET mock: render state khởi tạo từ `mockItems`.
  - POST mock: validate input tối thiểu, tạo item mới với `crypto.randomUUID()` nếu có, fallback `Date.now()`.
  - PUT mock: chọn item để edit, cập nhật item theo `id`.
  - DELETE mock: xóa item theo `id`.
- Không tạo Axios service vì ticket yêu cầu không dùng BE API.
- Không thêm package mới.

## Dependencies & Edge Cases
- Dependency: không phụ thuộc BE API.
- Edge case: danh sách rỗng sau khi xóa hết item.
- Edge case: không cho submit khi tên item rỗng.
- Edge case: khi đang edit mà item bị xóa, reset form về chế độ thêm mới.
- Edge case: giữ UI responsive cho màn hình nhỏ.

## Ước tính
- Size: Small
- Thời gian: 1–1.5 giờ
