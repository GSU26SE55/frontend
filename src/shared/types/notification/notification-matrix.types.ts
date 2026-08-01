// Ma trận tuỳ chọn thông báo theo nhóm × kênh (Sprint 6.3 NOTI3-04).
// Shape khớp BE: NotificationService DTOs/Response/Preference/NotificationPreferenceMatrixDto.cs
import type { NotificationCategoryEnum } from "@/shared/enums/notification/notification.enum";
export { NotificationCategoryEnum } from "@/shared/enums/notification/notification.enum";
import type { NotificationPreferenceDto } from "@/shared/types/notification/notification-preference.types";

// 1 dòng nhóm trong ma trận. isCustomized = false ⇒ 4 giá trị kênh là kế thừa từ
// công tắc toàn cục (channels), user chưa đặt tường minh.
export interface NotificationCategoryPreferenceDto {
  category: NotificationCategoryEnum;
  categoryName: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  isCustomized: boolean;
}

// GET /api/notification-preferences/matrix — categories LUÔN đủ 6 phần tử, sort theo enum 1→6.
export interface NotificationPreferenceMatrixDto {
  channels: NotificationPreferenceDto; // công tắc toàn cục — vẫn thắng mọi dòng nhóm
  categories: NotificationCategoryPreferenceDto[];
}

// PUT /api/notification-preferences/matrix — VÁ TỪNG DÒNG: chỉ gửi nhóm cần đổi,
// nhưng mỗi dòng phải đủ 4 kênh (BE nhận thiếu field = false, không giữ giá trị cũ).
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

// GET /api/notification-preferences/categories — bảng tra cứu type → nhóm.
// Số phần tử lấy theo BE (NotificationCategoryMap.All), KHÔNG hardcode.
export interface NotificationCategoryMapDto {
  type: string;
  typeValue: number;
  category: string;
  categoryValue: number;
}
