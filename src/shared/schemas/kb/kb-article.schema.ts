import { z } from "zod";
import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";

// KB Article — dùng chung admin/manager/staff (BE ValidateAsync giống nhau).
// Giới hạn lấy đúng từ ValidateAsync của BE.
export const kbArticleSchema = z.object({
  category: z.nativeEnum(TicketCategoryEnum),
  title: z
    .string()
    .min(1, "Tiêu đề không được trống")
    .max(200, "Tối đa 200 ký tự"),
  symptoms: z
    .string()
    .min(1, "Mô tả triệu chứng không được trống")
    .max(2000, "Tối đa 2000 ký tự"),
  diagnosisSteps: z
    .string()
    .min(1, "Bước chẩn đoán không được trống")
    .max(4000, "Tối đa 4000 ký tự"),
  solutionSteps: z
    .string()
    .min(1, "Hướng giải quyết không được trống")
    .max(4000, "Tối đa 4000 ký tự"),
  recommendedParts: z.array(z.string()).optional().default([]),
  tags: z
    .array(z.string().max(50, "Mỗi thẻ tối đa 50 ký tự"))
    .max(10, "Tối đa 10 thẻ")
    .optional()
    .default([]),
  isInternalOnly: z.boolean().default(false),
  changeDescription: z.string().optional(),
});

export type KbArticleFormInput = z.input<typeof kbArticleSchema>;
export type KbArticleFormValues = z.output<typeof kbArticleSchema>;
