import { z } from "zod";
import {
  PauseReasonEnum,
  EscalationReasonEnum,
  MaintenanceLogTypeEnum,
} from "@/shared/types/ticket/ticket.types";
import { attachmentSchema } from "@/shared/schemas/ticket/ticket-comment.schema";

// commentAttachment and maintenanceAttachment share a shape → both use attachmentSchema.
const maintenanceAttachmentSchema = attachmentSchema;

// GH-1176: rescheduledStartAtUtc required — hold requires a future customer appointment.
export const holdSchema = z.object({
  reason: z.nativeEnum(PauseReasonEnum),
  rescheduledStartAtUtc: z
    .string()
    .min(1, "A future appointment is required")
    .refine(
      (v) => new Date(v) > new Date(),
      "Appointment must be in the future",
    ),
  note: z.string().optional(),
});
export type HoldFormValues = z.infer<typeof holdSchema>;

export const resolveSchema = z.object({
  // Required by the BE (TicketResolveCommand) — empty → 400.
  resolutionSummary: z.string().min(1, "This field is required"),
});
export type ResolveFormValues = z.infer<typeof resolveSchema>;

export const escalateRequestSchema = z.object({
  reason: z.nativeEnum(EscalationReasonEnum),
  note: z.string().optional(),
});
export type EscalateRequestFormValues = z.infer<typeof escalateRequestSchema>;

// Shared addCommentSchema — the real source lives in shared.
export {
  addCommentSchema,
  type AddCommentFormValues,
} from "@/shared/schemas/ticket/ticket-comment.schema";

export const maintenanceLogSchema = z.object({
  // The RemoteSupport default comes from the form `defaultValues` (RHF) rather than
  // zod `.default()`, to avoid a mismatch between the resolver input and output types.
  logType: z.nativeEnum(MaintenanceLogTypeEnum),
  summary: z.string().min(1, "This field is required"),
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

// PATCH partial update — main text fields only. If summary is provided it must not be empty.
export const maintenanceLogUpdateSchema = z.object({
  logType: z.nativeEnum(MaintenanceLogTypeEnum),
  summary: z.string().min(1, "This field is required"),
  diagnosisDetails: z.string().optional(),
  actionsTaken: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
  resolutionNote: z.string().optional(),
  partsUsed: z.string().optional(),
});
export type MaintenanceLogUpdateFormValues = z.infer<
  typeof maintenanceLogUpdateSchema
>;
