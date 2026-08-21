import type {
  PauseReasonEnum,
  EscalationReasonEnum,
  MaintenanceLogTypeEnum,
} from "@/shared/types/ticket/ticket.types";
import type { TicketStatusEnum } from "@/shared/types/ticket/ticket.types";

export interface StaffTicketsParams {
  status?: TicketStatusEnum;
  pageNumber: number;
  pageSize: number;
  /** GH-132 (E) — only open tickets that still have an SLA timer (for the SLA Monitor). */
  slaOpen?: boolean;
  /** GH-132 (E) — "slaRemaining" = sort by SLA time remaining, ascending. */
  sortBy?: "slaRemaining";
}

// `POST /api/staff/tickets/{id}/start` takes NO body — the controller declares
// `Start(Guid id, CancellationToken ct)` with no [FromBody]. The command only reads
// TicketId + StaffId/StaffName from the JWT, so any field sent is silently ignored.

// GH-1176: rescheduledStartAt required — hold requires a future appointment.
// Field name must match BE TicketHoldCommand.RescheduledStartAt exactly (no Utc suffix).
export interface HoldTicketRequest {
  reason: PauseReasonEnum;
  /** ISO-8601 UTC; must be in the future (BE validates). */
  rescheduledStartAt: string;
  /** Required by the BE — empty/whitespace → 400. */
  note: string;
}

// GH-1176: reason required — BE TicketResumeCommand.Reason (early-resume audit trail).
export interface ResumeTicketRequest {
  reason: string;
}

export interface ResolveTicketRequest {
  resolutionSummary: string;
}

export interface EscalateTicketRequest {
  reason: EscalationReasonEnum;
  note?: string;
}

// CommentAttachmentInput has the same shape as the shared one → reuse it rather than redefining it.
export type { CommentAttachmentInput } from "@/shared/types/ticket/ticket.types";
import type { CommentAttachmentInput } from "@/shared/types/ticket/ticket.types";

export interface AddCommentRequest {
  body: string;
  isInternal?: boolean;
  attachments?: CommentAttachmentInput[];
}

// MaintenanceAttachmentInput has the same shape as CommentAttachmentInput → aliased instead of repeating 4 fields.
export type MaintenanceAttachmentInput = CommentAttachmentInput;

export interface AddMaintenanceLogRequest {
  logType?: MaintenanceLogTypeEnum;
  summary: string;
  diagnosisDetails?: string;
  actionsTaken?: string;
  durationMinutes?: number;
  resolutionNote?: string;
  startedAt?: string;
  completedAt?: string;
  partsUsed?: string;
  attachments?: MaintenanceAttachmentInput[];
  beforePhotos?: MaintenanceAttachmentInput[];
  afterPhotos?: MaintenanceAttachmentInput[];
  relatedKbArticleIds?: string[];
}

// PATCH /api/tickets/{ticketId}/maintenance-logs/{logId} — partial update.
// Every field is optional; only the Staff member who created the log can edit it; locked once the
// ticket is Resolved/ClosedPendingRate/Closed (enforced by the BE).
export interface UpdateMaintenanceLogRequest {
  logType?: MaintenanceLogTypeEnum;
  summary?: string;
  diagnosisDetails?: string;
  actionsTaken?: string;
  durationMinutes?: number;
  resolutionNote?: string;
  partsUsed?: string;
  attachments?: MaintenanceAttachmentInput[];
  beforePhotos?: MaintenanceAttachmentInput[];
  afterPhotos?: MaintenanceAttachmentInput[];
  relatedKbArticleIds?: string[];
}
