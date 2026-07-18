// Toast message riêng của feature staff. Toast dùng chung → shared/constants/messages.

export const STAFF_MESSAGES = {
  kb: {
    created: "Đã tạo bài viết KB (chờ duyệt)",
    updated: "Đã cập nhật bài viết (chờ duyệt)",
    markedHelpful: "Đã đánh dấu hữu ích",
  },
  ticket: {
    commentAdded: "Đã thêm bình luận",
    maintenanceLogAdded: "Đã thêm nhật ký bảo trì",
    maintenanceLogUpdated: "Đã cập nhật nhật ký bảo trì",
  },
} as const;
