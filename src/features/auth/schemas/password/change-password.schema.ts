import { z } from "zod";
import { passwordFieldBounded } from "@/shared/schemas/common.schema";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordFieldBounded,
    confirmPassword: z.string(),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
