// Notification template admin (Sprint 6.3 NOTI3-12) — /api/admin/notification-templates.
// ⚠️ type/channel ở đây BE trả về dạng TÊN enum (chuỗi: "SlaBreached", "Email"),
// khác các endpoint notification khác (serialize số).

export interface NotificationTemplateDto {
  id: string;
  type: string;
  channel: string;
  locale: string; // BCP-47: "vi-VN" | "en-US"
  version: number; // số phiên bản trong cùng bộ ba (Type × Channel × Locale)
  isActive: boolean; // bản dispatcher đang dùng — mỗi bộ ba chỉ có đúng 1
  titleTemplate: string;
  bodyTemplate: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface NotificationTemplateListParams {
  type?: string;
  channel?: string;
  locale?: string;
}

// preview + test-send dùng chung body. Không gửi ⇒ render với model rỗng.
export interface TemplateSampleDataPayload {
  sampleData?: Record<string, unknown>;
}

export interface TemplatePreviewDto {
  type: string;
  channel: string;
  locale: string;
  version: number;
  title: string; // đã render
  body: string; // đã render
}

// Địa chỉ nhận LUÔN là admin đang đăng nhập (BE lấy từ JWT) — FE không gửi email.
export interface TemplateTestSendDto {
  remainingThisHour: number; // max(0, 5 - đã dùng)
}
