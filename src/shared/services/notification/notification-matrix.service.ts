import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  NotificationPreferenceMatrixDto,
  UpdateNotificationMatrixPayload,
  NotificationCategoryMapDto,
} from "@/shared/types/notification/notification-matrix.types";

export const notificationMatrixService = {
  // GET — luôn trả đủ 6 nhóm, nhóm chưa tuỳ chỉnh có isCustomized = false.
  getMatrix: () =>
    axiosInstance.get<CommonResponse<NotificationPreferenceMatrixDto>>(
      ENDPOINTS.NOTIFICATION_PREFERENCES.MATRIX,
    ),

  // PUT — vá từng dòng: chỉ nhóm có trong items bị đổi, nhóm còn lại giữ nguyên.
  // Response trả về ma trận ĐẦY ĐỦ sau khi cập nhật.
  updateMatrix: (payload: UpdateNotificationMatrixPayload) =>
    axiosInstance.put<CommonResponse<NotificationPreferenceMatrixDto>>(
      ENDPOINTS.NOTIFICATION_PREFERENCES.MATRIX,
      payload,
    ),

  // GET — bảng tra cứu NotificationType → nhóm (số phần tử do BE quyết định).
  getCategories: () =>
    axiosInstance.get<CommonResponse<NotificationCategoryMapDto[]>>(
      ENDPOINTS.NOTIFICATION_PREFERENCES.CATEGORIES,
    ),
};
