import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  NotificationGroupDto,
  NotificationGroupMemberDto,
  NotificationGroupListParams,
  NotificationGroupMemberListParams,
  CreateNotificationGroupPayload,
  UpdateNotificationGroupPayload,
  AddGroupMembersPayload,
  AddGroupMembersResult,
  BroadcastPayload,
  BroadcastPreviewPayload,
  BroadcastTemplatePreviewPayload,
  BroadcastChannelPreviewDto,
  BroadcastPreviewDto,
  BroadcastResultDto,
  NotificationBatchDto,
  NotificationBatchDetailDto,
  NotificationBatchListParams,
} from "@/features/admin/types/notification/notification-group.types";

export const notificationGroupService = {
  // Nhóm hệ thống (theo vai trò) xếp lên đầu, rồi tới nhóm tự tạo theo tên.
  getList: (params?: NotificationGroupListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationGroupDto>>>(
      ENDPOINTS.ADMIN.NOTIFICATION_GROUPS.LIST,
      { params },
    ),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<NotificationGroupDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_GROUPS.DETAIL(id),
    ),

  // Luôn tạo nhóm `Static`. Nhóm theo vai trò do seeder sinh, không tạo qua API được.
  // Trùng tên (không phân biệt hoa-thường) ⇒ 409.
  create: (payload: CreateNotificationGroupPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_GROUPS.CREATE,
      payload,
    ),

  // Chỉ đổi tên/mô tả. Nhóm hệ thống ⇒ 409.
  update: (id: string, payload: UpdateNotificationGroupPayload) =>
    axiosInstance.put<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_GROUPS.UPDATE(id),
      payload,
    ),

  // Xoá mềm nhóm + toàn bộ thành viên. Lịch sử gửi KHÔNG bị ảnh hưởng. Nhóm hệ thống ⇒ 409.
  remove: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_GROUPS.DELETE(id),
    ),

  getMembers: (id: string, params?: NotificationGroupMemberListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<NotificationGroupMemberDto>>
    >(ENDPOINTS.ADMIN.NOTIFICATION_GROUPS.MEMBERS(id), { params }),

  // Bỏ qua id đã có / không tồn tại thay vì hỏng cả lô — xem `AddGroupMembersResult`.
  addMembers: (id: string, payload: AddGroupMembersPayload) =>
    axiosInstance.post<CommonResponse<AddGroupMembersResult>>(
      ENDPOINTS.ADMIN.NOTIFICATION_GROUPS.ADD_MEMBERS(id),
      payload,
    ),

  removeMember: (id: string, userId: string) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_GROUPS.REMOVE_MEMBER(id, userId),
    ),
};

export const notificationBroadcastService = {
  // KHÔNG gửi gì — chỉ trả số người nhận sau khi gom trùng. Dùng chung đoạn logic với `send`
  // ở backend, nên hai con số không thể lệch nhau.
  preview: (payload: BroadcastPreviewPayload) =>
    axiosInstance.post<CommonResponse<BroadcastPreviewDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_BROADCAST.PREVIEW,
      payload,
    ),

  // Xem trước NỘI DUNG theo từng kênh khi bật "dùng mẫu" — khác với `preview` ở trên vốn chỉ đếm
  // người nhận. Backend dựng model đúng khuôn dispatcher nên chữ ở đây bằng đúng chữ lúc gửi thật.
  templatePreview: (payload: BroadcastTemplatePreviewPayload) =>
    axiosInstance.post<CommonResponse<BroadcastChannelPreviewDto[]>>(
      ENDPOINTS.ADMIN.NOTIFICATION_BROADCAST.TEMPLATE_PREVIEW,
      payload,
    ),

  // 400 kèm lý do cụ thể khi không còn người nhận hợp lệ; không tạo lần gửi mồ côi.
  send: (payload: BroadcastPayload) =>
    axiosInstance.post<CommonResponse<BroadcastResultDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_BROADCAST.SEND,
      payload,
    ),

  getBatches: (params?: NotificationBatchListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationBatchDto>>>(
      ENDPOINTS.ADMIN.NOTIFICATION_BROADCAST.BATCHES,
      { params },
    ),

  getBatchById: (id: string) =>
    axiosInstance.get<CommonResponse<NotificationBatchDetailDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_BROADCAST.BATCH_DETAIL(id),
    ),
};
