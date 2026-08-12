import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { CreateNotificationPayload } from "@/features/admin/types/notification/notification.types";
import type {
  PushTransportDto,
  UpdatePushTransportCommand,
} from "@/shared/types/notification/notification.types";

export const adminNotificationService = {
  create: (payload: CreateNotificationPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.NOTIFICATIONS.CREATE,
      payload,
    ),
  getPushTransport: () =>
    axiosInstance.get<CommonResponse<PushTransportDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_SETTINGS.PUSH_TRANSPORT,
    ),
  updatePushTransport: (command: UpdatePushTransportCommand) =>
    axiosInstance.put<CommonResponse<PushTransportDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_SETTINGS.PUSH_TRANSPORT,
      command,
    ),
};
