import { z } from "zod";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";

export const createNotificationSchema = z.object({
  userId: z.string().uuid("UserId phải là UUID hợp lệ"),
  type: z.nativeEnum(NotificationTypeEnum),
  channel: z.nativeEnum(NotificationChannelEnum),
  title: z
    .string()
    .trim()
    .min(1, "Title không được trống")
    .max(200, "Title tối đa 200 ký tự"),
  body: z
    .string()
    .trim()
    .min(1, "Body không được trống")
    .max(2000, "Body tối đa 2000 ký tự"),
  entityType: z.string().max(100, "EntityType tối đa 100 ký tự").optional(),
  bypassQuietHours: z.boolean().optional(),
});

export type CreateNotificationFormValues = z.infer<
  typeof createNotificationSchema
>;
