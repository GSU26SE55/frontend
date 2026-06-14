import { z } from "zod";
import {
  PauseReasonEnum,
  EscalationReasonEnum,
  MaintenanceLogTypeEnum,
} from "@/shared/types/ticket.types";

const commentAttachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
});

const maintenanceAttachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
});

export const holdSchema = z.object({
  reason: z.nativeEnum(PauseReasonEnum),
  note: z.string().optional(),
});
export type HoldFormValues = z.infer<typeof holdSchema>;

export const resolveSchema = z.object({
  resolutionSummary: z.string().optional(),
});
export type ResolveFormValues = z.infer<typeof resolveSchema>;

export const escalateRequestSchema = z.object({
  reason: z.nativeEnum(EscalationReasonEnum),
  note: z.string().optional(),
});
export type EscalateRequestFormValues = z.infer<typeof escalateRequestSchema>;

export const addCommentSchema = z.object({
  body: z.string().min(1, "Nội dung bình luận không được để trống"),
  isInternal: z.boolean(),
  attachments: z.array(commentAttachmentSchema).optional(),
});
export type AddCommentFormValues = z.infer<typeof addCommentSchema>;

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
