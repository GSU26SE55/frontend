import { z } from "zod";

export const kbArticleSchema = z.object({
  category: z.coerce.number().min(1, "Chọn danh mục"),
  title: z
    .string()
    .min(1, "Tiêu đề không được trống")
    .max(200, "Tối đa 200 ký tự"),
  symptoms: z.string().min(1, "Mô tả triệu chứng không được trống"),
  diagnosisSteps: z.string().min(1, "Bước chẩn đoán không được trống"),
  solutionSteps: z.string().min(1, "Hướng giải quyết không được trống"),
  recommendedParts: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export type KbArticleFormValues = z.infer<typeof kbArticleSchema>;
