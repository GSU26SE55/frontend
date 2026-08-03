// Sprint 6.4 — nhóm người nhận và lần gửi hàng loạt.
// Giá trị số bám đúng enum backend; BE trả về dạng SỐ, FE tự ánh xạ sang nhãn tiếng Việt.
// Dùng `as const` object + type alias — KHÔNG dùng `enum` của TypeScript (quy ước dự án).

/** Cách một nhóm xác định thành viên của nó. */
export const NotificationGroupKindEnum = {
  /** Thành viên liệt kê tường minh; admin thêm/bớt tay. */
  Static: 1,
  /**
   * Thành viên suy ra lúc gửi từ vai trò tài khoản. Không có dòng thành viên nào,
   * nên màn hình thành viên chỉ xem, không sửa.
   */
  Role: 2,
} as const;
export type NotificationGroupKindEnum =
  (typeof NotificationGroupKindEnum)[keyof typeof NotificationGroupKindEnum];

/** Một lần gửi bắt nguồn từ đâu. */
export const NotificationBatchSourceEnum = {
  /** Sinh tự động từ sự kiện nghiệp vụ. */
  Event: 1,
  /** Admin bấm gửi từ giao diện. */
  Manual: 2,
} as const;
export type NotificationBatchSourceEnum =
  (typeof NotificationBatchSourceEnum)[keyof typeof NotificationBatchSourceEnum];

/** Trạng thái nở người nhận của một lần gửi. */
export const NotificationBatchStatusEnum = {
  Pending: 1,
  FannedOut: 2,
  Failed: 3,
} as const;
export type NotificationBatchStatusEnum =
  (typeof NotificationBatchStatusEnum)[keyof typeof NotificationBatchStatusEnum];

/** Một lần gửi nhắm tới cái gì. */
export const NotificationBatchTargetKindEnum = {
  Group: 1,
  User: 2,
} as const;
export type NotificationBatchTargetKindEnum =
  (typeof NotificationBatchTargetKindEnum)[keyof typeof NotificationBatchTargetKindEnum];
