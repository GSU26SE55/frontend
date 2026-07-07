import { z } from "zod";

// "HH:mm" 24h — khớp BE TimeOnly.TryParseExact(x, "HH:mm")
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const notificationPreferenceSchema = z
  .object({
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    smsEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    quietHoursStart: z
      .string()
      .regex(HHMM, "Định dạng phải là HH:mm")
      .nullable(),
    quietHoursEnd: z.string().regex(HHMM, "Định dạng phải là HH:mm").nullable(),
    timeZone: z
      .string()
      .min(1, "TimeZone không được trống")
      .max(100, "TimeZone tối đa 100 ký tự"),
  })
  // BE validate quiet hours độc lập (không cross-field) → enforce cặp ở FE.
  .refine((v) => (v.quietHoursStart == null) === (v.quietHoursEnd == null), {
    message: "Phải nhập cả giờ bắt đầu và kết thúc, hoặc bỏ trống cả hai",
    path: ["quietHoursEnd"],
  });

export type NotificationPreferenceFormValues = z.infer<
  typeof notificationPreferenceSchema
>;
