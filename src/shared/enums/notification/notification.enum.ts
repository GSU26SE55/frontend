export const NotificationTypeEnum = {
  TicketCreated: 1,
  TicketAssigned: 2,
  TicketStatusChanged: 3,
  TicketResolved: 4,
  TicketClosed: 5,
  TicketEscalated: 6,
  SlaWarning: 7,
  SlaBreached: 8,
  BatteryAnomalyDetected: 9,
  EnvironmentalIncidentDetected: 10,
  EnvironmentalIncidentResolved: 11,
  AccountActivated: 12,
  // 13 = AdminInvite — ĐÃ GỠ 03/08/2026 cùng backend, cố ý để trống số này.
  // Thư mời quản trị đi thẳng AuthService → EmailService, KHÔNG qua NotificationService: không
  // consumer nào ghi, không dòng notifications nào mang type 13. Không dùng lại số 13.
  IncidentDeclared: 14,
  // Cascade risk ≥ 0.7 trên 1 pin (BatteryCascadeRiskHighEvent) → notify Manager/Admin.
  CascadeRiskHigh: 15,
  BatteryAlertEscalationPending: 16,
  AlertTicketSagaFailed: 17,
  IotDeviceWentOffline: 18,
  ChatCreated: 19,
  ChatMentioned: 20,
  ChatReacted: 21,
  ParticipantAdded: 22,
  ParticipantRemoved: 23,
  ParticipantRoleChanged: 24,
  BlogGenerationCompleted: 25,
  BlogGenerationFailed: 26,
  ChatEscalatedToAdmin: 27,
  TicketApproved: 28,
  TicketRejected: 29,
  TicketReopened: 30,
  TicketRatingRequested: 31,
  BatteryAnomalyWarning: 32,
  BatteryAnomalyInfo: 33,
  // 03/08/2026 — BE đã tách `TicketMerged` khỏi 27 sang 34 (hoàn tất GH-83), nên nay mirror được.
  // Trước đó BE khai `TicketMerged = 27` TRÙNG `ChatEscalatedToAdmin` ⇒ map value→tên ambiguous
  // nên FE từng cố ý bỏ trống. Notification này báo Customer khi ticket của họ bị gộp.
  // KHÔNG dùng lại 27 cho bất kỳ loại nào.
  TicketMerged: 34,
  System: 99,
} as const;
// ⚠️ Số lấy theo BE `NotificationTypeEnum.cs`. Nhóm Sprint 6.2 nằm ở 27–33 (không phải 25–31):
// module Blog GH-671 chiếm 25/26 nên đẩy toàn bộ nhóm sau lên 2 bậc.
export type NotificationTypeEnum =
  (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export const NotificationChannelEnum = {
  Push: 1,
  Email: 2,
  Sms: 3,
  InApp: 4,
} as const;
export type NotificationChannelEnum =
  (typeof NotificationChannelEnum)[keyof typeof NotificationChannelEnum];

export const NotificationStatusEnum = {
  Pending: 1,
  Sent: 2,
  Failed: 3,
  Read: 4,
  // Sprint 6.3 NOTI3-14: provider xác nhận đã đẩy tới thiết bị (Expo receipt "ok").
  Delivered: 5,
  // Sprint 6.3 NOTI3-14: user chủ động mở notification — mạnh hơn Read.
  Opened: 6,
} as const;
export type NotificationStatusEnum =
  (typeof NotificationStatusEnum)[keyof typeof NotificationStatusEnum];

// "Chưa đọc" theo đúng định nghĩa BE (GetUnreadCountQueryHandler): loại CẢ Read LẪN Opened.
// Dùng helper này ở mọi chỗ FE tự tính unread để không lệch badge do server trả về.
export const isUnreadStatus = (status: NotificationStatusEnum): boolean =>
  status !== NotificationStatusEnum.Read &&
  status !== NotificationStatusEnum.Opened;

// Nhóm nghiệp vụ của notification (Sprint 6.3 NOTI3-04) — dùng cho ma trận nhóm × kênh.
export const NotificationCategoryEnum = {
  Ticket: 1,
  Sla: 2,
  Battery: 3,
  Environmental: 4,
  Chat: 5,
  Account: 6,
} as const;
export type NotificationCategoryEnum =
  (typeof NotificationCategoryEnum)[keyof typeof NotificationCategoryEnum];

// Tần suất gửi (NotificationPreference per-user) — khai báo để đủ domain,
// không xuất hiện trên 2 endpoint REST hiện tại.
export const NotificationFrequencyEnum = {
  Immediate: 1,
  Daily: 2,
} as const;
export type NotificationFrequencyEnum =
  (typeof NotificationFrequencyEnum)[keyof typeof NotificationFrequencyEnum];

// Platform của device token — dùng cho các endpoint /api/device-tokens.
export const DevicePlatformEnum = {
  Ios: 1,
  Android: 2,
  Web: 3,
} as const;
export type DevicePlatformEnum =
  (typeof DevicePlatformEnum)[keyof typeof DevicePlatformEnum];
