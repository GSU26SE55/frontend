import { z } from "zod";

/** ChatAddCommand caps the body at ChatOptions.MaxBodyLengthDefault. */
export const COMMENT_MAX_LENGTH = 10000;

/**
 * Whitespace/emoji-only bodies are rejected by the BE (ChatAddCommand
 * WhitespaceOrEmojiOnlyRegex). Mirrored here so the send button does not post a
 * comment that comes straight back as a 400.
 */
// The BE spells the emoji block as raw UTF-16 surrogate ranges (\uD83C-\uDBFF etc.), which
// JS reads as lone surrogates rather than code points — hence the `u` flag and the
// code-point range \u{1F000}-\u{1FAFF} covering the same characters.
const WHITESPACE_OR_EMOJI_ONLY =
  /^(?:[\s\u2190-\u21FF\u2600-\u27BF\u2B00-\u2BFF\u{1F000}-\u{1FAFF}]|\uFE0F|\u200D)*$/u;

// Attachment input shared by comments and maintenance logs (same shape).
// fileName/contentType are required by the BE (ChatAddCommand validates each
// attachment) — the upload hook fills them in, so a missing one is a bug worth
// catching here rather than as a 400 on Attachments[i].FileName, a field path
// with no control on screen.
export const attachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
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
  // showing an error. The two rules below both mirror the BE.
  body: z
    .string()
    .max(
      COMMENT_MAX_LENGTH,
      `Comment must be at most ${COMMENT_MAX_LENGTH} characters`,
    )
    .refine(
      (v) => v === "" || !WHITESPACE_OR_EMOJI_ONLY.test(v),
      "Content must not contain only whitespace or emoji",
    ),
  isInternal: z.boolean(),
  attachments: z.array(attachmentSchema).optional(),
  mentions: z.array(mentionInputSchema).optional(),
});
export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
export type MentionInput = z.infer<typeof mentionInputSchema>;
