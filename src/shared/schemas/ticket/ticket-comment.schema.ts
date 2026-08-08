import { z } from "zod";

// Attachment input shared by comments and maintenance logs (same shape).
export const attachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
});

// @-mention: each tagged person → { userId, displayName }. Matches BE
// ChatMentionInput (POST /chats field `mentions`). The FE builds it from the
// list of authors in the conversation.
export const mentionInputSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
});

export const addCommentSchema = z.object({
  // No empty check — the UI disables the send button when empty instead of
  // showing an error.
  body: z.string(),
  isInternal: z.boolean(),
  attachments: z.array(attachmentSchema).optional(),
  mentions: z.array(mentionInputSchema).optional(),
});
export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
export type MentionInput = z.infer<typeof mentionInputSchema>;
