export {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
  isUnreadStatus,
} from "@/shared/enums/notification/notification.enum";

// NotificationDto trùng shape với shared → dùng chung, không định nghĩa lại.
export type { NotificationDto } from "@/shared/types/notification/notification.types";

// StaffNotificationsParams ≡ NotificationsParams (shared) → alias, giữ tên cũ để không đổi call-site.
export type { NotificationsParams as StaffNotificationsParams } from "@/shared/types/notification/notification.types";
