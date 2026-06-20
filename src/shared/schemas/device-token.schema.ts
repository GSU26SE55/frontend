import { z } from "zod";
import { DevicePlatformEnum } from "@/shared/enums/notification.enum";

export const registerDeviceTokenSchema = z.object({
  token: z
    .string()
    .min(1, "Token không được trống")
    .max(500, "Token tối đa 500 ký tự"),
  platform: z.nativeEnum(DevicePlatformEnum),
  deviceInfo: z.string().max(500, "Tối đa 500 ký tự").optional(),
});

export type RegisterDeviceTokenFormValues = z.infer<
  typeof registerDeviceTokenSchema
>;
