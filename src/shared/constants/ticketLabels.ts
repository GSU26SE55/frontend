import type {
  EscalationReasonEnum,
  MaintenanceLogTypeEnum,
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket/ticket.types";

/**
 * Display labels for the 8 canonical ticket statuses (BE TicketStatusEnum 1–8).
 *
 * The SINGLE source — TicketStatusBadge renders every table cell from this map, so the
 * filter dropdowns must read the same one. Admin and Manager each kept a private copy
 * that drifted: Admin called Open "Open" and ClosedRejected "Closed - rejected" while
 * the badge on the very same row said "Awaiting assignment" / "Rejected".
 */
export const TICKET_STATUS_LABEL: Record<TicketStatusEnum, string> = {
  Open: "Awaiting assignment",
  Pending: "Pending",
  InProgress: "In progress",
  Request: "Escalation request",
  ReAssign: "Pending reassignment",
  Completed: "Completed",
  Closed: "Closed",
  ClosedRejected: "Rejected",
};

/** Display labels for ticket priorities (BE TicketPriorityEnum 1–4). */
export const TICKET_PRIORITY_LABEL: Record<TicketPriorityEnum, string> = {
  P1Critical: "P1 Critical",
  P2High: "P2 High",
  P3Normal: "P3 Normal",
  Urgent: "Urgent",
};

/**
 * Display labels for the 6 ticket categories (BE TicketCategoryEnum 1–6).
 *
 * Copies of this map in the admin table/queue/list carried five categories the BE enum
 * has never had (Maintenance, Inspection, Emergency, Replacement, Upgrade) — dead keys
 * that could only ever render for a value the API cannot return.
 */
export const TICKET_CATEGORY_LABEL: Record<TicketCategoryEnum, string> = {
  Charging: "Charging fault",
  Overheat: "Overheat",
  NoPower: "No power",
  Performance: "Performance",
  Other: "Other",
  Repair: "Repair",
};

/**
 * Display labels for escalation reasons.
 *
 * Lives in shared because both Manager (escalation dialog + sidebar) and Staff
 * (sidebar) use it — this map used to be copied in two places inside the manager
 * feature, so editing one left the two out of sync.
 */
export const ESCALATION_REASON_LABEL: Record<EscalationReasonEnum, string> = {
  SkillGap: "Skill gap",
  PartsRequired: "Replacement parts required",
  SafetyConcern: "Safety concern",
  SlaBreach: "SLA breach",
  CustomerComplaint: "Customer complaint",
};

/**
 * Display labels for maintenance log types. The raw enum leaks into the UI otherwise —
 * "PartReplacement" / "RemoteSupport" read as identifiers, not as words.
 */
export const MAINTENANCE_LOG_TYPE_LABEL: Record<
  MaintenanceLogTypeEnum,
  string
> = {
  RemoteSupport: "Remote support",
  OnSite: "On site",
  PartReplacement: "Part replacement",
  Inspection: "Inspection",
  Completion: "Completion",
};
