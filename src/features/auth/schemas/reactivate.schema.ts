import { z } from "zod";
import {
  emailField,
  emailFieldMax,
  otpField,
} from "@/shared/schemas/common.schema";

// #AUTH-50 step 1 — submit the email of a soft-deleted account
export const reactivateRequestSchema = z.object({
  email: emailFieldMax(256),
});
export type ReactivateRequestFormValues = z.infer<
  typeof reactivateRequestSchema
>;

// #AUTH-50 step 2 — submit email + 6-digit OTP
export const reactivateVerifySchema = z.object({
  email: emailField.max(256),
  otp: otpField("OTP must be 6 digits"),
});
export type ReactivateVerifyFormValues = z.infer<typeof reactivateVerifySchema>;
