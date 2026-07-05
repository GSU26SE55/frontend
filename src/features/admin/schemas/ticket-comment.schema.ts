import { z } from "zod";

const commentAttachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
});

export const addCommentSchema = z.object({
  body: z.string().min(1, "Nội dung bình luận không được để trống"),
  isInternal: z.boolean(),
  attachments: z.array(commentAttachmentSchema).optional(),
});
export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
