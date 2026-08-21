import type {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
  TicketOriginEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  EscalationReasonEnum,
  SlaTimerStatusEnum,
  MaintenanceLogTypeEnum,
  ActivityActionEnum,
  ActorRoleEnum,
  TicketVerifyStatusEnum,
  TicketCloseReasonEnum,
  TicketAssignmentRoleEnum,
  PendingContextEnum,
  PauseReasonEnum,
} from "@/shared/enums/ticket/ticket.enum";
import type { VoiceTranscriptionStatusEnum } from "@/shared/enums/ticket/chat.enum";
export { VoiceTranscriptionStatusEnum } from "@/shared/enums/ticket/chat.enum";
export {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
  TicketOriginEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  PendingContextEnum,
  PauseReasonEnum,
  EscalationReasonEnum,
  SlaTimerStatusEnum,
  MaintenanceLogTypeEnum,
  ActivityActionEnum,
  ActorRoleEnum,
  TicketVerifyStatusEnum,
  TicketCloseReasonEnum,
  TicketAssignmentRoleEnum,
} from "@/shared/enums/ticket/ticket.enum";
// --- DTOs ---

/**
 * #697 — one Staff assignment row on a ticket. The BE already filters out
 * soft-deleted records. Exactly one entry with role=PrimaryHandler, and
 * 0..N entries with role=Supporter.
 */
export interface TicketAssignmentDTO {
  staffId: string;
  role: TicketAssignmentRoleEnum;
  /**
   * Staff member's name — the BE reads it from the StaffAccount synced into
   * TicketService. Null when the sync hasn't caught up → fall back to `staffId`.
   *
   * This field is what lets EVERY role read the name; previously it took an extra
   * call to `/api/staff` (Admin/Manager only), so Staff could not see who was
   * handling the ticket.
   */
  staffName?: string | null;
}

export interface SlaTimerDTO {
  id: string;
  priority: TicketPriorityEnum;
  startedAt: string;
  dueAt: string;
  originalDueAt: string;
  totalPausedMinutes: number;
  warningSentAt?: string | null;
  breachAt?: string | null;
  status: SlaTimerStatusEnum;
  remainingPercent: number;
}

export interface TicketDTO {
  id: string;
  code: string;
  /** Primary battery (legacy — the first one). Use batteryAssetIds for the full list. */
  batteryAssetId?: string | null;
  /**
   * IDs of the batteries attached to the ticket (a ticket can cover several).
   * The BE returns them from TicketBatteryAssets.
   */
  batteryAssetIds?: string[];
  customerId: string;
  /**
   * #697 — replaces `assignedStaffId` (dropped on the BE). Use
   * `getPrimaryHandler()` / `getSupporters()` (shared/utils/ticket/assignments)
   * instead of filtering by hand at each call site.
   */
  assignments: TicketAssignmentDTO[];
  title: string;
  category: TicketCategoryEnum;
  // The BE returns null while the ticket hasn't been triaged (state New/Open) —
  // priority/impact/urgency are assigned during triage. Guard against null before
  // rendering the badge.
  priority: TicketPriorityEnum | null;
  impactScope: ImpactScopeEnum | null;
  urgencyLevel: UrgencyLevelEnum | null;
  status: TicketStatusEnum;
  origin: TicketOriginEnum;
  reopenCount: number;
  isIncident: boolean;
  /**
   * Environmental incident (smoke, gas leak, flooding) this ticket was auto-created from.
   * Null on every other ticket.
   *
   * Presence of this id is what makes a ticket *site-level*: the fault is in the cabinet, not in
   * one battery, so `batteryAssetId` is empty by design. Without it the UI cannot tell "no battery
   * attached" apart from "battery data not loaded yet", and falls back to the battery layout —
   * printing a row of blanks plus a "Battery serial —" that can never hold a value.
   */
  environmentalIncidentId?: string | null;
  /** GH-1176: UTC schedule set during assign/reschedule. Null when no schedule has been set. */
  scheduledStartAtUtc?: string | null;
  /** GH-1176: incremented on every assign/reschedule; used for optimistic activation. */
  scheduleVersion: number;
  /** GH-1244: source ticket whose completed maintenance starts this periodic cycle. */
  periodicMaintenanceSourceTicketId?: string | null;
  /** GH-1244: planned maintenance due time calculated by the backend. */
  periodicMaintenanceDueAtUtc?: string | null;
  /** GH-1244: last time the Customer may select the initial visit schedule. */
  periodicMaintenanceScheduleDeadlineAtUtc?: string | null;
  /** GH-1244: backend-derived identity; false for ordinary tickets. */
  isPeriodicMaintenance: boolean;
  /** GH-1244: backend-derived due state; do not recalculate business rules on the client. */
  isPeriodicMaintenanceOverdue: boolean;
  /** GH-1176: why the ticket is Pending — Scheduled (initial assignment) or Held (staff hold). */
  pendingContext?: PendingContextEnum | null;
  /** GH-1176: hold reason — only set when pendingContext=Held. */
  pendingReason?: PauseReasonEnum | null;
  /** GH-1176: active incident episode ID (set when priority=Urgent + isIncident=true). */
  activeIncidentEpisodeId?: string | null;
  /**
   * Precomputed by the BE for the current user — drives the unread-chat dot on
   * the list.
   */
  hasUnreadChat: boolean;
  createdAt: string;
  updatedAt?: string | null;
  slaTimer: SlaTimerDTO | null;

  // ── Manual ticket: detection time + battery serial (snapshot) + AI verify + merge ──
  /**
   * GH-866 — a SINGLE timestamp for when the Customer noticed the incident
   * (ISO-8601 UTC), replacing the `incidentDetectedFrom`/`To` pair the BE removed.
   * Distinct from `createdAt`. Null for tickets generated automatically from an Alert.
   */
  detectedAt?: string | null;
  /** Battery serial (snapshot at creation) — displayed without an extra API call. */
  batterySerialNumber?: string | null;
  /** AI verdict on whether the ticket is genuine or junk (human-in-the-loop). */
  aiVerifyStatus?: TicketVerifyStatusEnum | null;
  /** Validity score [0..1] from the AI. */
  aiVerifyScore?: number | null;
  /** The AI's reasoning behind the verdict (for the Manager to read). */
  aiVerifyReason?: string | null;
  /** Ticket this one is suspected of duplicating (same battery/owner, still open). */
  suspectedDuplicateOfTicketId?: string | null;
  /** Why it is suspected of being a duplicate. */
  duplicateReason?: string | null;
  /** Set once a Manager merged this ticket into another one (hidden from the queue). */
  mergedIntoTicketId?: string | null;
  /** Special close reason — set alongside `mergedIntoTicketId` on a Manager merge. */
  closeReason?: TicketCloseReasonEnum | null;
}

/** Merge payload (Manager) — merges the current ticket into the target ticket. */
export interface MergeTicketPayload {
  targetTicketId: string;
}

export interface TicketActivityDTO {
  id: string;
  ticketId: string;
  actorUserId?: string | null;
  actorRole: ActorRoleEnum;
  actorDisplayName?: string | null;
  action: ActivityActionEnum;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface TicketCommentDTO {
  id: string;
  ticketId: string;
  authorUserId?: string | null;
  authorRole: ActorRoleEnum;
  authorDisplayName?: string | null;
  body: string;
  isInternal: boolean;
  attachmentFileIds?: string[] | null;
  createdAt: string;
  // Already returned on the same GET .../chats response (TicketChatDTO) — it just
  // wasn't typed before.
  editCount?: number;
  updatedAt?: string | null;
  /**
   * Whether the current user has read this message. The BE sets it on GET /chats
   * (list + cursor); messages you sent yourself are always true. The realtime
   * ChatAdded event does NOT include it → undefined means "unknown", so don't treat
   * undefined as unread (it would draw the "Unread messages" divider in the wrong
   * place).
   */
  isRead?: boolean;
  // Voice chat (created via POST /chats/voice): Pending/Processing = transcribing (body is
  // temporarily empty), Completed = body holds the transcript, Failed = error → allow retry.
  // null for ordinary text chat.
  voiceTranscriptionStatus?: VoiceTranscriptionStatusEnum | null;
}

export interface MaintenanceLogDTO {
  id: string;
  ticketId: string;
  staffId: string;
  logType: MaintenanceLogTypeEnum;
  summary?: string | null;
  diagnosisDetails?: string | null;
  actionsTaken?: string | null;
  durationMinutes: number;
  resolutionNote?: string | null;
  startedAt: string;
  completedAt?: string | null;
  attachmentFileIds?: string[] | null;
  beforePhotosFileIds?: string[] | null;
  afterPhotosFileIds?: string[] | null;
  relatedKbArticleIds?: string[] | null;
  createdAt: string;
}

// GET /api/staff/tickets/maintenance-logs/me — your own logs, grouped by ticket.
export interface StaffMaintenanceLogGroupDTO {
  ticketId: string;
  ticketCode: string;
  ticketTitle: string;
  logs: MaintenanceLogDTO[];
}

export interface TicketDetailDTO extends TicketDTO {
  description?: string | null;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  resolvedByStaffId?: string | null;
  approvedAt?: string | null;
  approvedByManagerId?: string | null;
  rejectionReason?: string | null;
  closedAt?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  ratedAt?: string | null;
  escalatedAt?: string | null;
  escalationReason?: EscalationReasonEnum;
  originAlertId?: string | null;
  activities?: TicketActivityDTO[] | null;
  /**
   * The BE returns `chats` (TicketChatDTO[]) — there is NO `comments` any more.
   * `TicketCommentsController` was deleted; the `TicketCommentDTO` in this file is
   * exactly the shape of TicketChatDTO (the old name is kept so we don't have to
   * touch every call site).
   */
  chats?: TicketCommentDTO[] | null;
  maintenanceLogs?: MaintenanceLogDTO[] | null;
  // The BE returns an array of FileIds (string[]), NOT an array of TicketAttachmentDTO.
  attachmentFileIds?: string[] | null;
}

// --- Action Response ---

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
  sortBy?: string;
  sortDir?: string;
}

export interface AdminTicketQueueParams {
  priority?: TicketPriorityEnum;
  category?: TicketCategoryEnum;
  pageNumber?: number;
  pageSize?: number;
}

export interface StaffTicketListParams {
  status?: TicketStatusEnum;
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

/**
 * POST /api/admin/tickets/{id}/assign — GH-1176: scheduledStartAtUtc is now required.
 * Current window [nowUtc-5m, nowUtc] → direct InProgress; future → Pending (no SLA yet).
 */
export interface AssignPayload {
  primaryHandlerStaffId: string;
  priority: TicketPriorityEnum;
  supporterStaffIds: string[];
  /** ISO-8601 UTC; BE classifies as current (≤nowUtc) or future (>nowUtc). */
  scheduledStartAtUtc: string;
  notes?: string;
}

/**
 * POST /api/admin/tickets/{id}/reassign — GH-1176: scheduledStartAtUtc required.
 * Same current/future classification as AssignPayload.
 */
export interface ReassignPayload {
  newPrimaryHandlerStaffId: string;
  reason: string;
  /** ISO-8601 UTC; determines ReAssign→InProgress (current) or ReAssign→Pending (future). */
  scheduledStartAtUtc: string;
}

export interface RejectPayload {
  reason: string;
}

// Kept separate from RejectPayload — it maps 1-1 to TicketTriageRejectCommand
// (the Open|Escalated → ClosedRejected flow), unlike RejectPayload
// (Resolved → InProgress).
export interface TriageRejectPayload {
  reason: string;
}

// POST /api/admin/tickets/{id}/escalation-decision — Manager approves or rejects a Staff
// escalation request. Maps 1-1 to BE TicketEscalationDecisionCommand.
export interface EscalationDecisionPayload {
  approve: boolean;
  reason: string;
  keepCurrentPrimary: boolean;
}

// POST /api/admin/tickets/{id}/re-prioritize — Manager changes the priority with a reason.
// Do NOT send managerId/managerName/ticketId: the BE takes the identity from the JWT and
// the ticket id from the URL.
export interface ReprioritizePayload {
  // The BE derives the priority from the Impact × Urgency matrix (User Guide §3.9) —
  // the client never sends priority directly.
  impact: ImpactScopeEnum;
  urgency: UrgencyLevelEnum;
  reason: string;
}

export interface CommentAttachmentInput {
  fileId: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}

// @-mention sent to the BE (POST /chats, field `mentions`) — matches the
// ChatMentionInput record.
export interface CommentMentionInput {
  userId: string;
  displayName: string;
}

export interface AddCommentPayload {
  body: string;
  isInternal: boolean;
  attachments?: CommentAttachmentInput[];
  mentions?: CommentMentionInput[];
}
