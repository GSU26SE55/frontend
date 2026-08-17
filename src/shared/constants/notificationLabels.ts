import {
  NotificationGroupKindEnum,
  NotificationBatchSourceEnum,
  NotificationBatchStatusEnum,
} from "@/shared/enums/notification/notification-group.enum";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
} from "@/shared/enums/notification/notification.enum";

// Display labels for the notification enums.
//
// Why these live on the FE: since 2026-08-02 the BE returns `type`/`channel` as NUMBERS instead of
// enum names. Before that the BE returned the enum name ("SlaBreached", "Email") and the FE pasted
// it straight onto the screen. Turning a value into readable text is a presentation concern and
// belongs to the FE; the BE only returns data.
//
// `Record<Enum, string>` deliberately does NOT use Partial: adding a new enum value and forgetting
// its label becomes a TypeScript error at build time, instead of silently showing "#34" in the UI.

export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeEnum, string> = {
  [NotificationTypeEnum.TicketCreated]: "New ticket",
  [NotificationTypeEnum.TicketAssigned]: "Ticket assigned",
  [NotificationTypeEnum.TicketStatusChanged]: "Ticket status changed",
  [NotificationTypeEnum.TicketResolved]: "Resolved",
  [NotificationTypeEnum.TicketClosed]: "Ticket closed",
  [NotificationTypeEnum.TicketEscalated]: "Ticket escalated",
  [NotificationTypeEnum.SlaWarning]: "SLA breach warning",
  [NotificationTypeEnum.SlaBreached]: "SLA breached",
  [NotificationTypeEnum.BatteryAnomalyDetected]: "Battery anomaly (critical)",
  [NotificationTypeEnum.EnvironmentalIncidentDetected]:
    "Environmental incident",
  [NotificationTypeEnum.EnvironmentalIncidentResolved]:
    "Environmental incident resolved",
  [NotificationTypeEnum.AccountActivated]: "Account activated",
  [NotificationTypeEnum.IncidentDeclared]: "Major incident declared",
  [NotificationTypeEnum.CascadeRiskHigh]: "High cascade risk",
  [NotificationTypeEnum.BatteryAlertEscalationPending]:
    "Battery alert pending escalation",
  [NotificationTypeEnum.AlertTicketSagaFailed]: "Alert–ticket saga failed",
  [NotificationTypeEnum.IotDeviceWentOffline]: "IoT device went offline",
  [NotificationTypeEnum.ChatCreated]: "New message",
  [NotificationTypeEnum.ChatMentioned]: "You were mentioned",
  [NotificationTypeEnum.ChatReacted]: "New reaction",
  [NotificationTypeEnum.ParticipantAdded]: "Participant added",
  [NotificationTypeEnum.ParticipantRemoved]: "Participant removed",
  [NotificationTypeEnum.ParticipantRoleChanged]: "Participant role changed",
  [NotificationTypeEnum.BlogGenerationCompleted]: "Blog post generated",
  [NotificationTypeEnum.BlogGenerationFailed]: "Blog generation failed",
  [NotificationTypeEnum.ChatEscalatedToAdmin]: "Chat escalated to Admin",
  [NotificationTypeEnum.TicketApproved]: "Resolution approved",
  [NotificationTypeEnum.TicketRejected]: "Resolution rejected",
  [NotificationTypeEnum.TicketReopened]: "Ticket reopened",
  [NotificationTypeEnum.TicketRatingRequested]: "Rating requested",
  [NotificationTypeEnum.BatteryAnomalyWarning]: "Battery anomaly (warning)",
  [NotificationTypeEnum.BatteryAnomalyInfo]: "Battery anomaly (info)",
  [NotificationTypeEnum.TicketMerged]: "Ticket merged",
  [NotificationTypeEnum.SlaAutoResumed]: "SLA resumed",
  [NotificationTypeEnum.IotDeviceRecovered]: "IoT device recovered",
  [NotificationTypeEnum.IotDeviceAutoDecommissioned]: "IoT device disabled",
  [NotificationTypeEnum.TicketWorkStarted]: "Work started",
  [NotificationTypeEnum.TicketScheduleChanged]: "Schedule changed",
  [NotificationTypeEnum.System]: "System notification",
};

export const NOTIFICATION_CHANNEL_LABELS: Record<
  NotificationChannelEnum,
  string
> = {
  [NotificationChannelEnum.Push]: "Push",
  [NotificationChannelEnum.Email]: "Email",
  [NotificationChannelEnum.Sms]: "SMS",
  [NotificationChannelEnum.InApp]: "In-app",
};

// The "#number" fallback instead of an empty string: if the BE adds a new enum value the FE hasn't
// caught up with, you can still see which value is missing a label without opening DevTools.
export const notificationTypeLabel = (t: NotificationTypeEnum) =>
  NOTIFICATION_TYPE_LABELS[t] ?? `#${t}`;

export const notificationChannelLabel = (c: NotificationChannelEnum) =>
  NOTIFICATION_CHANNEL_LABELS[c] ?? `#${c}`;

// Delivery status — shown in the inbox detail pane.
// Pending/Processing/Sent/Delivered are stages of a single send, while Read/Opened are recipient
// behaviour; worded from the user's point of view rather than copying the BE's technical names.
export const NOTIFICATION_STATUS_LABELS: Record<
  NotificationStatusEnum,
  string
> = {
  [NotificationStatusEnum.Pending]: "Queued",
  [NotificationStatusEnum.Processing]: "Sending",
  [NotificationStatusEnum.Sent]: "Sent",
  [NotificationStatusEnum.Delivered]: "Delivered to device",
  [NotificationStatusEnum.Failed]: "Failed to send",
  [NotificationStatusEnum.Read]: "Read",
  [NotificationStatusEnum.Opened]: "Opened",
};

export const notificationStatusLabel = (s: NotificationStatusEnum) =>
  NOTIFICATION_STATUS_LABELS[s] ?? `#${s}`;

// ── Sprint 6.4 — recipient groups and bulk sends ─────────────────────────────────────────────

export const NOTIFICATION_GROUP_KIND_LABELS: Record<
  NotificationGroupKindEnum,
  string
> = {
  [NotificationGroupKindEnum.Static]: "Hand-picked list",
  [NotificationGroupKindEnum.Role]: "By role",
};

export const NOTIFICATION_BATCH_SOURCE_LABELS: Record<
  NotificationBatchSourceEnum,
  string
> = {
  [NotificationBatchSourceEnum.Event]: "Automatic from event",
  [NotificationBatchSourceEnum.Manual]: "Sent by user",
};

export const NOTIFICATION_BATCH_STATUS_LABELS: Record<
  NotificationBatchStatusEnum,
  string
> = {
  [NotificationBatchStatusEnum.Pending]: "Pending",
  [NotificationBatchStatusEnum.FannedOut]: "Fanned out",
  [NotificationBatchStatusEnum.Failed]: "Failed",
};

export const notificationGroupKindLabel = (k: NotificationGroupKindEnum) =>
  NOTIFICATION_GROUP_KIND_LABELS[k] ?? `#${k}`;

export const notificationBatchSourceLabel = (s: NotificationBatchSourceEnum) =>
  NOTIFICATION_BATCH_SOURCE_LABELS[s] ?? `#${s}`;

export const notificationBatchStatusLabel = (s: NotificationBatchStatusEnum) =>
  NOTIFICATION_BATCH_STATUS_LABELS[s] ?? `#${s}`;
