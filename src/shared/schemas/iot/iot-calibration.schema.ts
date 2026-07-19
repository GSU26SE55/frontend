import { z } from "zod";

// Cross-feature (admin device detail + staff page) → đặt ở shared/schemas.
export const createCalibrationSchema = z
  .object({
    channel: z.string().min(1, "Bắt buộc").max(32, "Tối đa 32 ký tự"),
    batteryAssetId: z.string().uuid().optional(),
    scale: z
      .number({ message: "Bắt buộc" })
      .refine((v) => v !== 0, "Scale phải khác 0"),
    offset: z.number({ message: "Bắt buộc" }),
    unit: z.string().min(1, "Bắt buộc").max(16, "Tối đa 16 ký tự"),
    calibratedAt: z.string().min(1, "Bắt buộc"),
    expiresAt: z.string().optional(),
    notes: z.string().max(500, "Tối đa 500 ký tự").optional(),
  })
  .refine(
    (d) => !d.expiresAt || new Date(d.expiresAt) > new Date(d.calibratedAt),
    { message: "Ngày hết hạn phải sau ngày calibration", path: ["expiresAt"] },
  );

export type CreateCalibrationForm = z.infer<typeof createCalibrationSchema>;
