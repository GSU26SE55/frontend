import { z } from "zod";

export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .email("Email không hợp lệ")
    .max(256, "Email tối đa 256 ký tự"),
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
});

export type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;
