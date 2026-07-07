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
  // BE required (TicketReassignCommand) — rỗng → 400.
  reason: z.string().min(1, "Lý do điều chuyển không được để trống"),
});

export type ReassignFormValues = z.infer<typeof reassignSchema>;

export const rejectSchema = z.object({
  // BE required (TicketRejectCommand) — rỗng → 400.
  reason: z.string().min(1, "Lý do từ chối không được để trống"),
});

export type RejectFormValues = z.infer<typeof rejectSchema>;

export const triageRejectSchema = z.object({
  // BE required (TicketTriageRejectCommand) — Open|Escalated → ClosedRejected.
  // Rỗng → 400 (Field "Reason"). Không reuse rejectSchema (1-1 với 1 BE command).
  reason: z.string().min(1, "Lý do từ chối không được để trống"),
});

export type TriageRejectFormValues = z.infer<typeof triageRejectSchema>;

export const escalateSchema = z.object({
  reason: z.nativeEnum(EscalationReasonEnum),
  note: z.string().optional(),
});

export type EscalateFormValues = z.infer<typeof escalateSchema>;

export const declareIncidentSchema = z.object({
  // BE required (TicketDeclareIncidentCommand) — rỗng/whitespace → 400.
  incidentDescription: z.string().min(1, "Mô tả sự cố không được để trống"),
});

export type DeclareIncidentFormValues = z.infer<typeof declareIncidentSchema>;

const commentAttachmentSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().optional(),
});

export const addCommentSchema = z.object({
  // Không validate rỗng — UI disable nút gửi khi rỗng thay vì báo lỗi.
  body: z.string(),
  isInternal: z.boolean(),
  attachments: z.array(commentAttachmentSchema).optional(),
});

export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
