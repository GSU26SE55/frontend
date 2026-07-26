import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
export {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  title: string;
  body: string;
  payloadJson?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  bypassQuietHours?: boolean;
}
