export const TicketStatusEnum = {
  New: "New",
  Open: "Open",
  Approved: "Approved",
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
  Maintenance: "Maintenance",
  Repair: "Repair",
  Inspection: "Inspection",
  Emergency: "Emergency",
  Replacement: "Replacement",
  Upgrade: "Upgrade",
  Other: "Other",
  Charging: "Charging",
  Overheat: "Overheat",
  NoPower: "NoPower",
  Performance: "Performance",
} as const;
export type TicketCategoryEnum =
  (typeof TicketCategoryEnum)[keyof typeof TicketCategoryEnum];

export const TicketOriginEnum = {
  Manual: "Manual",
  AutoDetected: "AutoDetected",
  CustomerRequest: "CustomerRequest",
  Scheduled: "Scheduled",
} as const;
export type TicketOriginEnum =
  (typeof TicketOriginEnum)[keyof typeof TicketOriginEnum];

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
  Critical: "Critical",
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
  SlaBreached: "SlaBreached",
  SlaBreach: "SlaBreach",
  StaffRequest: "StaffRequest",
  ManagerDecision: "ManagerDecision",
  AutoEscalated: "AutoEscalated",
  SkillGap: "SkillGap",
  PartsRequired: "PartsRequired",
  SafetyConcern: "SafetyConcern",
  CustomerComplaint: "CustomerComplaint",
} as const;
export type EscalationReasonEnum =
  (typeof EscalationReasonEnum)[keyof typeof EscalationReasonEnum];

export const SlaTimerStatusEnum = {
  Running: "Running",
  Paused: "Paused",
  Breached: "Breached",
  Completed: "Completed",
  Met: "Met",
} as const;
export type SlaTimerStatusEnum =
  (typeof SlaTimerStatusEnum)[keyof typeof SlaTimerStatusEnum];

export const MaintenanceLogTypeEnum = {
  Diagnosis: "Diagnosis",
  Repair: "Repair",
  PartReplacement: "PartReplacement",
  Testing: "Testing",
  Completion: "Completion",
  Note: "Note",
  RemoteSupport: "RemoteSupport",
  OnSite: "OnSite",
  Inspection: "Inspection",
} as const;
export type MaintenanceLogTypeEnum =
  (typeof MaintenanceLogTypeEnum)[keyof typeof MaintenanceLogTypeEnum];

export const ActivityActionEnum = {
  Created: "Created",
  StatusChanged: "StatusChanged",
  PriorityAssigned: "PriorityAssigned",
  Assigned: "Assigned",
  StaffAssigned: "StaffAssigned",
  Reassigned: "Reassigned",
  StaffReassigned: "StaffReassigned",
  Paused: "Paused",
  SlaPaused: "SlaPaused",
  Resumed: "Resumed",
  SlaResumed: "SlaResumed",
  Escalated: "Escalated",
  EscalationRequested: "EscalationRequested",
  Resolved: "Resolved",
  Closed: "Closed",
  Commented: "Commented",
  LogAdded: "LogAdded",
  MaintenanceLogged: "MaintenanceLogged",
  PriorityChanged: "PriorityChanged",
  SlaWarning: "SlaWarning",
  SlaBreached: "SlaBreached",
  Approved: "Approved",
  TriageApproved: "TriageApproved",
  Rejected: "Rejected",
  Rated: "Rated",
  Reopened: "Reopened",
  AutoClosed: "AutoClosed",
  ResolvedByEscalatedStaff: "ResolvedByEscalatedStaff",
  IncidentDeclared: "IncidentDeclared",
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
