import { z } from "zod";
import { DevicePlatformEnum } from "@/shared/enums/notification/notification.enum";

export const registerDeviceTokenSchema = z.object({
  token: z
    .string()
    .min(1, "Token is required")
    .max(500, "Token must be at most 500 characters"),
  platform: z.nativeEnum(DevicePlatformEnum),
  deviceInfo: z.string().max(500, "Must be at most 500 characters").optional(),
});

export type RegisterDeviceTokenFormValues = z.infer<
  typeof registerDeviceTokenSchema
>;
