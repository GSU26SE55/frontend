// Nhãn hành động (button/menu) dùng chung toàn app. Gom về 1 nguồn để:
// - Chuẩn hóa chính tả (Huỷ→Hủy, Xoá→Xóa — thống nhất Hủy/Xóa).
// - Đổi wording 1 chỗ áp mọi nơi.
// Dùng: <Button>{ACTIONS.SAVE}</Button>

export const ACTIONS = {
  SAVE: "Lưu",
  SAVE_CHANGES: "Lưu thay đổi",
  DELETE: "Xóa",
  CANCEL: "Hủy",
  CONFIRM: "Xác nhận",
  ADD: "Thêm",
  ADD_NEW: "Thêm mới",
  EDIT: "Chỉnh sửa",
  CREATE: "Tạo mới",
  CLOSE: "Đóng",
  BACK: "Quay lại",
  REJECT: "Từ chối",
  APPROVE: "Duyệt",
  REFRESH: "Làm mới",
  SEND: "Gửi",
  UPDATE: "Cập nhật",
} as const;
