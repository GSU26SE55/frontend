// A user's notification preferences (1-1 with Account).
// Shape matches the BE: NotificationService DTOs/Response/Preference/NotificationPreferenceDto.cs
export interface NotificationPreferenceDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart?: string | null; // "HH:mm" | null = no quiet hours
  quietHoursEnd?: string | null; // "HH:mm" | null
  timeZone: string; // IANA, e.g. "Asia/Ho_Chi_Minh"
}

// PUT /api/notification-preferences — body (do NOT send userId; the BE reads it
// from the JWT claim)
export type UpdateNotificationPreferencePayload = NotificationPreferenceDto;
