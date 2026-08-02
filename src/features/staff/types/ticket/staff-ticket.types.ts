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
  /** GH-132 (E) — chỉ ticket đang mở còn SLA timer (cho SLA Monitor). */
  slaOpen?: boolean;
  /** GH-132 (E) — "slaRemaining" = sort theo hạn SLA còn lại tăng dần. */
  sortBy?: "slaRemaining";
}

// `POST /api/staff/tickets/{id}/start` KHÔNG nhận body — controller khai
// `Start(Guid id, CancellationToken ct)`, không có [FromBody]. Command chỉ lấy
// TicketId + StaffId/StaffName từ JWT nên mọi field gửi lên đều bị bỏ qua im lặng.

export interface HoldTicketRequest {
  reason: PauseReasonEnum;
  note?: string;
}

export interface ResolveTicketRequest {
  resolutionSummary: string;
}

export interface EscalateTicketRequest {
  reason: EscalationReasonEnum;
  note?: string;
}

// CommentAttachmentInput trùng shape với shared → dùng chung, không định nghĩa lại.
export type { CommentAttachmentInput } from "@/shared/types/ticket/ticket.types";
import type { CommentAttachmentInput } from "@/shared/types/ticket/ticket.types";

export interface AddCommentRequest {
  body: string;
  isInternal?: boolean;
  attachments?: CommentAttachmentInput[];
}

// MaintenanceAttachmentInput cùng shape với CommentAttachmentInput → alias, không lặp 4 field.
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
// Mọi field optional; chỉ Staff tạo log mới sửa được; khoá khi ticket
// Resolved/ClosedPendingRate/Closed (BE enforce).
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
