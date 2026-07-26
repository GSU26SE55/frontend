import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  NotificationPreferenceDto,
  UpdateNotificationPreferencePayload,
} from "@/shared/types/notification/notification-preference.types";

export const notificationPreferenceService = {
  get: () =>
    axiosInstance.get<CommonResponse<NotificationPreferenceDto>>(
      ENDPOINTS.NOTIFICATION_PREFERENCES.GET,
    ),

  // PUT upsert — KHÔNG gửi userId (BE lấy từ JWT claim)
  update: (payload: UpdateNotificationPreferencePayload) =>
    axiosInstance.put<CommonResponse<NotificationPreferenceDto>>(
      ENDPOINTS.NOTIFICATION_PREFERENCES.UPDATE,
      payload,
    ),
};
