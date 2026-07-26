import { z } from "zod";
import { passwordField } from "@/shared/schemas/common.schema";

export const acceptInviteSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });
