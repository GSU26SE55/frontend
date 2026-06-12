import { z } from "zod";

export const resolveIncidentSchema = z.object({
  resolutionNote: z
    .string()
    .trim()
    .min(5, "Tối thiểu 5 ký tự")
    .max(2000, "Tối đa 2000 ký tự"),
});
export type ResolveIncidentFormValues = z.infer<typeof resolveIncidentSchema>;

export const falseAlarmSchema = z.object({
  falseAlarmReason: z
    .string()
    .trim()
    .min(5, "Tối thiểu 5 ký tự")
    .max(2000, "Tối đa 2000 ký tự"),
});
export type FalseAlarmFormValues = z.infer<typeof falseAlarmSchema>;
