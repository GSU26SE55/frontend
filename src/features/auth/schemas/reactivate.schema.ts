import { z } from "zod";
import {
  emailField,
  emailFieldMax,
  otpField,
} from "@/shared/schemas/common.schema";

// #AUTH-50 bước 1 — submit email account đã soft-delete
export const reactivateRequestSchema = z.object({
  email: emailFieldMax(256),
});
export type ReactivateRequestFormValues = z.infer<
  typeof reactivateRequestSchema
>;

// #AUTH-50 bước 2 — submit email + OTP 6 số
export const reactivateVerifySchema = z.object({
  email: emailField.max(256),
  otp: otpField("OTP gồm 6 chữ số"),
});
export type ReactivateVerifyFormValues = z.infer<typeof reactivateVerifySchema>;
