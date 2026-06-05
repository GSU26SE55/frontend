import type {
  PauseReasonEnum,
  EscalationReasonEnum,
  MaintenanceLogTypeEnum,
} from "@/shared/types/ticket.types";
import type { TicketStatusEnum } from "@/shared/types/ticket.types";

export interface StaffTicketsParams {
  status?: TicketStatusEnum;
  pageNumber: number;
  pageSize: number;
}

export interface HoldTicketRequest {
  reason: PauseReasonEnum;
  note?: string;
}

export interface ResolveTicketRequest {
  resolutionSummary?: string;
}

export interface EscalateTicketRequest {
  reason: EscalationReasonEnum;
  note?: string;
}

export interface CommentAttachmentInput {
  fileId: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}

export interface AddCommentRequest {
  body: string;
  isInternal?: boolean;
  attachments?: CommentAttachmentInput[];
}

export interface MaintenanceAttachmentInput {
  fileId: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}

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
