import { z } from "zod";
import {
  emailField,
  fullNameField,
  passwordField,
  phoneField,
} from "@/shared/schemas/common.schema";

export const registerSchema = z
  .object({
    fullName: fullNameField,
    email: emailField,
    phoneNumber: phoneField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
