import { z } from "zod";
import { otpField } from "@/shared/schemas/common.schema";

export const otpVerifySchema = z.object({
  otp: otpField("OTP phải đúng 6 chữ số"),
});

export type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;
