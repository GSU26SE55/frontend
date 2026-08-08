import { z } from "zod";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import {
  GROUP_NAME_MAX,
  GROUP_DESCRIPTION_MAX,
  BROADCAST_TITLE_MAX,
  BROADCAST_BODY_MAX,
} from "@/features/admin/types/notification/notification-group.types";

// Length limits match the DB columns and the BE's ValidateAsync — checked on the FE so errors show
// while typing, but the BE still re-checks since any client could skip this layer.
export const notificationGroupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(
      GROUP_NAME_MAX,
      `Group name must be at most ${GROUP_NAME_MAX} characters`,
    ),
  description: z
    .string()
    .trim()
    .max(
      GROUP_DESCRIPTION_MAX,
      `Description must be at most ${GROUP_DESCRIPTION_MAX} characters`,
    )
    .optional(),
});

export type NotificationGroupFormValues = z.infer<
  typeof notificationGroupFormSchema
>;

// Bulk send. Does NOT check "does the group have anyone" here — recipient count depends on account
// status at send time, which only the backend knows; it returns 400 with a specific reason when the set is empty.
export const broadcastFormSchema = z
  .object({
    // Zod v4: the second parameter takes `{ message }`, no more `errorMap` like in v3.
    type: z.nativeEnum(NotificationTypeEnum, {
      message: "Select a notification type",
    }),
    channels: z
      .array(z.nativeEnum(NotificationChannelEnum))
      .min(1, "Select at least one channel"),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(
        BROADCAST_TITLE_MAX,
        `Title must be at most ${BROADCAST_TITLE_MAX} characters`,
      ),
    body: z
      .string()
      .trim()
      .min(1, "Body is required")
      .max(
        BROADCAST_BODY_MAX,
        `Body must be at most ${BROADCAST_BODY_MAX} characters`,
      ),
    groupIds: z.array(z.string()),
    userIds: z.array(z.string()),
    // 03/08/2026 — render content through a notification template instead of using title/body directly.
    useTemplate: z.boolean(),
    // Template variable values. Key is the variable name, value is what the admin typed; blank fields are
    // stripped when building the payload so that variable renders empty — matching what actually gets sent.
    templateVars: z.record(z.string(), z.string()),
  })
  // Must select at least one group OR one user. Attach the error to `groupIds` so it shows right under the
  // group picker — a form-level error would be misplaced and users wouldn't know what to fix.
  .refine((v) => v.groupIds.length > 0 || v.userIds.length > 0, {
    message: "Select at least one group or recipient",
    path: ["groupIds"],
  });

export type BroadcastFormValues = z.infer<typeof broadcastFormSchema>;
