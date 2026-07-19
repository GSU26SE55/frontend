// Notification preference của user (1-1 với Account).
// Shape khớp BE: NotificationService DTOs/Response/Preference/NotificationPreferenceDto.cs
export interface NotificationPreferenceDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart?: string | null; // "HH:mm" | null = không quiet hours
  quietHoursEnd?: string | null; // "HH:mm" | null
  timeZone: string; // IANA, vd "Asia/Ho_Chi_Minh"
}

// PUT /api/notification-preferences — body (KHÔNG gửi userId, BE lấy từ JWT claim)
export type UpdateNotificationPreferencePayload = NotificationPreferenceDto;
