import { z } from "zod";

export const createBatteryGroupSchema = z.object({
  siteId: z.string().uuid("UUID không hợp lệ"),
  name: z.string().min(1, "Bắt buộc").max(100),
  batteryTypeId: z.string().uuid("UUID không hợp lệ"),
});

export const updateBatteryGroupSchema = createBatteryGroupSchema;

export type CreateBatteryGroupFormValues = z.infer<
  typeof createBatteryGroupSchema
>;
export type UpdateBatteryGroupFormValues = z.infer<
  typeof updateBatteryGroupSchema
>;
