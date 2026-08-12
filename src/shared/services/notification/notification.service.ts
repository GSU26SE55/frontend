import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  NotificationDto,
  NotificationsParams,
} from "@/shared/types/notification/notification.types";
import { NotificationChannelEnum } from "@/shared/enums/notification/notification.enum";

export const notificationService = {
  // Defaults to the InApp channel only. The BE writes 1 record/channel (InApp + Push) per
  // event ⇒ without filtering, the list shows 2 duplicate rows (the Push record is only for
  // pushing to the device, it doesn't belong in the in-app list). Caller can still override
  // the channel if needed.
  getList: (params: NotificationsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDto>>>(
      ENDPOINTS.NOTIFICATIONS.LIST,
      { params: { channel: NotificationChannelEnum.InApp, ...params } },
    ),

  // GET detail of 1 notification (inbox screen). The BE doesn't filter by channel on this
  // endpoint, so it can also open Push/Email/Sms delivery records, not just the InApp feed.
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<NotificationDto>>(
      ENDPOINTS.NOTIFICATIONS.DETAIL(id),
    ),

  // PATCH — empty body. data = id of the notification just marked.
  markRead: (id: string) =>
    axiosInstance.patch<CommonResponse<string>>(
      ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
    ),

  // PATCH — empty body. User actively OPENS the notification (taps the deep link): BE sets
  // Status = Opened and ReadAt ??= now, so there's no need to also call markRead.
  // Idempotent: still returns 200 even if already Opened.
  markOpened: (id: string) =>
    axiosInstance.patch<CommonResponse<string>>(
      ENDPOINTS.NOTIFICATIONS.OPENED(id),
    ),

  // POST — empty body. data = number of notifications marked.
  markAllRead: () =>
    axiosInstance.post<CommonResponse<number>>(
      ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
    ),

  // GET — data = number of unread notifications (badge).
  getUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(
      ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
    ),

  getUnsubscribe: (token: string) =>
    axiosInstance.get<CommonResponse<string>>(
      ENDPOINTS.NOTIFICATIONS.UNSUBSCRIBE,
      { params: { token } },
    ),

  unsubscribe: (token: string) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.NOTIFICATIONS.UNSUBSCRIBE,
      null,
      { params: { token } },
    ),
};
