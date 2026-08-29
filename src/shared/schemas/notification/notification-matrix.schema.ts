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

// The form keeps one row per category; only the changed rows are filtered out at
// submit time. Counted from the enum rather than hard-coded: the BE only requires at
// least one row, so a category added server-side used to make the whole form
// unsubmittable instead of simply showing the extra row.
const CATEGORY_COUNT = Object.keys(NotificationCategoryEnum).length;

export const notificationMatrixSchema = z.object({
  items: z.array(notificationCategoryRowSchema).length(CATEGORY_COUNT),
});

export type NotificationCategoryRowValues = z.infer<
  typeof notificationCategoryRowSchema
>;
export type NotificationMatrixFormValues = z.infer<
  typeof notificationMatrixSchema
>;
