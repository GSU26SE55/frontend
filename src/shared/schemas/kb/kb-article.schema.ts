import { z } from "zod";
import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { htmlToPlainText } from "@/shared/lib/sanitizeHtml";

// 3 field nội dung soạn bằng rich text (Tiptap) → luôn có ít nhất "<p></p>" khi
// rỗng, nên .min(1) vô dụng: phải kiểm tra text thuần sau khi bỏ thẻ.
const richTextField = (max: number, emptyMsg: string) =>
  z
    .string()
    .refine((v) => htmlToPlainText(v).length > 0, emptyMsg)
    .refine((v) => v.length <= max, `Tối đa ${max} ký tự`);

// KB Article — dùng chung admin/manager/staff (BE ValidateAsync giống nhau).
// Giới hạn lấy đúng từ ValidateAsync của BE.
export const kbArticleSchema = z.object({
  category: z.nativeEnum(TicketCategoryEnum),
  title: z
    .string()
    .min(1, "Tiêu đề không được trống")
    .max(200, "Tối đa 200 ký tự"),
  symptoms: richTextField(10000, "Mô tả triệu chứng không được trống"),
  diagnosisSteps: richTextField(20000, "Bước chẩn đoán không được trống"),
  solutionSteps: richTextField(20000, "Hướng giải quyết không được trống"),
  recommendedParts: z.array(z.string()).optional().default([]),
  tags: z
    .array(z.string().max(50, "Mỗi thẻ tối đa 50 ký tự"))
    .max(10, "Tối đa 10 thẻ")
    .optional()
    .default([]),
  isInternalOnly: z.boolean().default(false),
  isTemplate: z.boolean().default(false),
  changeDescription: z.string().optional(),
});

export type KbArticleFormInput = z.input<typeof kbArticleSchema>;
export type KbArticleFormValues = z.output<typeof kbArticleSchema>;
