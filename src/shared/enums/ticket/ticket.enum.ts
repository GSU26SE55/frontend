// Mirrors the BE's TicketStatusEnum (13 values). There is NO 'Approved' — that is
// ActivityActionEnum.Approved (the Manager's approve action), not a ticket status.
export const TicketStatusEnum = {
  New: "New",
  Open: "Open",
  Assigned: "Assigned",
  InProgress: "InProgress",
  WaitingCustomer: "WaitingCustomer",
  WaitingParts: "WaitingParts",
  WaitingOnsiteSchedule: "WaitingOnsiteSchedule",
  Resolved: "Resolved",
  Escalated: "Escalated",
  ClosedPendingRate: "ClosedPendingRate",
  Closed: "Closed",
  ClosedRejected: "ClosedRejected",
  Incident: "Incident",
} as const;
export type TicketStatusEnum =
  (typeof TicketStatusEnum)[keyof typeof TicketStatusEnum];

export const TicketPriorityEnum = {
  P1Critical: "P1Critical",
  P2High: "P2High",
  P3Normal: "P3Normal",
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
  CreatedByStaff: "CreatedByStaff",
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
export const TicketAssignmentRoleEnum = {
  PrimaryHandler: "PrimaryHandler", // owns the ticket; counts toward My Tickets/KPI
  Supporter: "Supporter", // assists, internal chat access only — does NOT count toward workload
} as const;
export type TicketAssignmentRoleEnum =
  (typeof TicketAssignmentRoleEnum)[keyof typeof TicketAssignmentRoleEnum];

export const TicketAssignmentRoleLabel: Record<
  TicketAssignmentRoleEnum,
  string
> = {
  [TicketAssignmentRoleEnum.PrimaryHandler]: "Primary handler",
  [TicketAssignmentRoleEnum.Supporter]: "Supporter",
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

export const PauseReasonEnum = {
  WaitingCustomer: "WaitingCustomer",
  WaitingParts: "WaitingParts",
  WaitingOnsiteSchedule: "WaitingOnsiteSchedule",
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

export const SlaTimerStatusEnum = {
  Running: "Running",
  Paused: "Paused",
  Met: "Met",
  Breached: "Breached",
} as const;
export type SlaTimerStatusEnum =
  (typeof SlaTimerStatusEnum)[keyof typeof SlaTimerStatusEnum];

export const MaintenanceLogTypeEnum = {
  RemoteSupport: "RemoteSupport",
  OnSite: "OnSite",
  PartReplacement: "PartReplacement",
  Inspection: "Inspection",
} as const;
export type MaintenanceLogTypeEnum =
  (typeof MaintenanceLogTypeEnum)[keyof typeof MaintenanceLogTypeEnum];

export const ActivityActionEnum = {
  Created: "Created",
  StatusChanged: "StatusChanged",
  PriorityAssigned: "PriorityAssigned",
  StaffAssigned: "StaffAssigned",
  StaffReassigned: "StaffReassigned",
  Commented: "Commented",
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
  AutoClosed: "AutoClosed",
  ResolvedByEscalatedStaff: "ResolvedByEscalatedStaff",
  TriageApproved: "TriageApproved",
  Closed: "Closed",
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
