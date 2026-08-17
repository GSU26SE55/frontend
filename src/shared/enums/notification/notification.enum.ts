export const NotificationTypeEnum = {
  TicketCreated: 1,
  TicketAssigned: 2,
  TicketStatusChanged: 3,
  TicketResolved: 4,
  TicketClosed: 5,
  TicketEscalated: 6,
  SlaWarning: 7,
  SlaBreached: 8,
  BatteryAnomalyDetected: 9,
  EnvironmentalIncidentDetected: 10,
  EnvironmentalIncidentResolved: 11,
  AccountActivated: 12,
  // 13 = AdminInvite — REMOVED on 03/08/2026 alongside the backend; this number is deliberately
  // left empty. Admin invites go straight from AuthService → EmailService and NOT through
  // NotificationService: no consumer writes them and no notification row carries type 13.
  // Do not reuse 13.
  IncidentDeclared: 14,
  // Cascade risk ≥ 0.7 on a battery (BatteryCascadeRiskHighEvent) → notify Manager/Admin.
  CascadeRiskHigh: 15,
  BatteryAlertEscalationPending: 16,
  AlertTicketSagaFailed: 17,
  IotDeviceWentOffline: 18,
  ChatCreated: 19,
  ChatMentioned: 20,
  ChatReacted: 21,
  ParticipantAdded: 22,
  ParticipantRemoved: 23,
  ParticipantRoleChanged: 24,
  BlogGenerationCompleted: 25,
  BlogGenerationFailed: 26,
  ChatEscalatedToAdmin: 27,
  TicketApproved: 28,
  TicketRejected: 29,
  TicketReopened: 30,
  TicketRatingRequested: 31,
  BatteryAnomalyWarning: 32,
  BatteryAnomalyInfo: 33,
  // 03/08/2026 — the BE moved `TicketMerged` off 27 to 34 (completing GH-83), so the FE can
  // finally mirror it. Before that the BE declared `TicketMerged = 27`, CLASHING with
  // `ChatEscalatedToAdmin`, which made the value→name mapping ambiguous, so the FE deliberately
  // left it out. This notification tells a Customer their ticket was merged.
  // Do NOT reuse 27 for any type.
  TicketMerged: 34,
  // 35–39 shipped on the BE with active templates but were missing here, so the inbox
  // rendered them as "#36" instead of a name (the `#${t}` fallback in notificationLabels).
  SlaAutoResumed: 35,
  IotDeviceRecovered: 36,
  IotDeviceAutoDecommissioned: 37,
  TicketWorkStarted: 38,
  TicketScheduleChanged: 39,
  System: 99,
} as const;
// ⚠️ The numbers follow the BE's `NotificationTypeEnum.cs`. The Sprint 6.2 group sits at 27–33
// (not 25–31): the Blog module GH-671 took 25/26 and pushed everything after it up by two.
export type NotificationTypeEnum =
  (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export const NotificationChannelEnum = {
  Push: 1,
  Email: 2,
  Sms: 3,
  InApp: 4,
} as const;
export type NotificationChannelEnum =
  (typeof NotificationChannelEnum)[keyof typeof NotificationChannelEnum];

export const NotificationStatusEnum = {
  Pending: 1,
  Sent: 2,
  Failed: 3,
  Read: 4,
  // Sprint 6.3 NOTI3-14: the provider confirmed delivery to the device (Expo receipt "ok").
  Delivered: 5,
  // Sprint 6.3 NOTI3-14: the user actively opened the notification — stronger than Read.
  Opened: 6,
  // GH-792: CLAIMED for sending, outcome not yet known. A transient state, written and committed
  // BEFORE calling the provider so that a process dying mid-send doesn't drop the row back onto
  // the queue and send it twice.
  // To the user it is still part of "not finished" — and still counts as unread.
  Processing: 7,
} as const;
export type NotificationStatusEnum =
  (typeof NotificationStatusEnum)[keyof typeof NotificationStatusEnum];

// "Unread" exactly as the BE defines it (GetUnreadCountQueryHandler): excludes BOTH Read AND
// Opened. Use this helper everywhere the FE computes unread itself so the badge never drifts
// from the server's count.
export const isUnreadStatus = (status: NotificationStatusEnum): boolean =>
  status !== NotificationStatusEnum.Read &&
  status !== NotificationStatusEnum.Opened;

// Business category of a notification (Sprint 6.3 NOTI3-04) — used for the category × channel
// matrix.
export const NotificationCategoryEnum = {
  Ticket: 1,
  Sla: 2,
  Battery: 3,
  Environmental: 4,
  Chat: 5,
  Account: 6,
} as const;
export type NotificationCategoryEnum =
  (typeof NotificationCategoryEnum)[keyof typeof NotificationCategoryEnum];

// Send frequency (per-user NotificationPreference) — declared for domain completeness;
// it does not appear on either of the two current REST endpoints.
export const NotificationFrequencyEnum = {
  Immediate: 1,
  Daily: 2,
} as const;
export type NotificationFrequencyEnum =
  (typeof NotificationFrequencyEnum)[keyof typeof NotificationFrequencyEnum];
