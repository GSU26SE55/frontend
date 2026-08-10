import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
} from "@/shared/enums/notification/notification.enum";
export {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
} from "@/shared/enums/notification/notification.enum";

// Notifications for the current user (GET /api/notifications). Enums serialize as ints.
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

// `as const` object rather than a TypeScript `enum`: the project standard (see
// .claude/rules/tech/fe.md "Enum Pattern"), and required here because tsconfig has
// `erasableSyntaxOnly` — a native enum emits runtime code and fails to compile.
export const PushTransportEnum = {
  SignalR: 1,
  Expo: 2,
  Both: 3,
} as const;
export type PushTransportEnum =
  (typeof PushTransportEnum)[keyof typeof PushTransportEnum];

export interface PushTransportOptionDto {
  value: PushTransportEnum;
  name: string;
  description: string;
  requiresDeviceToken: boolean;
}

export interface PushTransportDto {
  transport: PushTransportEnum;
  transportName: string;
  options: PushTransportOptionDto[];
}

export interface UpdatePushTransportCommand {
  transport: PushTransportEnum;
}
