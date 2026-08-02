import { z } from "zod";

// Attachment input dùng chung cho comment và maintenance log (cùng shape).
export const attachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
});

// @-mention: mỗi người được tag → { userId, displayName }. Khớp BE ChatMentionInput
// (POST /chats field `mentions`). FE build từ danh sách tác giả trong hội thoại.
export const mentionInputSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
});

export const addCommentSchema = z.object({
  // Không validate rỗng — UI disable nút gửi khi rỗng thay vì báo lỗi.
  body: z.string(),
  isInternal: z.boolean(),
  attachments: z.array(attachmentSchema).optional(),
  mentions: z.array(mentionInputSchema).optional(),
});
export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
export type MentionInput = z.infer<typeof mentionInputSchema>;
