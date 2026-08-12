import { z } from "zod";

// Cross-feature (admin device detail + staff page) → lives in shared/schemas.
export const createCalibrationSchema = z
  .object({
    channel: z
      .string()
      .min(1, "Required")
      .max(32, "Must be at most 32 characters"),
    batteryAssetId: z.string().uuid().optional(),
    scale: z
      .number({ message: "Required" })
      .refine((v) => v !== 0, "Scale must not be 0"),
    offset: z.number({ message: "Required" }),
    unit: z
      .string()
      .min(1, "Required")
      .max(16, "Must be at most 16 characters"),
    calibratedAt: z.string().min(1, "Required"),
    expiresAt: z.string().optional(),
    notes: z.string().max(500, "Must be at most 500 characters").optional(),
  })
  .refine(
    (d) => !d.expiresAt || new Date(d.expiresAt) > new Date(d.calibratedAt),
    {
      message: "Expiry date must be after the calibration date",
      path: ["expiresAt"],
    },
  );

export type CreateCalibrationForm = z.infer<typeof createCalibrationSchema>;
