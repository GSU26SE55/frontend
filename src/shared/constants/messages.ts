// Toast message dùng CHUNG cross-feature (shared/hooks, shared/components) + các
// message lặp ở nhiều feature (KB refs, micro permission). Gom 1 nguồn.
// Toast riêng 1 feature → features/<feature>/constants/messages.ts.

export const MESSAGES = {
  // Lỗi chung
  unknownError: "Có lỗi không xác định xảy ra",
  micPermission: "Không thể truy cập micro. Vui lòng cấp quyền và thử lại.",

  // KB references (dùng ở cả staff/manager)
  kb: {
    refAttached: "Đã gắn bài viết KB",
    refDetached: "Đã gỡ bài viết KB",
  },

  // Ticket chat (shared/hooks/useTicketChatActions)
  chat: {
    commentDeleted: "Đã xóa bình luận",
    fileScanning: "File đang được quét virus, vui lòng thử lại sau ít giây.",
    fileInfected: "File bị nhiễm virus — không thể tải xuống.",
  },

  // Alerts / môi trường (shared/hooks)
  alert: {
    acknowledged: "Đã xác nhận cảnh báo",
    resolved: "Đã xử lý cảnh báo",
  },
  incident: {
    acknowledged: "Đã xác nhận sự cố",
    resolved: "Đã xử lý sự cố",
    falseAlarm: "Đã đánh dấu báo động giả",
    reported: "Đã ghi nhận sự cố",
    // Dedup: BE trả 200 + incident cũ khi site đã có incident active cùng loại.
    alreadyActive: "Site này đã có sự cố cùng loại đang mở — hiển thị sự cố đó",
  },
  ambient: {
    thresholdSaved: "Đã lưu cấu hình ngưỡng môi trường",
  },
  classification: {
    feedbackSubmitted: "Đã ghi nhận đánh giá",
  },

  // Thiết bị / calibration / notification (shared/components)
  device: {
    registered: "Đăng ký thiết bị thành công",
    unregistered: "Đã hủy đăng ký thiết bị",
  },
  calibration: {
    added: "Thêm calibration thành công",
    deleted: "Đã xóa calibration",
  },
  notificationPrefs: {
    saved: "Đã lưu cài đặt thông báo",
  },
  file: {
    loadInfoFailed: "Lỗi khi tải thông tin tệp tin.",
  },
} as const;
