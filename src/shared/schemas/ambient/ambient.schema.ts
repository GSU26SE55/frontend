import { z } from "zod";

// The form uses string inputs (like the site form) — converted to numbers
// on submit. Every threshold field is nullable: leaving one blank means that
// metric is not monitored.
export const ambientThresholdSchema = z
  .object({
    siteId: z.string().uuid("Select a valid site"),
    highAmbientTempWarning: z.string().optional(),
    highAmbientTempCritical: z.string().optional(),
    highHumidityWarning: z.string().optional(),
    highHumidityCritical: z.string().optional(),
    comboTempThreshold: z.string().optional(),
    comboHumidityThreshold: z.string().optional(),
    enabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const num = (s?: string) => (s && s.trim() !== "" ? Number(s) : undefined);

    const numericFields = [
      "highAmbientTempWarning",
      "highAmbientTempCritical",
      "highHumidityWarning",
      "highHumidityCritical",
      "comboTempThreshold",
      "comboHumidityThreshold",
    ] as const;

    for (const field of numericFields) {
      const raw = data[field];
      if (raw && raw.trim() !== "" && Number.isNaN(Number(raw))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: "Invalid number",
        });
      }
    }

    const tempWarn = num(data.highAmbientTempWarning);
    const tempCrit = num(data.highAmbientTempCritical);
    if (
      tempWarn !== undefined &&
      tempCrit !== undefined &&
      tempCrit < tempWarn
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highAmbientTempCritical"],
        message: "Must be ≥ the warning threshold",
      });
    }

    const humWarn = num(data.highHumidityWarning);
    const humCrit = num(data.highHumidityCritical);
    if (humWarn !== undefined && humCrit !== undefined && humCrit < humWarn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highHumidityCritical"],
        message: "Must be ≥ the warning threshold",
      });
    }

    // The combo rule is only active when BOTH thresholds are set (temperature +
    // humidity). Blocks a half-configured combo (only 1 field) — the BE ignores
    // it, but it is easy to misread.
    const comboTemp = num(data.comboTempThreshold);
    const comboHum = num(data.comboHumidityThreshold);
    if ((comboTemp === undefined) !== (comboHum === undefined)) {
      const missing =
        comboTemp === undefined
          ? "comboTempThreshold"
          : "comboHumidityThreshold";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [missing],
        message: "Combo rule needs both temperature and humidity thresholds",
      });
    }
  });

export type AmbientThresholdFormValues = z.infer<typeof ambientThresholdSchema>;
