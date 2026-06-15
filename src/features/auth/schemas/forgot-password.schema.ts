import { z } from "zod";

export const forgotPasswordStep1Schema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const forgotPasswordStep2Schema = z.object({
  otp: z
    .string()
    .length(6, "OTP phải đúng 6 chữ số")
    .regex(/^\d{6}$/, "OTP chỉ gồm chữ số"),
});

export const forgotPasswordStep3Schema = z
  .object({
    newPassword: z
      .string()
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
        "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
      ),
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
