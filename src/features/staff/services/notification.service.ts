import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  NotificationDto,
  StaffNotificationsParams,
} from "@/features/staff/types/notification.types";
import { NotificationChannelEnum } from "@/shared/enums/notification.enum";

export const staffNotificationService = {
  // Mặc định chỉ lấy channel InApp — BE ghi 1 record/channel (InApp + Push) cho mỗi
  // sự kiện; record Push chỉ để đẩy device, không thuộc danh sách in-app. Không lọc
  // sẽ hiện trùng 2 dòng. Caller vẫn override channel được nếu cần.
  getList: (params: StaffNotificationsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<NotificationDto>>>(
      ENDPOINTS.NOTIFICATIONS.LIST,
      { params: { channel: NotificationChannelEnum.InApp, ...params } },
    ),
};
