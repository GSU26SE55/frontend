import { z } from "zod";
import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { htmlToPlainText } from "@/shared/lib/sanitizeHtml";
import { requiredSelect } from "@/shared/schemas/common.schema";

// Content is authored in rich text (Tiptap) → always at least "<p></p>" when
// empty, so .min(1) is useless: check the plain text after stripping tags.
// An image-only article carries no plain text but is accepted by the BE, so embedded
// media counts as content as well.
const HAS_EMBEDDED_MEDIA = /<(img|video|iframe|figure|embed)\b/i;

const richTextField = (max: number, emptyMsg: string) =>
  z
    .string()
    .refine(
      (v) => htmlToPlainText(v).length > 0 || HAS_EMBEDDED_MEDIA.test(v),
      emptyMsg,
    )
    .refine((v) => v.length <= max, `Must be at most ${max} characters`);

// KB Article — shared by admin/manager/staff (the BE ValidateAsync is the same).
// Content merged into a single `content` field
// (BE #692 — MergeKbContentFieldsToSingleContent).
export const kbArticleSchema = z.object({
  category: requiredSelect(
    z.nativeEnum(TicketCategoryEnum),
    "Select a category",
  ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Must be at most 200 characters"),
  content: richTextField(50000, "Content is required"),
  tags: z
    .array(z.string().max(50, "Each tag must be at most 50 characters"))
    .max(10, "Must be at most 10 tags")
    .optional()
    .default([]),
  changeDescription: z.string().optional(),
});

export type KbArticleFormInput = z.input<typeof kbArticleSchema>;
export type KbArticleFormValues = z.output<typeof kbArticleSchema>;
