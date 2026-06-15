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
} from "@/shared/enums/ticket.enum";
export {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
  TicketOriginEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  PauseReasonEnum,
  EscalationReasonEnum,
  SlaTimerStatusEnum,
  MaintenanceLogTypeEnum,
  ActivityActionEnum,
  ActorRoleEnum,
} from "@/shared/enums/ticket.enum";
// --- DTOs ---

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
  batteryAssetId?: string | null;
  customerId: string;
  assignedStaffId?: string | null;
  title: string;
  category: TicketCategoryEnum;
  // BE trả null khi ticket chưa triage (state New/Open) — priority/impact/urgency
  // được gán tại bước triage. Guard null trước khi render badge.
  priority: TicketPriorityEnum | null;
  impactScope: ImpactScopeEnum | null;
  urgencyLevel: UrgencyLevelEnum | null;
  status: TicketStatusEnum;
  origin: TicketOriginEnum;
  reopenCount: number;
  isIncident: boolean;
  createdAt: string;
  updatedAt?: string | null;
  slaTimer: SlaTimerDTO | null;
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
  comments?: TicketCommentDTO[] | null;
  maintenanceLogs?: MaintenanceLogDTO[] | null;
  // BE trả mảng FileId (string[]), KHÔNG phải mảng TicketAttachmentDTO.
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

export interface AssignPayload {
  staffId: string;
  notes?: string;
}

export interface ReassignPayload {
  newStaffId: string;
  reason: string;
}

export interface RejectPayload {
  reason: string;
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
