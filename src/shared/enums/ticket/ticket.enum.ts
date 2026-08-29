// GH-1176: canonical 8-status lifecycle. Removed: New, Assigned, WaitingCustomer,
// WaitingParts, WaitingOnsiteSchedule, Resolved, Escalated, ClosedPendingRate, Incident.
export const TicketStatusEnum = {
  Open: "Open",
  Pending: "Pending",
  InProgress: "InProgress",
  Request: "Request",
  ReAssign: "ReAssign",
  Completed: "Completed",
  Closed: "Closed",
  ClosedRejected: "ClosedRejected",
} as const;
export type TicketStatusEnum =
  (typeof TicketStatusEnum)[keyof typeof TicketStatusEnum];

// GH-1176: Urgent added (priority 4 — SLA timer never runs for Urgent tickets).
export const TicketPriorityEnum = {
  P1Critical: "P1Critical",
  P2High: "P2High",
  P3Normal: "P3Normal",
  Urgent: "Urgent",
} as const;
export type TicketPriorityEnum =
  (typeof TicketPriorityEnum)[keyof typeof TicketPriorityEnum];

export const TicketCategoryEnum = {
  Charging: "Charging",
  Overheat: "Overheat",
  NoPower: "NoPower",
  Performance: "Performance",
  Other: "Other",
  Repair: "Repair",
} as const;
export type TicketCategoryEnum =
  (typeof TicketCategoryEnum)[keyof typeof TicketCategoryEnum];

export const TicketOriginEnum = {
  ManualByCustomer: "ManualByCustomer",
  AutoFromAlert: "AutoFromAlert",
  // Created by the system, not from one specific alert (High cascade risk, Critical
  // environmental incident). Tickets of this kind have batteryAssetId = "" at site level.
  System: "System",
} as const;
export type TicketOriginEnum =
  (typeof TicketOriginEnum)[keyof typeof TicketOriginEnum];

// AI ticket verification (genuine/spam) — human-in-the-loop; the AI only labels.
// The BE serializes the enum as a STRING (JsonStringEnumConverter) → use string values.
export const TicketVerifyStatusEnum = {
  Pending: "Pending", // not verified yet (the async consumer hasn't run)
  Legitimate: "Legitimate", // the AI judged it valid
  Suspicious: "Suspicious", // the AI suspects spam — a Manager reviews it first
  Skipped: "Skipped", // couldn't be verified (AI down) — still treated as valid
} as const;
export type TicketVerifyStatusEnum =
  (typeof TicketVerifyStatusEnum)[keyof typeof TicketVerifyStatusEnum];

// Special close reasons — the BE currently has only one value.
export const TicketCloseReasonEnum = {
  MergedDuplicate: "MergedDuplicate", // closed because it was merged into another ticket
} as const;
export type TicketCloseReasonEnum =
  (typeof TicketCloseReasonEnum)[keyof typeof TicketCloseReasonEnum];

export const TicketVerifyStatusLabel: Record<TicketVerifyStatusEnum, string> = {
  [TicketVerifyStatusEnum.Pending]: "Checking",
  [TicketVerifyStatusEnum.Legitimate]: "Valid",
  [TicketVerifyStatusEnum.Suspicious]: "Suspicious",
  [TicketVerifyStatusEnum.Skipped]: "Check skipped",
};

// #697 — a ticket has 1 PrimaryHandler + N Supporters (replacing the old assignedStaffId).
// GH-1176: PreviousPrimaryHandler — kept on reassign/escalate for audit trail (BE AssignmentRoleEnum=3).
export const TicketAssignmentRoleEnum = {
  PrimaryHandler: "PrimaryHandler", // owns the ticket; counts toward My Tickets/KPI
  Supporter: "Supporter", // assists, internal chat access only — does NOT count toward workload
  PreviousPrimaryHandler: "PreviousPrimaryHandler", // superseded by a reassign/escalate decision
} as const;
export type TicketAssignmentRoleEnum =
  (typeof TicketAssignmentRoleEnum)[keyof typeof TicketAssignmentRoleEnum];

export const TicketAssignmentRoleLabel: Record<
  TicketAssignmentRoleEnum,
  string
> = {
  [TicketAssignmentRoleEnum.PrimaryHandler]: "Primary handler",
  [TicketAssignmentRoleEnum.Supporter]: "Supporter",
  [TicketAssignmentRoleEnum.PreviousPrimaryHandler]: "Previous primary handler",
};

export const ImpactScopeEnum = {
  SingleAsset: "SingleAsset",
  Site: "Site",
  MultiSite: "MultiSite",
} as const;
export type ImpactScopeEnum =
  (typeof ImpactScopeEnum)[keyof typeof ImpactScopeEnum];

export const UrgencyLevelEnum = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
} as const;
export type UrgencyLevelEnum =
  (typeof UrgencyLevelEnum)[keyof typeof UrgencyLevelEnum];

// GH-1176: PendingContextEnum — why a ticket is in Pending.
export const PendingContextEnum = {
  Scheduled: "Scheduled",
  Held: "Held",
} as const;
export type PendingContextEnum =
  (typeof PendingContextEnum)[keyof typeof PendingContextEnum];

// GH-1176: PauseReasonEnum — hold reason (only valid when PendingContext=Held).
// Replaced: WaitingCustomer, WaitingParts, WaitingOnsiteSchedule.
export const PauseReasonEnum = {
  CustomerUnavailable: "CustomerUnavailable",
  WorkBlocked: "WorkBlocked",
} as const;
export type PauseReasonEnum =
  (typeof PauseReasonEnum)[keyof typeof PauseReasonEnum];

export const EscalationReasonEnum = {
  SkillGap: "SkillGap",
  PartsRequired: "PartsRequired",
  SafetyConcern: "SafetyConcern",
  SlaBreach: "SlaBreach",
  CustomerComplaint: "CustomerComplaint",
} as const;
export type EscalationReasonEnum =
  (typeof EscalationReasonEnum)[keyof typeof EscalationReasonEnum];

// GH-1176: Stopped added — SLA timer for Urgent tickets; never creates or runs.
export const SlaTimerStatusEnum = {
  Running: "Running",
  Paused: "Paused",
  Met: "Met",
  Breached: "Breached",
  Stopped: "Stopped",
} as const;
// Bộ lọc "nguồn tạo ticket" — mirror TicketSourceFilterEnum bên BE (Domain/Enums).
// KHÔNG map 1-1 với TicketOriginEnum: Environmental và PeriodicMaintenance đều là
// Origin = System. Xem utils/ticket/ticketSource.ts.
export const TicketSourceFilterEnum = {
  Customer: "Customer",
  AiPredicted: "AiPredicted",
  Environmental: "Environmental",
  PeriodicMaintenance: "PeriodicMaintenance",
} as const;
export type TicketSourceFilterEnum =
  (typeof TicketSourceFilterEnum)[keyof typeof TicketSourceFilterEnum];

export type SlaTimerStatusEnum =
  (typeof SlaTimerStatusEnum)[keyof typeof SlaTimerStatusEnum];

export const MaintenanceLogTypeEnum = {
  RemoteSupport: "RemoteSupport",
  OnSite: "OnSite",
  PartReplacement: "PartReplacement",
  Inspection: "Inspection",
  // Log auto-created when Staff completes a ticket — distinct from logs written mid-work.
  Completion: "Completion",
} as const;
export type MaintenanceLogTypeEnum =
  (typeof MaintenanceLogTypeEnum)[keyof typeof MaintenanceLogTypeEnum];

// GH-1176: synced with BE ActivityActionEnum. Removed: AutoClosed (AutoClose removed),
// TriageApproved (triage approval removed). Renamed: Commented → Chatted (BE name).
// Resolved retained (BE still uses it for the activity record of staff completion).
export const ActivityActionEnum = {
  Created: "Created",
  StatusChanged: "StatusChanged",
  PriorityAssigned: "PriorityAssigned",
  StaffAssigned: "StaffAssigned",
  StaffReassigned: "StaffReassigned",
  Chatted: "Chatted",
  MaintenanceLogged: "MaintenanceLogged",
  AttachmentAdded: "AttachmentAdded",
  SlaPaused: "SlaPaused",
  SlaResumed: "SlaResumed",
  SlaWarning: "SlaWarning",
  SlaBreached: "SlaBreached",
  EscalationRequested: "EscalationRequested",
  Escalated: "Escalated",
  IncidentDeclared: "IncidentDeclared",
  Resolved: "Resolved",
  Approved: "Approved",
  Rejected: "Rejected",
  Rated: "Rated",
  Reopened: "Reopened",
  ResolvedByEscalatedStaff: "ResolvedByEscalatedStaff",
  Closed: "Closed",
  RatingRequested: "RatingRequested",
  ParticipantAdded: "ParticipantAdded",
  ParticipantRemoved: "ParticipantRemoved",
  ParticipantRoleChanged: "ParticipantRoleChanged",
  IncidentDeclassified: "IncidentDeclassified",
} as const;
export type ActivityActionEnum =
  (typeof ActivityActionEnum)[keyof typeof ActivityActionEnum];

export const ActorRoleEnum = {
  System: "System",
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Customer",
} as const;
export type ActorRoleEnum = (typeof ActorRoleEnum)[keyof typeof ActorRoleEnum];

// Participation roles on a ticket — GET /api/tickets/{id}/participants.
export const ParticipantTypeEnum = {
  Owner: "Owner",
  PrimaryAssignee: "PrimaryAssignee",
  Collaborator: "Collaborator",
  Watcher: "Watcher",
  Delegate: "Delegate",
  PreviousAssignee: "PreviousAssignee",
} as const;
export type ParticipantTypeEnum =
  (typeof ParticipantTypeEnum)[keyof typeof ParticipantTypeEnum];

/**
 * SLA filter for the ticket list (BE query param `Sla`) — NOT a stored state.
 * `SlaTimerStatusEnum` is the column on the timer; these are the three situations
 * Admin/Manager filter on. All three keep the ticket's own status (usually InProgress);
 * only `Breached` means the countdown actually reached 0.
 */
export const SlaFilterEnum = {
  Paused: "Paused",
  Warning: "Warning",
  Breached: "Breached",
} as const;
export type SlaFilterEnum = (typeof SlaFilterEnum)[keyof typeof SlaFilterEnum];
