// Toast message riêng của feature staff. Toast dùng chung → shared/constants/messages.

export const STAFF_MESSAGES = {
  kb: {
    created: "Đã tạo bài viết KB (chờ duyệt)",
    updated: "Đã cập nhật bài viết",
    updatePending: "Đã gửi thay đổi — chờ phê duyệt để hiển thị",
    duplicated: "Đã sao chép bài viết — mở bản mới để chỉnh sửa",
    markedHelpful: "Đã đánh dấu hữu ích",
  },
  ticket: {
    commentAdded: "Đã thêm bình luận",
    maintenanceLogAdded: "Đã thêm nhật ký bảo trì",
    maintenanceLogUpdated: "Đã cập nhật nhật ký bảo trì",
  },
} as const;
