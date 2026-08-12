import { z } from "zod";

// "HH:mm" 24h — matches BE TimeOnly.TryParseExact(x, "HH:mm")
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const notificationPreferenceSchema = z
  .object({
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    smsEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    quietHoursStart: z.string().regex(HHMM, "Format must be HH:mm").nullable(),
    quietHoursEnd: z.string().regex(HHMM, "Format must be HH:mm").nullable(),
    timeZone: z
      .string()
      .min(1, "TimeZone is required")
      .max(100, "TimeZone must be at most 100 characters"),
  })
  // The BE validates quiet hours independently (no cross-field check) → the FE
  // enforces the pair.
  .refine((v) => (v.quietHoursStart == null) === (v.quietHoursEnd == null), {
    message: "Enter both a start and an end time, or leave both blank",
    path: ["quietHoursEnd"],
  });

export type NotificationPreferenceFormValues = z.infer<
  typeof notificationPreferenceSchema
>;
