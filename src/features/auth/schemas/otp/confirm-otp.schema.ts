import { z } from "zod";
import { otpField } from "@/shared/schemas/common.schema";

export const confirmOtpSchema = z.object({
  otp: otpField("OTP gồm 6 chữ số"),
});

export type ConfirmOtpFormValues = z.infer<typeof confirmOtpSchema>;
