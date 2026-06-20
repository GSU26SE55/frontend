import { z } from "zod";

// #AUTH-50 bước 1 — submit email account đã soft-delete
export const reactivateRequestSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .max(256, "Email tối đa 256 ký tự"),
});
export type ReactivateRequestFormValues = z.infer<
  typeof reactivateRequestSchema
>;

// #AUTH-50 bước 2 — submit email + OTP 6 số
export const reactivateVerifySchema = z.object({
  email: z.string().email("Email không hợp lệ").max(256),
  otp: z
    .string()
    .length(6, "OTP gồm 6 chữ số")
    .regex(/^\d{6}$/, "OTP chỉ gồm chữ số"),
});
export type ReactivateVerifyFormValues = z.infer<typeof reactivateVerifySchema>;
