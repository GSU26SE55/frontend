import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  NotificationTemplateDto,
  NotificationTemplateListParams,
  TemplateSampleDataPayload,
  TemplatePreviewDto,
  TemplateTestSendDto,
} from "@/features/admin/types/notification/notification-template.types";

export const notificationTemplateService = {
  // Bao gồm cả bản isActive = false để thấy lịch sử phiên bản.
  // Sort BE: type → channel → locale → version giảm dần.
  getList: (params?: NotificationTemplateListParams) =>
    axiosInstance.get<CommonResponse<NotificationTemplateDto[]>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.LIST,
      { params },
    ),

  // Dựng thử với dữ liệu mẫu — KHÔNG gửi đi đâu cả.
  preview: (id: string, payload: TemplateSampleDataPayload) =>
    axiosInstance.post<CommonResponse<TemplatePreviewDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.PREVIEW(id),
      payload,
    ),

  // Gửi tới chính admin đang đăng nhập (địa chỉ lấy từ JWT, KHÔNG nhận từ body).
  // Chỉ template kênh Email; vượt 5 lượt/giờ → 429.
  testSend: (id: string, payload: TemplateSampleDataPayload) =>
    axiosInstance.post<CommonResponse<TemplateTestSendDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.TEST_SEND(id),
      payload,
    ),

  // Quay lui: tắt bản đang dùng + bật bản được chọn trong cùng một lần lưu.
  activate: (id: string) =>
    axiosInstance.post<CommonResponse<null>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.ACTIVATE(id),
    ),
};
