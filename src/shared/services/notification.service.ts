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
import { NotificationChannelEnum } from "@/shared/enums/notification.enum";

export const notificationService = {
  // Mặc định chỉ lấy channel InApp. BE ghi 1 record/channel (InApp + Push) cho mỗi
  // sự kiện ⇒ nếu không lọc, list hiện trùng 2 dòng (record Push chỉ để đẩy device,
  // không thuộc danh sách in-app). Caller vẫn override channel được nếu cần.
  getList: (params: NotificationsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDto>>>(
      ENDPOINTS.NOTIFICATIONS.LIST,
      { params: { channel: NotificationChannelEnum.InApp, ...params } },
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
