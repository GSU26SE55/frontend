import { z } from "zod";
import { htmlToPlainText } from "@/shared/lib/sanitizeHtml";

// Tiptap always returns at least "<p></p>" when empty → check the plain text
// instead; .min(1) on the HTML string is useless. An image-only post carries no plain
// text at all though, and the BE accepts it, so embedded media counts as content too.
const HAS_EMBEDDED_MEDIA = /<(img|video|iframe|figure|embed)\b/i;

const contentHtmlField = z
  .string()
  .refine(
    (v) => htmlToPlainText(v).length > 0 || HAS_EMBEDDED_MEDIA.test(v),
    "Content is required",
  );

export const blogPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(256, "Title must be at most 256 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(300, "Slug must be at most 300 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may only contain lowercase letters, digits and hyphens",
    ),
  summary: z
    .string()
    .min(1, "Summary is required")
    .max(1000, "Summary must be at most 1000 characters"),
  contentHtml: contentHtmlField,
  changeNote: z.string().optional(),
  blogTemplateId: z.string().optional(),
});

export type BlogPostFormInput = z.input<typeof blogPostSchema>;
export type BlogPostFormValues = z.output<typeof blogPostSchema>;
