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
  // Cross-field bounds, reported on the SECOND field of each pair only. Printing the
  // same sentence under both halves put two identical red paragraphs side by side, which
  // reads as two separate problems; the dialog instead paints the partner input red
  // without repeating the text (see PAIRED_FIELDS in ThresholdConfigDialog).
  // Wording names the fields as the form labels them ("Maximum voltage"), not as the
  // payload spells them ("voltageMax") — that matches nothing on screen.
  .superRefine((d, ctx) => {
    if (d.voltageMax <= d.voltageMin) {
      const message = "Maximum voltage must be greater than minimum voltage";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ["voltageMax"],
      });
    }

    if (d.temperatureMax <= d.temperatureMin) {
      const message =
        "Maximum temperature must be greater than minimum temperature";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ["temperatureMax"],
      });
    }

    // Critical is the harsher alarm, so it must trip at a LOWER charge than the warning:
    // warn at 30%, alarm at 15%. Equal values would fire both alerts at once.
    if (d.socCriticalThreshold >= d.socWarningThreshold) {
      const message = "SOC Critical must be less than SOC Warning";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ["socCriticalThreshold"],
      });
    }

    // Both optional — only compare once the pair is actually filled in.
    if (
      d.sohWarningThreshold != null &&
      d.sohCriticalThreshold != null &&
      d.sohCriticalThreshold >= d.sohWarningThreshold
    ) {
      const message = "SOH Critical must be less than SOH Warning";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ["sohCriticalThreshold"],
      });
    }

    // Charge and discharge ceilings are independent of each other, but a value of 0 is
    // not a ceiling at all — `.positive()` already rejects it, so nothing to add here.
  });

export type UpsertThresholdFormValues = z.infer<typeof upsertThresholdSchema>;
