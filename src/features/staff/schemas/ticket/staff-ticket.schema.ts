import { z } from "zod";
import {
  PauseReasonEnum,
  EscalationReasonEnum,
  MaintenanceLogTypeEnum,
} from "@/shared/types/ticket/ticket.types";
import { attachmentSchema } from "@/shared/schemas/ticket/ticket-comment.schema";

// commentAttachment và maintenanceAttachment cùng shape → dùng chung attachmentSchema.
const maintenanceAttachmentSchema = attachmentSchema;

export const holdSchema = z.object({
  reason: z.nativeEnum(PauseReasonEnum),
  note: z.string().optional(),
});
export type HoldFormValues = z.infer<typeof holdSchema>;

export const resolveSchema = z.object({
  // BE required (TicketResolveCommand) — rỗng → 400.
  resolutionSummary: z.string().min(1, "Tổng kết xử lý không được để trống"),
});
export type ResolveFormValues = z.infer<typeof resolveSchema>;

export const escalateRequestSchema = z.object({
  reason: z.nativeEnum(EscalationReasonEnum),
  note: z.string().optional(),
});
export type EscalateRequestFormValues = z.infer<typeof escalateRequestSchema>;

// addCommentSchema dùng chung — nguồn thật ở shared.
export {
  addCommentSchema,
  type AddCommentFormValues,
} from "@/shared/schemas/ticket/ticket-comment.schema";

export const maintenanceLogSchema = z.object({
  // Default RemoteSupport được cung cấp qua form `defaultValues` (RHF), không dùng
  // zod `.default()` để tránh lệch input/output type của resolver.
  logType: z.nativeEnum(MaintenanceLogTypeEnum),
  summary: z.string().min(1, "Tóm tắt công việc không được để trống"),
  diagnosisDetails: z.string().optional(),
  actionsTaken: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
  resolutionNote: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  partsUsed: z.string().optional(),
  attachments: z.array(maintenanceAttachmentSchema).optional(),
  beforePhotos: z.array(maintenanceAttachmentSchema).optional(),
  afterPhotos: z.array(maintenanceAttachmentSchema).optional(),
  relatedKbArticleIds: z.array(z.string()).optional(),
});
export type MaintenanceLogFormValues = z.infer<typeof maintenanceLogSchema>;

// PATCH partial update — chỉ các field text chính. summary nếu nhập thì không rỗng.
export const maintenanceLogUpdateSchema = z.object({
  logType: z.nativeEnum(MaintenanceLogTypeEnum),
  summary: z.string().min(1, "Tóm tắt công việc không được để trống"),
  diagnosisDetails: z.string().optional(),
  actionsTaken: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
  resolutionNote: z.string().optional(),
  partsUsed: z.string().optional(),
});
export type MaintenanceLogUpdateFormValues = z.infer<
  typeof maintenanceLogUpdateSchema
>;
