import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  NotificationTemplateDto,
  NotificationTemplateListParams,
  CreateNotificationTemplatePayload,
  ReviseNotificationTemplatePayload,
  TemplateSampleDataPayload,
  TemplatePreviewDto,
  TemplateTestSendDto,
  TemplateVariableGroupDto,
  TemplateCoverageDto,
} from "@/features/admin/types/notification/notification-template.types";

export const notificationTemplateService = {
  // Bao gồm cả bản isActive = false để thấy lịch sử phiên bản.
  // Sort BE: type → channel → version giảm dần → id (chốt chặn cho thứ tự toàn phần).
  getList: (params?: NotificationTemplateListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<NotificationTemplateDto>>
    >(ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.LIST, { params }),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<NotificationTemplateDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.DETAIL(id),
    ),

  // Tạo template đầu tiên cho một cặp chưa có. Cặp đã có ⇒ 409, cú pháp Handlebars hỏng ⇒ 400.
  create: (payload: CreateNotificationTemplatePayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.CREATE,
      payload,
    ),

  // Sửa = sinh phiên bản mới rồi bật lên. Bản cũ GIỮ NGUYÊN để còn quay lui.
  revise: (id: string, payload: ReviseNotificationTemplatePayload) =>
    axiosInstance.put<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.REVISE(id),
      payload,
    ),

  // Xoá mềm một phiên bản. BE chặn xoá bản đang dùng (409).
  remove: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.DELETE(id),
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

  // Biến hợp lệ theo từng loại — dữ liệu tĩnh, BE không chạm DB.
  getVariables: () =>
    axiosInstance.get<CommonResponse<TemplateVariableGroupDto[]>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.VARIABLES,
    ),

  // Độ phủ tính theo thông báo THẬT đã sinh (không theo ma trận cấu hình — hai thứ đó từng lệch).
  getCoverage: () =>
    axiosInstance.get<CommonResponse<TemplateCoverageDto[]>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.COVERAGE,
    ),
};
