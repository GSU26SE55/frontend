import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import type {
  NotificationGroupKindEnum,
  NotificationBatchSourceEnum,
  NotificationBatchStatusEnum,
  NotificationBatchTargetKindEnum,
} from "@/shared/enums/notification/notification-group.enum";

export {
  NotificationGroupKindEnum,
  NotificationBatchSourceEnum,
  NotificationBatchStatusEnum,
  NotificationBatchTargetKindEnum,
} from "@/shared/enums/notification/notification-group.enum";

/** Matches the DB column limit `name varchar(128)` and backend validation. */
export const GROUP_NAME_MAX = 128;
/** Matches `description varchar(512)`. */
export const GROUP_DESCRIPTION_MAX = 512;
/** Matches `title varchar(200)` for both the broadcast and each notification. */
export const BROADCAST_TITLE_MAX = 200;
/** Matches `body varchar(2000)`. */
export const BROADCAST_BODY_MAX = 2000;
/** Matches `NotificationBroadcastCommand.MaxTargets` — groups + recipients per send. */
export const BROADCAST_TARGETS_MAX = 200;

export interface NotificationGroupDto {
  id: string;
  name: string;
  description: string | null;
  kind: NotificationGroupKindEnum;
  /** Only has a value when `kind = Role`. */
  roleFilter: string | null;
  /** System group — hides edit/delete buttons. */
  isSystem: boolean;
  /**
   * **Actual** recipient count — excludes accounts that are inactive or deleted.
   * This is the number to check before sending, not the row count in the member table.
   */
  memberCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface NotificationGroupMemberDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  /** `false` ⇒ still in the group but will NOT receive notifications. Displayed dimmed so admin can clean up. */
  isActive: boolean;
  /** `null` for `Role` groups — there's no real member row. */
  addedAt: string | null;
}

export interface NotificationGroupListParams {
  kind?: NotificationGroupKindEnum;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface NotificationGroupMemberListParams {
  search?: string;
  activeOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateNotificationGroupPayload {
  name: string;
  description?: string | null;
}

export type UpdateNotificationGroupPayload = CreateNotificationGroupPayload;

export interface AddGroupMembersPayload {
  userIds: string[];
}

/** Three separate counts because a batch add almost always has some elements skipped. */
export interface AddGroupMembersResult {
  added: number;
  alreadyMembers: number;
  /** Id not present in the account read-model — usually a newly created account that hasn't synced yet. */
  unknownAccounts: number;
  memberCount: number;
}

// ── Broadcast send ───────────────────────────────────────────────────────────────────────────

export interface BroadcastPayload {
  type: NotificationTypeEnum;
  channels: NotificationChannelEnum[];
  title: string;
  body: string;
  entityType?: string | null;
  groupIds: string[];
  userIds: string[];
  /**
   * 03/08/2026 — render content via a **notification template** instead of using `title`/`body` directly.
   *
   * `false` (default): the text the admin typed is sent as-is.
   *
   * `true`: the server looks up the template by pair (Type × Channel) and renders it with `payloadJson`.
   * Must render at send time rather than pre-filling the compose box, because **each channel has its
   * own template** — the SMS version is compressed shorter since billing is per-segment — so a single
   * send to 3 channels produces 3 different contents.
   *
   * `title`/`body` are still required, becoming the **fallback content** for channels without a matching template.
   */
  useTemplate?: boolean;
  /** Template variable values, as a JSON object. Only meaningful when `useTemplate = true`. */
  payloadJson?: string | null;
}

// ── Preview content per channel when "use template" is enabled ─────────────────────────────────

export interface BroadcastTemplatePreviewPayload {
  type: NotificationTypeEnum;
  channels: NotificationChannelEnum[];
  title: string;
  body: string;
  payloadJson?: string | null;
}

export interface BroadcastChannelPreviewDto {
  channel: NotificationChannelEnum;
  /** `false` ⇒ this (Type × Channel) pair has no template, that channel uses the admin's typed text. */
  hasTemplate: boolean;
  title: string;
  body: string;
  /** Template variables referenced but without a value ⇒ that spot renders empty. Empty is fine. */
  missingVariables: string[];
  /** Template has broken syntax ⇒ falls back to fallback content at actual send time. */
  renderError?: string | null;
}

export interface BroadcastPreviewPayload {
  groupIds: string[];
  userIds: string[];
  channels: NotificationChannelEnum[];
}

export interface BroadcastPreviewDto {
  /** Recipient count after deduplication — the actual number that will receive it. */
  recipientCount: number;
  notificationCount: number;
  /**
   * Sum if each group is added up WITHOUT deduplication. Greater than `recipientCount` means the
   * groups overlap — the difference is shown so the admin understands why the number is smaller than expected.
   */
  rawCount: number;
  skippedUsers: number;
  missingGroups: number;
}

export interface BroadcastResultDto {
  batchId: string;
  recipientCount: number;
  notificationCount: number;
  groupCount: number;
  skippedUsers: number;
}

export interface NotificationBatchDto {
  id: string;
  type: NotificationTypeEnum;
  title: string;
  body: string;
  channels: NotificationChannelEnum[];
  source: NotificationBatchSourceEnum;
  status: NotificationBatchStatusEnum;
  recipientCount: number;
  notificationCount: number;
  createdBy: string | null;
  createdAt: string;
}

export interface NotificationBatchTargetDto {
  targetKind: NotificationBatchTargetKindEnum;
  groupId: string | null;
  /**
   * Group name at the time it was sent. A **soft-deleted** group still returns the CORRECT NAME — the
   * backend intentionally doesn't filter out deleted rows, because if the name is lost from history,
   * the viewer just sees "some group".
   * Only `null` when the group row is **hard-deleted** from the DB, which doesn't happen via the API.
   */
  groupName: string | null;
  userId: string | null;
}

export interface NotificationBatchDetailDto extends NotificationBatchDto {
  targets: NotificationBatchTargetDto[];
  totalRows: number;
  distinctRecipients: number;
  sentCount: number;
  readCount: number;
  failedCount: number;
  pendingCount: number;
}

export interface NotificationBatchListParams {
  source?: NotificationBatchSourceEnum;
  type?: NotificationTypeEnum;
  pageNumber?: number;
  pageSize?: number;
}
