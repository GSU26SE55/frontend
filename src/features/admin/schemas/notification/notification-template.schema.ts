import { z } from "zod";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import {
  TEMPLATE_TITLE_MAX,
  TEMPLATE_BODY_MAX,
} from "@/features/admin/types/notification/notification-template.types";

// Soạn thảo template. Giới hạn độ dài khớp cột DB và khớp ValidateAsync của BE — kiểm ở FE để lỗi
// hiện ngay lúc gõ, nhưng BE vẫn kiểm lại vì client nào cũng có thể bỏ qua tầng này.
//
// KHÔNG kiểm cú pháp Handlebars ở đây: muốn kiểm đúng thì phải compile bằng chính engine BE dùng.
// Đoán bằng regex sẽ vừa bỏ sót vừa báo nhầm; BE trả 400 kèm thông báo cụ thể, để nguyên vậy.
export const notificationTemplateFormSchema = z.object({
  // Zod v4: tham số thứ hai nhận `{ message }`, KHÔNG còn `errorMap` như v3.
  type: z.nativeEnum(NotificationTypeEnum, { message: "Chọn loại thông báo." }),
  channel: z.nativeEnum(NotificationChannelEnum, {
    message: "Chọn kênh gửi.",
  }),
  titleTemplate: z
    .string()
    .trim()
    .min(1, "Tiêu đề không được trống.")
    .max(TEMPLATE_TITLE_MAX, `Tiêu đề tối đa ${TEMPLATE_TITLE_MAX} ký tự.`),
  bodyTemplate: z
    .string()
    .trim()
    .min(1, "Nội dung không được trống.")
    .max(TEMPLATE_BODY_MAX, `Nội dung tối đa ${TEMPLATE_BODY_MAX} ký tự.`),
});

export type NotificationTemplateFormValues = z.infer<
  typeof notificationTemplateFormSchema
>;

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
