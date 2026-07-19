import { z } from "zod";
import { emailFieldMax } from "@/shared/schemas/common.schema";

export const changeEmailSchema = z.object({
  newEmail: emailFieldMax(256),
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
});

export type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;
