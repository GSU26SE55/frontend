import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  NotificationPreferenceMatrixDto,
  UpdateNotificationMatrixPayload,
  NotificationCategoryMapDto,
} from "@/shared/types/notification/notification-matrix.types";

export const notificationMatrixService = {
  // GET — always returns all 6 groups; a group that hasn't been customized has isCustomized = false.
  getMatrix: () =>
    axiosInstance.get<CommonResponse<NotificationPreferenceMatrixDto>>(
      ENDPOINTS.NOTIFICATION_PREFERENCES.MATRIX,
    ),

  // PUT — patches row by row: only groups present in items get changed, the rest stay as-is.
  // Response returns the FULL matrix after the update.
  updateMatrix: (payload: UpdateNotificationMatrixPayload) =>
    axiosInstance.put<CommonResponse<NotificationPreferenceMatrixDto>>(
      ENDPOINTS.NOTIFICATION_PREFERENCES.MATRIX,
      payload,
    ),

  // GET — lookup table for NotificationType → group (element count is decided by the BE).
  getCategories: () =>
    axiosInstance.get<CommonResponse<NotificationCategoryMapDto[]>>(
      ENDPOINTS.NOTIFICATION_PREFERENCES.CATEGORIES,
    ),
};
