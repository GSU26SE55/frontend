import { z } from "zod";
import {
  emailField,
  otpField,
  passwordField,
} from "@/shared/schemas/common.schema";

export const forgotPasswordStep1Schema = z.object({
  email: emailField,
});

export const forgotPasswordStep2Schema = z.object({
  otp: otpField("OTP phải đúng 6 chữ số"),
});

export const forgotPasswordStep3Schema = z
  .object({
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export type ForgotPasswordStep1Values = z.infer<
  typeof forgotPasswordStep1Schema
>;
export type ForgotPasswordStep2Values = z.infer<
  typeof forgotPasswordStep2Schema
>;
export type ForgotPasswordStep3Values = z.infer<
  typeof forgotPasswordStep3Schema
>;
