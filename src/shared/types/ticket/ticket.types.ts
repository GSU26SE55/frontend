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
 * #697 — 1 dòng phân công Staff trên ticket. BE đã lọc bản ghi soft-deleted.
 * Đúng 1 phần tử role=PrimaryHandler, 0..N phần tử role=Supporter.
 */
export interface TicketAssignmentDTO {
  staffId: string;
  role: TicketAssignmentRoleEnum;
  /**
   * Tên nhân viên — BE lấy từ StaffAccount đã sync sang TicketService.
   * Null khi chưa sync kịp → hiển thị fallback `staffId`.
   *
   * Nhờ field này mà MỌI role đọc được tên; trước đây phải gọi thêm
   * `/api/staff` (chỉ Admin/Manager) nên Staff không hiện được ai phụ trách.
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
  /** Pin chính (legacy — pin đầu tiên). Dùng batteryAssetIds cho danh sách đầy đủ. */
  batteryAssetId?: string | null;
  /** Danh sách ID pin gắn ticket (ticket có thể gắn nhiều pin). BE trả từ TicketBatteryAssets. */
  batteryAssetIds?: string[];
  customerId: string;
  /**
   * #697 — thay cho `assignedStaffId` (đã bỏ ở BE). Dùng
   * `getPrimaryHandler()` / `getSupporters()` (shared/utils/ticket/assignments)
   * thay vì tự lọc ở từng chỗ.
   */
  assignments: TicketAssignmentDTO[];
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
  /** BE tính sẵn theo user hiện tại — dùng chấm badge chat chưa đọc trên danh sách. */
  hasUnreadChat: boolean;
  createdAt: string;
  updatedAt?: string | null;
  slaTimer: SlaTimerDTO | null;

  // ── Ticket thủ công: giờ phát hiện + serial pin (snapshot) + AI verify + merge ──
  /**
   * GH-866 — MỘT mốc thời gian Customer phát hiện sự cố (ISO-8601 UTC), thay cho
   * cặp `incidentDetectedFrom`/`To` đã bị BE xoá. Khác `createdAt`.
   * Null với ticket sinh tự động từ Alert.
   */
  detectedAt?: string | null;
  /** Serial pin (snapshot lúc tạo) — hiển thị không cần gọi thêm API. */
  batterySerialNumber?: string | null;
  /** Trạng thái AI verify thật/rác (human-in-the-loop). */
  aiVerifyStatus?: TicketVerifyStatusEnum | null;
  /** Điểm hợp lệ [0..1] từ AI. */
  aiVerifyScore?: number | null;
  /** Lý do AI đưa ra verdict (cho Manager đọc). */
  aiVerifyReason?: string | null;
  /** Ticket bị nghi trùng với ticket này (cùng pin/chủ, còn mở). */
  suspectedDuplicateOfTicketId?: string | null;
  /** Lý do nghi trùng. */
  duplicateReason?: string | null;
  /** Set khi Manager đã gộp ticket này vào ticket khác (ẩn khỏi queue). */
  mergedIntoTicketId?: string | null;
  /** Lý do đóng đặc biệt — set cùng `mergedIntoTicketId` khi Manager gộp ticket. */
  closeReason?: TicketCloseReasonEnum | null;
}

/** Payload gộp ticket (Manager) — gộp ticket hiện tại vào ticket đích. */
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
  // BE trả sẵn trên cùng response GET .../chats (TicketChatDTO) — trước đây chưa type.
  editCount?: number;
  updatedAt?: string | null;
  /**
   * User hiện tại đã đọc tin này chưa. BE set ở GET /chats (list + cursor); tin do chính
   * mình gửi luôn true. Realtime ChatAdded KHÔNG kèm → undefined = "chưa biết", đừng coi
   * undefined là chưa đọc (sẽ vẽ nhầm mốc "Tin nhắn chưa đọc").
   */
  isRead?: boolean;
  // Chat thoại (tạo qua POST /chats/voice): Pending/Processing = đang transcribe (body tạm rỗng),
  // Completed = body đã có transcript, Failed = lỗi → cho phép retry. null với chat text thường.
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

// GET /api/staff/tickets/maintenance-logs/me — log cá nhân gom theo ticket.
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
   * BE trả `chats` (TicketChatDTO[]) — KHÔNG còn `comments`.
   * `TicketCommentsController` đã bị xoá; `TicketCommentDTO` ở file này chính là
   * shape của TicketChatDTO (giữ tên cũ để không phải đổi toàn bộ call site).
   */
  chats?: TicketCommentDTO[] | null;
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
 * #697 — POST /api/admin/tickets/{id}/assign.
 * Primary phải active + available + đủ skill tier theo priority (không đạt → 403).
 * Supporter KHÔNG bị check tier, nhưng không được trùng Primary và không trùng nhau.
 */
export interface AssignPayload {
  primaryHandlerStaffId: string;
  supporterStaffIds: string[];
  notes?: string;
}

/**
 * #697 — POST /api/admin/tickets/{id}/reassign.
 * Primary hiện tại tự động hạ thành Supporter; KHÔNG gửi lại danh sách supporter.
 * SLA timer không reset.
 */
export interface ReassignPayload {
  newPrimaryHandlerStaffId: string;
  reason: string;
}

export interface RejectPayload {
  reason: string;
}

// Tách riêng khỏi RejectPayload — gắn 1-1 với TicketTriageRejectCommand
// (luồng Open|Escalated → ClosedRejected), khác RejectPayload (Resolved → InProgress).
export interface TriageRejectPayload {
  reason: string;
}

export interface EscalatePayload {
  reason: EscalationReasonEnum;
  note?: string;
}

// POST /api/admin/tickets/{id}/re-prioritize — Manager đổi priority kèm lý do.
// KHÔNG gửi managerId/managerName/ticketId: BE lấy identity từ JWT, ticket id từ URL.
export interface ReprioritizePayload {
  priority: TicketPriorityEnum;
  reason: string;
}

export interface CommentAttachmentInput {
  fileId: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}

// @-mention gửi lên BE (POST /chats field `mentions`) — khớp record ChatMentionInput.
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
