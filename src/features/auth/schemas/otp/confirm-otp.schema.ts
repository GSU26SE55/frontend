import { z } from "zod";
import { otpField } from "@/shared/schemas/common.schema";

export const confirmOtpSchema = z.object({
  otp: otpField("OTP must be 6 digits"),
});

export type ConfirmOtpFormValues = z.infer<typeof confirmOtpSchema>;
