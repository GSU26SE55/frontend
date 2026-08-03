import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";

// Notification template admin (Sprint 6.3 NOTI3-12) — /api/admin/notification-templates.
//
// 02/08/2026 — hai thay đổi hợp đồng:
//  1. type/channel BE trả về dạng SỐ (trước là TÊN enum tiếng Anh). FE tự ánh xạ sang nhãn
//     tiếng Việt qua shared/constants/notificationLabels.ts.
//  2. Bỏ hẳn `locale` — hệ thống tiếng Việt only, cột đã bị drop khỏi DB.

export interface NotificationTemplateDto {
  id: string;
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  version: number; // số phiên bản trong cùng cặp (Type × Channel)
  isActive: boolean; // bản dispatcher đang dùng — mỗi cặp chỉ có đúng 1
  titleTemplate: string;
  bodyTemplate: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface NotificationTemplateListParams {
  // BE nhận cả số lẫn tên enum; FE gửi số cho khớp với kiểu dữ liệu đang dùng.
  type?: NotificationTypeEnum;
  channel?: NotificationChannelEnum;
  // true ⇒ chỉ lấy bản đang dùng của mỗi cặp, ẩn lịch sử phiên bản.
  activeOnly?: boolean;
  // BE phân trang (PaginationRequest): pageNumber <= 0 → 1; pageSize ngoài 1..100 → 10 hoặc 100.
  pageNumber?: number;
  pageSize?: number;
}

// Giới hạn khớp cột DB (title_template 500, body_template 4000) và khớp luôn ValidateAsync của BE —
// để lỗi hiện ngay lúc gõ thay vì đợi server trả 400.
export const TEMPLATE_TITLE_MAX = 500;
export const TEMPLATE_BODY_MAX = 4000;

// Tạo template ĐẦU TIÊN cho một cặp (type × channel) chưa có. Cặp đã có ⇒ BE trả 409.
export interface CreateNotificationTemplatePayload {
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  titleTemplate: string;
  bodyTemplate: string;
}

// Sửa = sinh PHIÊN BẢN MỚI rồi bật lên, không ghi đè bản cũ.
// Cố ý không có type/channel: BE lấy từ bản gốc để không ai đổi cặp và phá chuỗi phiên bản.
export interface ReviseNotificationTemplatePayload {
  titleTemplate: string;
  bodyTemplate: string;
}

// preview + test-send dùng chung body. Không gửi ⇒ render với model rỗng.
export interface TemplateSampleDataPayload {
  sampleData?: Record<string, unknown>;
}

export interface TemplatePreviewDto {
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  version: number;
  title: string; // đã render
  body: string; // đã render
}

// Địa chỉ nhận LUÔN là admin đang đăng nhập (BE lấy từ JWT) — FE không gửi email.
export interface TemplateTestSendDto {
  remainingThisHour: number; // max(0, 5 - đã dùng)
}

// ── 03/08/2026: hợp đồng tên biến ────────────────────────────────────────────────────────────
//
// Template gọi biến bằng `{{tenBien}}`, và tên đó phải khớp ĐÚNG khoá mà consumer ghi vào
// payload — không phải một tên nghe hợp lý. Handlebars gặp biến lạ thì render ra chuỗi rỗng chứ
// KHÔNG báo lỗi, nên template sai tên vẫn lưu được, vẫn gửi được, chỉ có người nhận là đọc phải
// câu cụt. Bộ template của dự án từng chạy nhiều tháng với `{{ticketCode}}` trong khi consumer
// ghi khoá `code`, và `{{serialNumber}}` trong khi consumer ghi `assetSerialNumber`.

export interface TemplateVariableGroupDto {
  type: NotificationTypeEnum;
  /** Tên enum phía BE — dùng khi cần đối chiếu, nhãn hiển thị vẫn lấy từ notificationLabels. */
  typeName: string;
  /** Sáu biến luôn có, giống nhau ở mọi loại: Title, Body, EntityType, EntityId, UserId, CreatedAt. */
  builtin: string[];
  /** Khoá riêng của loại này. **Rỗng** ⇒ consumer không ghi payload, chỉ dùng được `builtin`. */
  payload: string[];
}

export interface TemplateCoverageDto {
  type: NotificationTypeEnum;
  typeName: string;
  channel: NotificationChannelEnum;
  /** Số dòng thông báo đã sinh cho cặp này — thước đo mức độ đáng quan tâm. */
  notificationCount: number;
  /** `false` ⇒ mọi thông báo của cặp này đang dùng chuỗi hardcode trong consumer. */
  hasActiveTemplate: boolean;
  /** Biến template đang dùng nhưng không có trong dữ liệu ⇒ render ra rỗng. Rỗng là tốt. */
  unknownVariables: string[];
}
