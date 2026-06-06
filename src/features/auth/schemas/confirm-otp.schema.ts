import { z } from "zod";

export const confirmOtpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP gồm 6 chữ số")
    .regex(/^\d{6}$/, "OTP chỉ gồm chữ số"),
});

export type ConfirmOtpFormValues = z.infer<typeof confirmOtpSchema>;
