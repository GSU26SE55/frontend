import { z } from "zod";
import { htmlToPlainText } from "@/shared/lib/sanitizeHtml";

// Tiptap luôn trả về ít nhất "<p></p>" khi rỗng → phải kiểm tra text thuần,
// không dùng .min(1) trên chuỗi HTML.
const contentHtmlField = z
  .string()
  .refine((v) => htmlToPlainText(v).length > 0, "Nội dung không được để trống");

export const blogPostSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(256, "Tiêu đề tối đa 256 ký tự"),
  slug: z
    .string()
    .min(1, "Slug không được để trống")
    .max(300, "Slug tối đa 300 ký tự")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug chỉ gồm chữ thường, số và dấu gạch ngang",
    ),
  summary: z.string().min(1, "Tóm tắt không được để trống"),
  contentHtml: contentHtmlField,
  changeNote: z.string().optional(),
  blogTemplateId: z.string().optional(),
});

export type BlogPostFormInput = z.input<typeof blogPostSchema>;
export type BlogPostFormValues = z.output<typeof blogPostSchema>;
