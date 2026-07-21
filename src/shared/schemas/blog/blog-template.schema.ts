import { z } from "zod";
import { htmlToPlainText } from "@/shared/lib/sanitizeHtml";

export const blogTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Tên template không được để trống")
    .max(200, "Tên template tối đa 200 ký tự"),
  description: z.string().optional(),
  contentHtml: z
    .string()
    .refine(
      (v) => htmlToPlainText(v).length > 0,
      "Nội dung mẫu không được để trống",
    ),
  isActive: z.boolean(),
});

export type BlogTemplateFormInput = z.input<typeof blogTemplateSchema>;
export type BlogTemplateFormValues = z.output<typeof blogTemplateSchema>;
