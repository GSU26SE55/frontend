// Toast message riêng của feature manager. Toast dùng chung → shared/constants/messages.

export const MANAGER_MESSAGES = {
  ticket: {
    triaged: "Triage ticket thành công",
    rejectedAtTriage: "Đã từ chối ticket ở bước Triage",
    staffAssigned: "Gán Staff thành công",
    staffReassigned: "Điều chuyển Staff thành công",
    resultApproved: "Phê duyệt kết quả thành công",
    resultRejected: "Từ chối kết quả — ticket quay về In Progress",
    escalated: "Ticket đã được chuyển cấp",
    markedIncident: "Ticket đã được đánh dấu là Incident",
    commentAdded: "Đã thêm bình luận",
  },
  kb: {
    created: "Đã tạo bài viết KB",
    updated: "Đã cập nhật bài viết",
    duplicated: "Đã sao chép bài viết — mở bản mới để chỉnh sửa",
    markedHelpful: "Đã đánh dấu hữu ích",
  },
} as const;
