import { z } from "zod";

const chemistrySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(99),
]);

export const createBatteryTypeSchema = z.object({
  name: z.string().min(1, "Bắt buộc").max(100),
  manufacturer: z.string().max(100).optional(),
  nominalCapacityAh: z.number().positive("Phải > 0"),
  nominalVoltage: z.number().positive("Phải > 0"),
  chemistry: chemistrySchema.optional(),
  maxCycleCount: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});

export const updateBatteryTypeSchema = createBatteryTypeSchema.extend({
  name: z.string().min(1, "Bắt buộc").max(100),
  nominalCapacityAh: z.number().positive("Phải > 0"),
  nominalVoltage: z.number().positive("Phải > 0"),
});

export type CreateBatteryTypeFormValues = z.infer<
  typeof createBatteryTypeSchema
>;
export type UpdateBatteryTypeFormValues = z.infer<
  typeof updateBatteryTypeSchema
>;
