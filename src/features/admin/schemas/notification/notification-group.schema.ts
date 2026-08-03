import { z } from "zod";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import {
  GROUP_NAME_MAX,
  GROUP_DESCRIPTION_MAX,
  BROADCAST_TITLE_MAX,
  BROADCAST_BODY_MAX,
} from "@/features/admin/types/notification/notification-group.types";

// Giới hạn độ dài khớp cột DB và khớp ValidateAsync của BE — kiểm ở FE để lỗi hiện ngay lúc gõ,
// nhưng BE vẫn kiểm lại vì client nào cũng có thể bỏ qua tầng này.
export const notificationGroupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên nhóm không được trống.")
    .max(GROUP_NAME_MAX, `Tên nhóm tối đa ${GROUP_NAME_MAX} ký tự.`),
  description: z
    .string()
    .trim()
    .max(GROUP_DESCRIPTION_MAX, `Mô tả tối đa ${GROUP_DESCRIPTION_MAX} ký tự.`)
    .optional(),
});

export type NotificationGroupFormValues = z.infer<
  typeof notificationGroupFormSchema
>;

// Gửi hàng loạt. KHÔNG kiểm "nhóm có ai không" ở đây — số người nhận phụ thuộc trạng thái tài
// khoản ở thời điểm gửi, chỉ backend biết; nó trả 400 kèm lý do cụ thể khi tập rỗng.
export const broadcastFormSchema = z
  .object({
    // Zod v4: tham số thứ hai nhận `{ message }`, KHÔNG còn `errorMap` như v3.
    type: z.nativeEnum(NotificationTypeEnum, {
      message: "Chọn loại thông báo.",
    }),
    channels: z
      .array(z.nativeEnum(NotificationChannelEnum))
      .min(1, "Chọn ít nhất một kênh gửi."),
    title: z
      .string()
      .trim()
      .min(1, "Tiêu đề không được trống.")
      .max(BROADCAST_TITLE_MAX, `Tiêu đề tối đa ${BROADCAST_TITLE_MAX} ký tự.`),
    body: z
      .string()
      .trim()
      .min(1, "Nội dung không được trống.")
      .max(BROADCAST_BODY_MAX, `Nội dung tối đa ${BROADCAST_BODY_MAX} ký tự.`),
    groupIds: z.array(z.string()),
    userIds: z.array(z.string()),
    // 03/08/2026 — render nội dung qua mẫu thông báo thay vì dùng thẳng title/body.
    useTemplate: z.boolean(),
    // Giá trị các biến của mẫu. Khoá là tên biến, giá trị là chữ admin điền; ô để trống được lược
    // bỏ khi dựng payload nên biến đó render ra rỗng — đúng như khi gửi thật.
    templateVars: z.record(z.string(), z.string()),
  })
  // Phải chọn ít nhất một nhóm HOẶC một người. Gắn lỗi vào `groupIds` để nó hiện ngay dưới ô
  // chọn nhóm — lỗi ở cấp form sẽ nằm lạc chỗ và người dùng không biết sửa đâu.
  .refine((v) => v.groupIds.length > 0 || v.userIds.length > 0, {
    message: "Chọn ít nhất một nhóm hoặc một người nhận.",
    path: ["groupIds"],
  });

export type BroadcastFormValues = z.infer<typeof broadcastFormSchema>;
