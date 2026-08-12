import { z } from "zod";
import { NotificationCategoryEnum } from "@/shared/enums/notification/notification.enum";

// One category row — the BE requires all 4 channels in every row: leaving a
// channel out writes it as false rather than KEEPING the old value (patching is
// per row, not per channel cell).
export const notificationCategoryRowSchema = z.object({
  category: z.nativeEnum(NotificationCategoryEnum),
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

// The form keeps all 6 rows (the BE always returns 6); only the changed rows
// are filtered out at submit time.
export const notificationMatrixSchema = z.object({
  items: z.array(notificationCategoryRowSchema).length(6),
});

export type NotificationCategoryRowValues = z.infer<
  typeof notificationCategoryRowSchema
>;
export type NotificationMatrixFormValues = z.infer<
  typeof notificationMatrixSchema
>;
