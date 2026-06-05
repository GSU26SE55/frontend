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
  Charging: "Charging",
  Overheat: "Overheat",
  NoPower: "NoPower",
  Performance: "Performance",
  Repair: "Repair",
  Other: "Other",
} as const;
export type TicketCategoryEnum =
  (typeof TicketCategoryEnum)[keyof typeof TicketCategoryEnum];

export const TicketOriginEnum = {
  ManualByCustomer: "ManualByCustomer",
  AutoFromAlert: "AutoFromAlert",
  CreatedByStaff: "CreatedByStaff",
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
} as const;
export type UrgencyLevelEnum =
  (typeof UrgencyLevelEnum)[keyof typeof UrgencyLevelEnum];

export const EscalationReasonEnum = {
  SkillGap: "SkillGap",
  PartsRequired: "PartsRequired",
  SafetyConcern: "SafetyConcern",
  SlaBreach: "SlaBreach",
  CustomerComplaint: "CustomerComplaint",
} as const;
export type EscalationReasonEnum =
  (typeof EscalationReasonEnum)[keyof typeof EscalationReasonEnum];

export const PauseReasonEnum = {
  WaitingCustomer: "WaitingCustomer",
  WaitingParts: "WaitingParts",
  WaitingOnsiteSchedule: "WaitingOnsiteSchedule",
} as const;
export type PauseReasonEnum =
  (typeof PauseReasonEnum)[keyof typeof PauseReasonEnum];

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
} as const;
export type ActivityActionEnum =
  (typeof ActivityActionEnum)[keyof typeof ActivityActionEnum];

export const ActorRoleEnum = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Customer",
  System: "System",
} as const;
export type ActorRoleEnum = (typeof ActorRoleEnum)[keyof typeof ActorRoleEnum];

// --- DTOs ---

export interface SlaTimerDTO {
  id: string;
  priority: TicketPriorityEnum;
  startedAt: string;
  dueAt: string;
  originalDueAt: string;
  totalPausedMinutes: number;
  warningSentAt: string | null;
  breachAt: string | null;
  status: SlaTimerStatusEnum;
  remainingPercent: number;
}

export interface TicketDTO {
  id: string;
  code: string;
  title: string;
  status: TicketStatusEnum;
  priority: TicketPriorityEnum;
  category: TicketCategoryEnum;
  impactScope: ImpactScopeEnum;
  urgencyLevel: UrgencyLevelEnum;
  origin: TicketOriginEnum;
  assignedStaffId: string | null;
  customerId: string;
  batteryAssetId: string | null;
  isIncident: boolean;
  reopenCount: number;
  createdAt: string;
  updatedAt: string | null;
  slaTimer: SlaTimerDTO;
}

export interface TicketActivityDTO {
  id: string;
  ticketId: string;
  actorUserId: string | null;
  actorRole: ActorRoleEnum;
  actorDisplayName: string | null;
  action: ActivityActionEnum;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: string;
}

export interface TicketCommentDTO {
  id: string;
  ticketId: string;
  authorUserId: string | null;
  authorRole: ActorRoleEnum;
  authorDisplayName: string | null;
  body: string;
  isInternal: boolean;
  attachmentFileIds: string[] | null;
  createdAt: string;
}

export interface MaintenanceLogDTO {
  id: string;
  ticketId: string;
  staffId: string;
  logType: MaintenanceLogTypeEnum;
  summary: string | null;
  durationMinutes: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface TicketAttachmentDTO {
  id: string;
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string | null;
  createdAt: string;
}

export interface TicketDetailDTO extends TicketDTO {
  description: string | null;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  resolvedByStaffId: string | null;
  approvedAt: string | null;
  approvedByManagerId: string | null;
  rejectionReason: string | null;
  closedAt: string | null;
  rating: number | null;
  ratingComment: string | null;
  ratedAt: string | null;
  escalatedAt: string | null;
  escalationReason: EscalationReasonEnum | null;
  originAlertId: string | null;
  activities: TicketActivityDTO[] | null;
  comments: TicketCommentDTO[] | null;
  maintenanceLogs: MaintenanceLogDTO[] | null;
  attachments: TicketAttachmentDTO[] | null;
}

export interface TicketActionDto {
  id: string | null;
  code: string | null;
  status: TicketStatusEnum;
}

export interface TicketActionResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  data: TicketActionDto | null;
  listErrors: Array<{ field: string | null; detail: string | null }> | null;
}

// --- Filter params ---

export interface AdminTicketListParams {
  keyword?: string;
  status?: TicketStatusEnum;
  priority?: TicketPriorityEnum;
  category?: TicketCategoryEnum;
  batteryAssetId?: string;
  isDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface AdminTicketQueueParams {
  priority?: TicketPriorityEnum;
  category?: TicketCategoryEnum;
  pageNumber?: number;
  pageSize?: number;
}

// --- Action payloads ---

export interface TriagePayload {
  impact: ImpactScopeEnum;
  urgency: UrgencyLevelEnum;
  manualPriority?: TicketPriorityEnum;
  priorityOverrideReason?: string;
  managerComment?: string;
}

export interface AssignPayload {
  staffId: string;
  notes?: string;
}

export interface ReassignPayload {
  newStaffId: string;
  reason?: string;
}

export interface RejectPayload {
  reason?: string;
}

export interface EscalatePayload {
  reason: EscalationReasonEnum;
  note?: string;
}

export interface CommentAttachmentInput {
  fileId: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}

export interface AddCommentPayload {
  body: string;
  isInternal: boolean;
  attachments?: CommentAttachmentInput[];
}
