import { z } from "zod";
import { requiredNumber } from "@/shared/schemas/common.schema";

const chemistrySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(99),
]);

export const createBatteryTypeSchema = z.object({
  name: z.string().min(1, "Required").max(100),
  manufacturer: z.string().max(100).optional(),
  // register(..., { valueAsNumber: true }) biến ô rỗng thành NaN, nên z.number() trần
  // báo "expected number, received NaN" — requiredNumber trả lại câu người dùng đọc được.
  nominalCapacityAh: requiredNumber(
    z.number().positive("Must be greater than 0"),
  ),
  nominalVoltage: requiredNumber(z.number().positive("Must be greater than 0")),
  chemistry: chemistrySchema.optional(),
  maxCycleCount: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});

// Update dùng đúng luật của create — trước đây khai lại y hệt 3 field, và bản sao đó
// không được sửa cùng lúc là hai form lệch nhau ngay.
export const updateBatteryTypeSchema = createBatteryTypeSchema;

export type CreateBatteryTypeFormValues = z.infer<
  typeof createBatteryTypeSchema
>;
export type UpdateBatteryTypeFormValues = z.infer<
  typeof updateBatteryTypeSchema
>;
