import { z } from "zod";

// Form dùng input string (giống site form) — convert sang number khi submit.
// Tất cả threshold field nullable: bỏ trống = không monitor metric đó.
export const ambientThresholdSchema = z
  .object({
    siteId: z.string().uuid("Chọn site hợp lệ"),
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
          message: "Số không hợp lệ",
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
        message: "Phải ≥ ngưỡng cảnh báo",
      });
    }

    const humWarn = num(data.highHumidityWarning);
    const humCrit = num(data.highHumidityCritical);
    if (humWarn !== undefined && humCrit !== undefined && humCrit < humWarn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highHumidityCritical"],
        message: "Phải ≥ ngưỡng cảnh báo",
      });
    }
  });

export type AmbientThresholdFormValues = z.infer<typeof ambientThresholdSchema>;
