import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { CreateNotificationPayload } from "@/features/admin/types/notification/notification.types";

export const adminNotificationService = {
  create: (payload: CreateNotificationPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.NOTIFICATIONS.CREATE,
      payload,
    ),
};
