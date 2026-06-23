import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
} from "@/shared/enums/notification.enum";
export {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
} from "@/shared/enums/notification.enum";

// Notification của user hiện tại (GET /api/notifications). Enum serialize số int.
export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  status: NotificationStatusEnum;
  title: string;
  body: string;
  payloadJson?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsParams {
  pageNumber?: number;
  pageSize?: number;
  type?: NotificationTypeEnum;
  channel?: NotificationChannelEnum;
  status?: NotificationStatusEnum;
  unreadOnly?: boolean;
}
