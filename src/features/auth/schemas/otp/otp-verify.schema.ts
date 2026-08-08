import { z } from "zod";
import { otpField } from "@/shared/schemas/common.schema";

export const otpVerifySchema = z.object({
  otp: otpField("OTP must be exactly 6 digits"),
});

export type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;
