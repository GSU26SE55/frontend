import { z } from "zod";
import {
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketPriorityEnum,
  EscalationReasonEnum,
} from "@/shared/types/ticket.types";

export const triageSchema = z
  .object({
    impact: z.nativeEnum(ImpactScopeEnum),
    urgency: z.nativeEnum(UrgencyLevelEnum),
    manualPriority: z.nativeEnum(TicketPriorityEnum).optional(),
    priorityOverrideReason: z.string().optional(),
    managerComment: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // priorityOverrideReason required when manualPriority is set
    if (val.manualPriority && !val.priorityOverrideReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priorityOverrideReason"],
        message: "Cần nhập lý do khi override priority",
      });
    }
  });

export type TriageFormValues = z.infer<typeof triageSchema>;

export const assignSchema = z.object({
  staffId: z.string().uuid("ID Staff không hợp lệ"),
  notes: z.string().optional(),
});

export type AssignFormValues = z.infer<typeof assignSchema>;

export const reassignSchema = z.object({
  newStaffId: z.string().uuid("ID Staff không hợp lệ"),
  reason: z.string().optional(),
});

export type ReassignFormValues = z.infer<typeof reassignSchema>;

export const rejectSchema = z.object({
  reason: z.string().optional(),
});

export type RejectFormValues = z.infer<typeof rejectSchema>;

export const escalateSchema = z.object({
  reason: z.nativeEnum(EscalationReasonEnum),
  note: z.string().optional(),
});

export type EscalateFormValues = z.infer<typeof escalateSchema>;

const commentAttachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().optional(),
});

export const addCommentSchema = z.object({
  body: z.string().min(1, "Nội dung không được để trống"),
  isInternal: z.boolean(),
  attachments: z.array(commentAttachmentSchema).optional(),
});

export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
