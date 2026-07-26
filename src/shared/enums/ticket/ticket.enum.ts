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
  Other: "Other",
  Repair: "Repair",
} as const;
export type TicketCategoryEnum =
  (typeof TicketCategoryEnum)[keyof typeof TicketCategoryEnum];

export const TicketOriginEnum = {
  ManualByCustomer: "ManualByCustomer",
  AutoFromAlert: "AutoFromAlert",
  CreatedByStaff: "CreatedByStaff",
  // Hệ thống tự tạo, không từ 1 alert cụ thể (cascade risk High, sự cố môi trường Critical).
  // Ticket loại này có batteryAssetId = "" khi ở cấp site.
  System: "System",
} as const;
export type TicketOriginEnum =
  (typeof TicketOriginEnum)[keyof typeof TicketOriginEnum];

// AI verify ticket thủ công (thật/rác) — human-in-the-loop, AI chỉ gắn nhãn.
// BE serialize enum ra STRING (JsonStringEnumConverter) → dùng string value.
export const TicketVerifyStatusEnum = {
  Pending: "Pending", // chưa verify (consumer async chưa xử lý)
  Legitimate: "Legitimate", // AI đánh giá hợp lệ
  Suspicious: "Suspicious", // AI nghi rác — Manager xem trước
  Skipped: "Skipped", // không verify được (AI down) — vẫn hợp lệ
} as const;
export type TicketVerifyStatusEnum =
  (typeof TicketVerifyStatusEnum)[keyof typeof TicketVerifyStatusEnum];

export const TicketVerifyStatusLabel: Record<TicketVerifyStatusEnum, string> = {
  [TicketVerifyStatusEnum.Pending]: "Đang kiểm tra",
  [TicketVerifyStatusEnum.Legitimate]: "Hợp lệ",
  [TicketVerifyStatusEnum.Suspicious]: "Nghi ngờ",
  [TicketVerifyStatusEnum.Skipped]: "Bỏ qua kiểm tra",
};

// #697 — 1 ticket có 1 PrimaryHandler + N Supporter (thay cho assignedStaffId cũ).
export const TicketAssignmentRoleEnum = {
  PrimaryHandler: "PrimaryHandler", // người chịu trách nhiệm chính, tính vào My Tickets/KPI
  Supporter: "Supporter", // hỗ trợ, chỉ được vào chat nội bộ — KHÔNG tính workload
} as const;
export type TicketAssignmentRoleEnum =
  (typeof TicketAssignmentRoleEnum)[keyof typeof TicketAssignmentRoleEnum];

export const TicketAssignmentRoleLabel: Record<
  TicketAssignmentRoleEnum,
  string
> = {
  [TicketAssignmentRoleEnum.PrimaryHandler]: "Phụ trách chính",
  [TicketAssignmentRoleEnum.Supporter]: "Hỗ trợ",
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
