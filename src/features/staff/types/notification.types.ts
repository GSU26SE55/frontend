import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
} from "@/features/staff/enums/notification.enum";
export {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
} from "@/features/staff/enums/notification.enum";
export interface StaffNotificationsParams {
  pageNumber?: number;
  pageSize?: number;
  type?: NotificationTypeEnum;
  channel?: NotificationChannelEnum;
  status?: NotificationStatusEnum;
  unreadOnly?: boolean;
}

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
