import {
  NotificationGroupKindEnum,
  NotificationBatchSourceEnum,
  NotificationBatchStatusEnum,
} from "@/shared/enums/notification/notification-group.enum";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
} from "@/shared/enums/notification/notification.enum";

// Nhãn tiếng Việt cho enum notification.
//
// Vì sao nằm ở FE: từ 02/08/2026 BE trả `type`/`channel` dạng SỐ thay vì tên enum. Trước đó BE trả
// tên enum tiếng Anh ("SlaBreached", "Email") và FE dán thẳng lên màn hình — sai với một hệ thống
// tiếng Việt. Việc dịch là chuyện hiển thị, thuộc về FE; BE chỉ trả dữ liệu.
//
// `Record<Enum, string>` cố ý KHÔNG dùng Partial: thêm một giá trị enum mới mà quên nhãn thì
// TypeScript báo lỗi ngay lúc build, thay vì lặng lẽ hiện "#34" trên giao diện.

export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeEnum, string> = {
  [NotificationTypeEnum.TicketCreated]: "Ticket mới",
  [NotificationTypeEnum.TicketAssigned]: "Giao ticket",
  [NotificationTypeEnum.TicketStatusChanged]: "Đổi trạng thái ticket",
  [NotificationTypeEnum.TicketResolved]: "Đã xử lý xong",
  [NotificationTypeEnum.TicketClosed]: "Đóng ticket",
  [NotificationTypeEnum.TicketEscalated]: "Leo thang ticket",
  [NotificationTypeEnum.SlaWarning]: "Cảnh báo sắp vỡ SLA",
  [NotificationTypeEnum.SlaBreached]: "Vỡ SLA",
  [NotificationTypeEnum.BatteryAnomalyDetected]:
    "Bất thường pin (nghiêm trọng)",
  [NotificationTypeEnum.EnvironmentalIncidentDetected]: "Sự cố môi trường",
  [NotificationTypeEnum.EnvironmentalIncidentResolved]:
    "Sự cố môi trường đã xử lý",
  [NotificationTypeEnum.AccountActivated]: "Kích hoạt tài khoản",
  [NotificationTypeEnum.IncidentDeclared]: "Công bố sự cố lớn",
  [NotificationTypeEnum.CascadeRiskHigh]: "Nguy cơ lan truyền cao",
  [NotificationTypeEnum.BatteryAlertEscalationPending]:
    "Cảnh báo pin chờ leo thang",
  [NotificationTypeEnum.AlertTicketSagaFailed]: "Saga cảnh báo–ticket lỗi",
  [NotificationTypeEnum.IotDeviceWentOffline]: "Thiết bị IoT mất kết nối",
  [NotificationTypeEnum.ChatCreated]: "Tin nhắn mới",
  [NotificationTypeEnum.ChatMentioned]: "Được nhắc tên",
  [NotificationTypeEnum.ChatReacted]: "Bày tỏ cảm xúc",
  [NotificationTypeEnum.ParticipantAdded]: "Thêm người tham gia",
  [NotificationTypeEnum.ParticipantRemoved]: "Gỡ người tham gia",
  [NotificationTypeEnum.ParticipantRoleChanged]: "Đổi vai trò tham gia",
  [NotificationTypeEnum.BlogGenerationCompleted]: "Tạo bài blog xong",
  [NotificationTypeEnum.BlogGenerationFailed]: "Tạo bài blog lỗi",
  [NotificationTypeEnum.ChatEscalatedToAdmin]: "Chat leo thang lên Admin",
  [NotificationTypeEnum.TicketApproved]: "Duyệt kết quả xử lý",
  [NotificationTypeEnum.TicketRejected]: "Từ chối kết quả xử lý",
  [NotificationTypeEnum.TicketReopened]: "Mở lại ticket",
  [NotificationTypeEnum.TicketRatingRequested]: "Yêu cầu đánh giá",
  [NotificationTypeEnum.BatteryAnomalyWarning]: "Bất thường pin (cảnh báo)",
  [NotificationTypeEnum.BatteryAnomalyInfo]: "Bất thường pin (thông tin)",
  [NotificationTypeEnum.TicketMerged]: "Ticket đã được gộp",
  [NotificationTypeEnum.System]: "Thông báo hệ thống",
};

export const NOTIFICATION_CHANNEL_LABELS: Record<
  NotificationChannelEnum,
  string
> = {
  [NotificationChannelEnum.Push]: "Push",
  [NotificationChannelEnum.Email]: "Email",
  [NotificationChannelEnum.Sms]: "SMS",
  [NotificationChannelEnum.InApp]: "Trong ứng dụng",
};

// Fallback "#số" thay vì chuỗi rỗng: BE thêm enum mới mà FE chưa cập nhật thì vẫn nhìn ra được
// giá trị nào đang thiếu nhãn, không phải mở DevTools mới biết.
export const notificationTypeLabel = (t: NotificationTypeEnum) =>
  NOTIFICATION_TYPE_LABELS[t] ?? `#${t}`;

export const notificationChannelLabel = (c: NotificationChannelEnum) =>
  NOTIFICATION_CHANNEL_LABELS[c] ?? `#${c}`;

// Trạng thái giao nhận — hiện ở pane chi tiết hộp thư.
// Pending/Processing/Sent/Delivered là các chặng của một lần gửi, còn Read/Opened là hành vi
// người nhận; diễn đạt theo góc người dùng chứ không bê nguyên tên kỹ thuật của BE.
export const NOTIFICATION_STATUS_LABELS: Record<
  NotificationStatusEnum,
  string
> = {
  [NotificationStatusEnum.Pending]: "Chờ gửi",
  [NotificationStatusEnum.Processing]: "Đang gửi",
  [NotificationStatusEnum.Sent]: "Đã gửi",
  [NotificationStatusEnum.Delivered]: "Đã tới thiết bị",
  [NotificationStatusEnum.Failed]: "Gửi lỗi",
  [NotificationStatusEnum.Read]: "Đã đọc",
  [NotificationStatusEnum.Opened]: "Đã mở",
};

export const notificationStatusLabel = (s: NotificationStatusEnum) =>
  NOTIFICATION_STATUS_LABELS[s] ?? `#${s}`;

// ── Sprint 6.4 — nhóm người nhận và lần gửi hàng loạt ────────────────────────────────────────

export const NOTIFICATION_GROUP_KIND_LABELS: Record<
  NotificationGroupKindEnum,
  string
> = {
  [NotificationGroupKindEnum.Static]: "Danh sách tự chọn",
  [NotificationGroupKindEnum.Role]: "Theo vai trò",
};

export const NOTIFICATION_BATCH_SOURCE_LABELS: Record<
  NotificationBatchSourceEnum,
  string
> = {
  [NotificationBatchSourceEnum.Event]: "Tự động từ sự kiện",
  [NotificationBatchSourceEnum.Manual]: "Người dùng gửi",
};

export const NOTIFICATION_BATCH_STATUS_LABELS: Record<
  NotificationBatchStatusEnum,
  string
> = {
  [NotificationBatchStatusEnum.Pending]: "Đang chờ",
  [NotificationBatchStatusEnum.FannedOut]: "Đã phát",
  [NotificationBatchStatusEnum.Failed]: "Thất bại",
};

export const notificationGroupKindLabel = (k: NotificationGroupKindEnum) =>
  NOTIFICATION_GROUP_KIND_LABELS[k] ?? `#${k}`;

export const notificationBatchSourceLabel = (s: NotificationBatchSourceEnum) =>
  NOTIFICATION_BATCH_SOURCE_LABELS[s] ?? `#${s}`;

export const notificationBatchStatusLabel = (s: NotificationBatchStatusEnum) =>
  NOTIFICATION_BATCH_STATUS_LABELS[s] ?? `#${s}`;
