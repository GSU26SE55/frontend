import { z } from "zod";

// GH-133 C4 — Admin sửa/xóa chat trên ticket đã Closed. BE bắt buộc overrideReason.
export const chatOverrideEditSchema = z.object({
  body: z.string().trim().min(1, "Nội dung không được để trống"),
  overrideReason: z.string().trim().min(1, "Lý do override là bắt buộc"),
});
export type ChatOverrideEditPayload = z.infer<typeof chatOverrideEditSchema>;

export const chatOverrideDeleteSchema = z.object({
  overrideReason: z.string().trim().min(1, "Lý do override là bắt buộc"),
});
export type ChatOverrideDeletePayload = z.infer<
  typeof chatOverrideDeleteSchema
>;
