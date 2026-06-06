import { z } from "zod";

export const batteryAssetFormSchema = z.object({
  serialNumber: z
    .string()
    .min(5, "Tối thiểu 5 ký tự")
    .max(64)
    .regex(/^[A-Z0-9-]+$/, "Chỉ chứa A-Z, 0-9, dấu -"),
  batteryTypeId: z.string().uuid("UUID không hợp lệ"),
  customerId: z.string().uuid("UUID không hợp lệ"),
  siteId: z.string().uuid().optional().or(z.literal("")),
  batteryGroupId: z.string().uuid().optional().or(z.literal("")),
  installDate: z.string().min(1, "Bắt buộc"),
  warrantyEndDate: z.string().optional(),
  location: z.string().max(255).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type BatteryAssetFormValues = z.infer<typeof batteryAssetFormSchema>;

export const transferOwnerSchema = z.object({
  newCustomerId: z.string().uuid("Chọn khách hàng"),
  reason: z.string().max(500).optional(),
});

export type TransferOwnerFormValues = z.infer<typeof transferOwnerSchema>;
