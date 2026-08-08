import { z } from "zod";

export const createGatewayDeviceSchema = z.object({
  deviceName: z
    .string()
    .trim()
    .min(1, "Required")
    .max(64, "Must be at most 64 characters"),
  deviceCode: z
    .string()
    .trim()
    .min(1, "Required")
    .max(64, "Must be at most 64 characters"),
  dailyLimit: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .max(10000, "Must be at most 10000"),
});

export type CreateGatewayDeviceFormValues = z.infer<
  typeof createGatewayDeviceSchema
>;
