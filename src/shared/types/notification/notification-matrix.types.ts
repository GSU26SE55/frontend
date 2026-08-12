// Notification preference matrix, category × channel (Sprint 6.3 NOTI3-04).
// Shape matches the BE: NotificationService DTOs/Response/Preference/NotificationPreferenceMatrixDto.cs
import type { NotificationCategoryEnum } from "@/shared/enums/notification/notification.enum";
export { NotificationCategoryEnum } from "@/shared/enums/notification/notification.enum";
import type { NotificationPreferenceDto } from "@/shared/types/notification/notification-preference.types";

// One category row in the matrix. isCustomized = false ⇒ the four channel values are
// inherited from the global switches (channels); the user has not set them explicitly.
export interface NotificationCategoryPreferenceDto {
  category: NotificationCategoryEnum;
  categoryName: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  isCustomized: boolean;
}

// GET /api/notification-preferences/matrix — categories ALWAYS has all 6 entries,
// sorted by enum 1→6.
export interface NotificationPreferenceMatrixDto {
  channels: NotificationPreferenceDto; // global switches — still win over every category row
  categories: NotificationCategoryPreferenceDto[];
}

// PUT /api/notification-preferences/matrix — PATCH ROW BY ROW: send only the categories
// being changed, but every row must carry all 4 channels (the BE reads a missing field as
// false rather than keeping the previous value).
export interface NotificationCategoryPreferenceItem {
  category: NotificationCategoryEnum;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
}
export interface UpdateNotificationMatrixPayload {
  items: NotificationCategoryPreferenceItem[];
}

// GET /api/notification-preferences/categories — lookup table, type → category.
// Take the entry count from the BE (NotificationCategoryMap.All), do NOT hardcode it.
export interface NotificationCategoryMapDto {
  type: string;
  typeValue: number;
  category: string;
  categoryValue: number;
}
