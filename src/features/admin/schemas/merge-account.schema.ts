import { z } from "zod";

// #AUTH-47 — Admin merge: secondary account id (Guid) + reason (1–1000).
// Khớp validation BE MergeAccountCommand.
export const mergeAccountSchema = z.object({
  secondaryAccountId: z.string().uuid("Chọn tài khoản hợp lệ để gộp"),
  reason: z
    .string()
    .min(1, "Lý do là bắt buộc (phục vụ audit)")
    .max(1000, "Lý do tối đa 1000 ký tự"),
});
export type MergeAccountFormValues = z.infer<typeof mergeAccountSchema>;
