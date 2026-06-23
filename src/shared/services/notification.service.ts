import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  NotificationDto,
  NotificationsParams,
} from "@/shared/types/notification.types";

export const notificationService = {
  getList: (params: NotificationsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDto>>>(
      ENDPOINTS.NOTIFICATIONS.LIST,
      { params },
    ),

  // PATCH — body rỗng. data = id của notification vừa mark.
  markRead: (id: string) =>
    axiosInstance.patch<CommonResponse<string>>(
      ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
    ),

  // POST — body rỗng. data = số notification đã được mark.
  markAllRead: () =>
    axiosInstance.post<CommonResponse<number>>(
      ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
    ),

  // GET — data = số notification chưa đọc (badge).
  getUnreadCount: () =>
    axiosInstance.get<CommonResponse<number>>(
      ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
    ),
};
