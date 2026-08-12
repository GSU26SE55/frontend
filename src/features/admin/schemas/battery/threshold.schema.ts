import { z } from "zod";

export const upsertThresholdSchema = z
  .object({
    voltageMin: z.number().positive("Must be > 0"),
    voltageMax: z.number().positive("Must be > 0"),
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
    message: "voltageMax must be greater than voltageMin",
    path: ["voltageMax"],
  })
  .refine((d) => d.temperatureMax > d.temperatureMin, {
    message: "temperatureMax must be greater than temperatureMin",
    path: ["temperatureMax"],
  })
  .refine((d) => d.socCriticalThreshold < d.socWarningThreshold, {
    message: "socCritical must be less than socWarning",
    path: ["socCriticalThreshold"],
  })
  .refine(
    (d) =>
      d.sohWarningThreshold == null ||
      d.sohCriticalThreshold == null ||
      d.sohCriticalThreshold < d.sohWarningThreshold,
    {
      message: "sohCritical must be less than sohWarning",
      path: ["sohCriticalThreshold"],
    },
  );

export type UpsertThresholdFormValues = z.infer<typeof upsertThresholdSchema>;
