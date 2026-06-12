import { z } from "zod";

export const upsertThresholdSchema = z
  .object({
    voltageMin: z.number().positive("Phải > 0"),
    voltageMax: z.number().positive("Phải > 0"),
    temperatureMin: z.number(),
    temperatureMax: z.number(),
    socWarningThreshold: z.number().min(0).max(100),
    socCriticalThreshold: z.number().min(0).max(100),
    currentMaxCharge: z.number().positive().optional(),
    currentMaxDischarge: z.number().positive().optional(),
    sohWarningThreshold: z.number().min(0).max(100).optional(),
    sohCriticalThreshold: z.number().min(0).max(100).optional(),
    effectiveFromUtc: z.string().optional(),
  })
  .refine((d) => d.voltageMax > d.voltageMin, {
    message: "voltageMax phải lớn hơn voltageMin",
    path: ["voltageMax"],
  })
  .refine((d) => d.temperatureMax > d.temperatureMin, {
    message: "temperatureMax phải lớn hơn temperatureMin",
    path: ["temperatureMax"],
  })
  .refine((d) => d.socCriticalThreshold < d.socWarningThreshold, {
    message: "socCritical phải nhỏ hơn socWarning",
    path: ["socCriticalThreshold"],
  })
  .refine(
    (d) =>
      d.sohWarningThreshold == null ||
      d.sohCriticalThreshold == null ||
      d.sohCriticalThreshold < d.sohWarningThreshold,
    {
      message: "sohCritical phải nhỏ hơn sohWarning",
      path: ["sohCriticalThreshold"],
    },
  );

export type UpsertThresholdFormValues = z.infer<typeof upsertThresholdSchema>;
