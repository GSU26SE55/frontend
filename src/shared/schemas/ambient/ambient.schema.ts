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

    // Range per metric. Neither side checked these before — the BE
    // (UpsertAmbientThresholdConfigCommand) validates only SiteId and the
    // critical/warning ordering — so "500" in a field the form labels "(%)" was
    // written straight to AmbientThresholdConfig, leaving a threshold that can never
    // trip. Humidity is a percentage; the temperature range is wide enough for any
    // real site while still rejecting a typo of the wrong magnitude.
    const RANGES: Record<
      (typeof numericFields)[number],
      { min: number; max: number; unit: string }
    > = {
      highAmbientTempWarning: { min: -50, max: 150, unit: "°C" },
      highAmbientTempCritical: { min: -50, max: 150, unit: "°C" },
      highHumidityWarning: { min: 0, max: 100, unit: "%" },
      highHumidityCritical: { min: 0, max: 100, unit: "%" },
      comboTempThreshold: { min: -50, max: 150, unit: "°C" },
      comboHumidityThreshold: { min: 0, max: 100, unit: "%" },
    };

    for (const field of numericFields) {
      const raw = data[field];
      if (!raw || raw.trim() === "") continue;

      const value = Number(raw);
      if (Number.isNaN(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: "Invalid number",
        });
        continue;
      }

      const { min, max, unit } = RANGES[field];
      if (value < min || value > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `Must be between ${min} and ${max} ${unit}`,
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
