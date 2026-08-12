import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  NotificationDto,
  StaffNotificationsParams,
} from "@/features/staff/types/notification/notification.types";
import { NotificationChannelEnum } from "@/shared/enums/notification/notification.enum";

export const staffNotificationService = {
  // Defaults to the InApp channel only — the BE writes one record per channel (InApp + Push) for
  // each event; the Push record only drives device delivery and is not part of the in-app list.
  // Without the filter every event would appear twice. Callers can still override the channel.
  getList: (params: StaffNotificationsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDto>>>(
      ENDPOINTS.NOTIFICATIONS.LIST,
      { params: { channel: NotificationChannelEnum.InApp, ...params } },
    ),
};
