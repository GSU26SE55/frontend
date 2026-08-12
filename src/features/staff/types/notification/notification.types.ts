export {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
  isUnreadStatus,
} from "@/shared/enums/notification/notification.enum";

// NotificationDto has the same shape as the shared one → reuse it rather than redefining it.
export type { NotificationDto } from "@/shared/types/notification/notification.types";

// StaffNotificationsParams ≡ NotificationsParams (shared) → aliased, keeping the old name so call sites stay unchanged.
export type { NotificationsParams as StaffNotificationsParams } from "@/shared/types/notification/notification.types";
