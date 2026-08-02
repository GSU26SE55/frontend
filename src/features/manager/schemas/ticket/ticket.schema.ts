import { z } from "zod";
import {
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketPriorityEnum,
  EscalationReasonEnum,
} from "@/shared/types/ticket/ticket.types";

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

// #697 — 1 Primary Handler + N Supporter (TicketAssignCommand).
export const assignSchema = z
  .object({
    primaryHandlerStaffId: z.string().uuid("ID Staff không hợp lệ"),
    // Staff phụ (Collaborator trong chat) — hỗ trợ, không tính workload/KPI.
    supporterStaffIds: z.array(z.string().uuid()),
    notes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.supporterStaffIds.includes(val.primaryHandlerStaffId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supporterStaffIds"],
        message: "Staff phụ trách chính không được nằm trong danh sách hỗ trợ",
      });
    }
    if (new Set(val.supporterStaffIds).size !== val.supporterStaffIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supporterStaffIds"],
        message: "Danh sách Staff hỗ trợ bị trùng",
      });
    }
  });

export type AssignFormValues = z.infer<typeof assignSchema>;

// #697 — Primary hiện tại tự động hạ thành Supporter, không gửi lại supporter list.
export const reassignSchema = z.object({
  newPrimaryHandlerStaffId: z.string().uuid("ID Staff không hợp lệ"),
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

// TicketReprioritizeCommand — reason bắt buộc, BE giới hạn 1000 ký tự.
export const reprioritizeSchema = z.object({
  priority: z.nativeEnum(TicketPriorityEnum),
  reason: z
    .string()
    .trim()
    .min(1, "Lý do đổi mức ưu tiên không được để trống")
    .max(1000, "Lý do tối đa 1000 ký tự"),
});

export type ReprioritizeFormValues = z.infer<typeof reprioritizeSchema>;

export const declareIncidentSchema = z.object({
  // BE required (TicketDeclareIncidentCommand) — rỗng/whitespace → 400.
  incidentDescription: z.string().min(1, "Mô tả sự cố không được để trống"),
});

export type DeclareIncidentFormValues = z.infer<typeof declareIncidentSchema>;

// addCommentSchema dùng chung — nguồn thật ở shared (trùng admin/manager/staff).
export {
  addCommentSchema,
  type AddCommentFormValues,
} from "@/shared/schemas/ticket/ticket-comment.schema";
