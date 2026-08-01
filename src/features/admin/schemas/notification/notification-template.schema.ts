import { z } from "zod";

// sampleData nhập dạng JSON thô trong textarea. Rỗng ⇒ render với model rỗng
// (placeholder không có giá trị sẽ ra chuỗi rỗng — đó là cách phát hiện template
// gọi sai tên biến).
export const templateSampleDataSchema = z.object({
  sampleDataJson: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        try {
          const parsed: unknown = JSON.parse(v);
          return (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          );
        } catch {
          return false;
        }
      },
      {
        message:
          'Phải là JSON object hợp lệ, ví dụ: { "ticketCode": "TK-001" }',
      },
    ),
});

export type TemplateSampleDataFormValues = z.infer<
  typeof templateSampleDataSchema
>;

// Parse an toàn cho service — gọi sau khi schema đã validate.
export function parseSampleData(
  json?: string,
): Record<string, unknown> | undefined {
  if (!json?.trim()) return undefined;
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
