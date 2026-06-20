import { z } from "zod";

export const createGatewayDeviceSchema = z.object({
  deviceName: z.string().trim().min(1, "Bắt buộc").max(64, "Tối đa 64 ký tự"),
  deviceCode: z.string().trim().min(1, "Bắt buộc").max(64, "Tối đa 64 ký tự"),
  dailyLimit: z
    .number()
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu 1")
    .max(10000, "Tối đa 10000"),
});

export type CreateGatewayDeviceFormValues = z.infer<
  typeof createGatewayDeviceSchema
>;
