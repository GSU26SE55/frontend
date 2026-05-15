import { z } from 'zod';

export const otpVerifySchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP phải đúng 6 chữ số')
    .regex(/^\d{6}$/, 'OTP chỉ gồm chữ số'),
});

export type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;
