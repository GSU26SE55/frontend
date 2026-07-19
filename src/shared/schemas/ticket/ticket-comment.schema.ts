import { z } from "zod";

// Attachment input dùng chung cho comment và maintenance log (cùng shape).
export const attachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
});

export const addCommentSchema = z.object({
  // Không validate rỗng — UI disable nút gửi khi rỗng thay vì báo lỗi.
  body: z.string(),
  isInternal: z.boolean(),
  attachments: z.array(attachmentSchema).optional(),
});
export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
