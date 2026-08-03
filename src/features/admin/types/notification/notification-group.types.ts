import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import type {
  NotificationGroupKindEnum,
  NotificationBatchSourceEnum,
  NotificationBatchStatusEnum,
  NotificationBatchTargetKindEnum,
} from "@/shared/enums/notification/notification-group.enum";

export {
  NotificationGroupKindEnum,
  NotificationBatchSourceEnum,
  NotificationBatchStatusEnum,
  NotificationBatchTargetKindEnum,
} from "@/shared/enums/notification/notification-group.enum";

/** Khớp giới hạn cột DB `name varchar(128)` và validate ở backend. */
export const GROUP_NAME_MAX = 128;
/** Khớp `description varchar(512)`. */
export const GROUP_DESCRIPTION_MAX = 512;
/** Khớp `title varchar(200)` của cả lần gửi lẫn từng thông báo. */
export const BROADCAST_TITLE_MAX = 200;
/** Khớp `body varchar(2000)`. */
export const BROADCAST_BODY_MAX = 2000;

export interface NotificationGroupDto {
  id: string;
  name: string;
  description: string | null;
  kind: NotificationGroupKindEnum;
  /** Chỉ có giá trị khi `kind = Role`. */
  roleFilter: string | null;
  /** Nhóm hệ thống — ẩn nút sửa/xoá. */
  isSystem: boolean;
  /**
   * Số người nhận **thực tế** — đã loại người có tài khoản ngừng hoạt động hoặc đã xoá.
   * Đây là con số cần nhìn trước khi gửi, không phải số dòng trong bảng thành viên.
   */
  memberCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface NotificationGroupMemberDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  /** `false` ⇒ còn trong nhóm nhưng sẽ KHÔNG nhận thông báo. Hiển thị mờ để admin dọn. */
  isActive: boolean;
  /** `null` với nhóm `Role` — không có dòng thành viên thật. */
  addedAt: string | null;
}

export interface NotificationGroupListParams {
  kind?: NotificationGroupKindEnum;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface NotificationGroupMemberListParams {
  search?: string;
  activeOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateNotificationGroupPayload {
  name: string;
  description?: string | null;
}

export type UpdateNotificationGroupPayload = CreateNotificationGroupPayload;

export interface AddGroupMembersPayload {
  userIds: string[];
}

/** Ba con số tách riêng vì thêm hàng loạt gần như luôn có phần tử bị bỏ qua. */
export interface AddGroupMembersResult {
  added: number;
  alreadyMembers: number;
  /** Id không có trong read-model tài khoản — thường là tài khoản vừa tạo, chưa đồng bộ kịp. */
  unknownAccounts: number;
  memberCount: number;
}

// ── Gửi hàng loạt ────────────────────────────────────────────────────────────────────────────

export interface BroadcastPayload {
  type: NotificationTypeEnum;
  channels: NotificationChannelEnum[];
  title: string;
  body: string;
  entityType?: string | null;
  groupIds: string[];
  userIds: string[];
  /**
   * 03/08/2026 — render nội dung qua **mẫu thông báo** thay vì dùng thẳng `title`/`body`.
   *
   * `false` (mặc định): chữ admin gõ được gửi đi y nguyên.
   *
   * `true`: máy chủ tra mẫu theo cặp (Loại × Kênh) và render với `payloadJson`. Phải render lúc
   * gửi chứ không đổ sẵn chữ vào ô soạn, vì **mỗi kênh có mẫu riêng** — bản SMS nén ngắn lại do
   * tính tiền theo đoạn — nên một lần gửi 3 kênh cho ra 3 nội dung khác nhau.
   *
   * `title`/`body` vẫn bắt buộc, trở thành **nội dung dự phòng** cho kênh không có mẫu khớp.
   */
  useTemplate?: boolean;
  /** Giá trị các biến của mẫu, dạng JSON object. Chỉ có nghĩa khi `useTemplate = true`. */
  payloadJson?: string | null;
}

// ── Xem trước nội dung theo từng kênh khi bật "dùng mẫu" ─────────────────────────────────────

export interface BroadcastTemplatePreviewPayload {
  type: NotificationTypeEnum;
  channels: NotificationChannelEnum[];
  title: string;
  body: string;
  payloadJson?: string | null;
}

export interface BroadcastChannelPreviewDto {
  channel: NotificationChannelEnum;
  /** `false` ⇒ cặp (Loại × Kênh) này không có mẫu, kênh đó dùng chữ admin gõ. */
  hasTemplate: boolean;
  title: string;
  body: string;
  /** Biến mẫu gọi mà chưa có giá trị ⇒ chỗ đó render ra rỗng. Rỗng là tốt. */
  missingVariables: string[];
  /** Mẫu hỏng cú pháp ⇒ lúc gửi thật rơi về nội dung dự phòng. */
  renderError?: string | null;
}

export interface BroadcastPreviewPayload {
  groupIds: string[];
  userIds: string[];
  channels: NotificationChannelEnum[];
}

export interface BroadcastPreviewDto {
  /** Số người nhận sau khi gom trùng — con số thật sẽ nhận. */
  recipientCount: number;
  notificationCount: number;
  /**
   * Tổng nếu cộng dồn từng nhóm mà KHÔNG gom trùng. Lớn hơn `recipientCount` nghĩa là các
   * nhóm đang giao nhau — hiển thị chênh lệch để admin hiểu vì sao con số nhỏ hơn họ nhẩm.
   */
  rawCount: number;
  skippedUsers: number;
  missingGroups: number;
}

export interface BroadcastResultDto {
  batchId: string;
  recipientCount: number;
  notificationCount: number;
  groupCount: number;
  skippedUsers: number;
}

export interface NotificationBatchDto {
  id: string;
  type: NotificationTypeEnum;
  title: string;
  body: string;
  channels: NotificationChannelEnum[];
  source: NotificationBatchSourceEnum;
  status: NotificationBatchStatusEnum;
  recipientCount: number;
  notificationCount: number;
  createdBy: string | null;
  createdAt: string;
}

export interface NotificationBatchTargetDto {
  targetKind: NotificationBatchTargetKindEnum;
  groupId: string | null;
  /**
   * Tên nhóm tại thời điểm gửi. Nhóm bị **xoá mềm** vẫn trả về ĐÚNG TÊN — backend cố ý không lọc
   * dòng đã xoá, vì lịch sử mà mất tên thì người xem chỉ còn thấy "một nhóm nào đó".
   * Chỉ `null` khi dòng nhóm bị xoá **cứng** khỏi DB, điều không xảy ra qua API.
   */
  groupName: string | null;
  userId: string | null;
}

export interface NotificationBatchDetailDto extends NotificationBatchDto {
  targets: NotificationBatchTargetDto[];
  totalRows: number;
  distinctRecipients: number;
  sentCount: number;
  readCount: number;
  failedCount: number;
  pendingCount: number;
}

export interface NotificationBatchListParams {
  source?: NotificationBatchSourceEnum;
  type?: NotificationTypeEnum;
  pageNumber?: number;
  pageSize?: number;
}
