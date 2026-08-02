import { z } from "zod";
import { NotificationCategoryEnum } from "@/shared/enums/notification/notification.enum";

// 1 dòng nhóm — BE bắt buộc đủ 4 kênh trong mỗi dòng: bỏ trống 1 kênh sẽ được ghi
// thành false chứ KHÔNG giữ giá trị cũ ("vá theo nhóm", không vá theo từng ô kênh).
export const notificationCategoryRowSchema = z.object({
  category: z.nativeEnum(NotificationCategoryEnum),
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

// Form giữ đủ 6 dòng (BE luôn trả 6); lúc submit mới lọc ra dòng đã đổi.
export const notificationMatrixSchema = z.object({
  items: z.array(notificationCategoryRowSchema).length(6),
});

export type NotificationCategoryRowValues = z.infer<
  typeof notificationCategoryRowSchema
>;
export type NotificationMatrixFormValues = z.infer<
  typeof notificationMatrixSchema
>;
