import { z } from "zod";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";

export const createNotificationSchema = z.object({
  userId: z.string().uuid("UserId must be a valid UUID"),
  type: z.nativeEnum(NotificationTypeEnum),
  channel: z.nativeEnum(NotificationChannelEnum),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  body: z
    .string()
    .trim()
    .min(1, "Body is required")
    .max(2000, "Body must be at most 2000 characters"),
  entityType: z
    .string()
    .max(100, "EntityType must be at most 100 characters")
    .optional(),
  bypassQuietHours: z.boolean().optional(),
});

export type CreateNotificationFormValues = z.infer<
  typeof createNotificationSchema
>;
