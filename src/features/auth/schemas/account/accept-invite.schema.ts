import { z } from "zod";
import { passwordField } from "@/shared/schemas/common.schema";

export const acceptInviteSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
