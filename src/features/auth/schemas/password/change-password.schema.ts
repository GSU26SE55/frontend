import { z } from "zod";
import { passwordFieldBounded } from "@/shared/schemas/common.schema";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordFieldBounded,
    confirmPassword: z.string(),
  })
  .superRefine(({ currentPassword, newPassword, confirmPassword }, ctx) => {
    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }

    // ChangePasswordCommand rejects this with a 422. Without the rule here the user
    // only finds out after submitting, having typed the same password three times.
    if (currentPassword && newPassword && currentPassword === newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be different from the current password",
        path: ["newPassword"],
      });
    }
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
