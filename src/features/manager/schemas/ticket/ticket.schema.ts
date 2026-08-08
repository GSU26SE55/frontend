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
        message: "A reason is required when overriding priority",
      });
    }
  });

export type TriageFormValues = z.infer<typeof triageSchema>;

// #697 — 1 Primary Handler + N Supporter (TicketAssignCommand).
export const assignSchema = z
  .object({
    primaryHandlerStaffId: z.string().uuid("Invalid Staff ID"),
    // Supporting Staff (Collaborators in chat) — they assist, but don't count toward workload/KPI.
    supporterStaffIds: z.array(z.string().uuid()),
    notes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.supporterStaffIds.includes(val.primaryHandlerStaffId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supporterStaffIds"],
        message: "The primary handler can't also be in the supporter list",
      });
    }
    if (new Set(val.supporterStaffIds).size !== val.supporterStaffIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supporterStaffIds"],
        message: "The supporter list contains duplicates",
      });
    }
  });

export type AssignFormValues = z.infer<typeof assignSchema>;

// #697 — the current Primary is automatically demoted to Supporter; don't resend the supporter list.
export const reassignSchema = z.object({
  newPrimaryHandlerStaffId: z.string().uuid("Invalid Staff ID"),
  // Required by the BE (TicketReassignCommand) — empty → 400.
  reason: z.string().min(1, "Reassignment reason is required"),
});

export type ReassignFormValues = z.infer<typeof reassignSchema>;

export const rejectSchema = z.object({
  // Required by the BE (TicketRejectCommand) — empty → 400.
  reason: z.string().min(1, "Rejection reason is required"),
});

export type RejectFormValues = z.infer<typeof rejectSchema>;

export const triageRejectSchema = z.object({
  // Required by the BE (TicketTriageRejectCommand) — Open|Escalated → ClosedRejected.
  // Empty → 400 (Field "Reason"). Don't reuse rejectSchema (one schema maps 1-1 to one BE command).
  reason: z.string().min(1, "Rejection reason is required"),
});

export type TriageRejectFormValues = z.infer<typeof triageRejectSchema>;

export const escalateSchema = z.object({
  reason: z.nativeEnum(EscalationReasonEnum),
  note: z.string().optional(),
});

export type EscalateFormValues = z.infer<typeof escalateSchema>;

// TicketReprioritizeCommand — reason is required, and the BE caps it at 1000 characters.
// Send Impact + Urgency and NOT priority: User Guide §3.9 states that priority is derived
// from the Impact × Urgency matrix rather than entered directly. The BE recalculates it.
export const reprioritizeSchema = z.object({
  impact: z.nativeEnum(ImpactScopeEnum),
  urgency: z.nativeEnum(UrgencyLevelEnum),
  reason: z
    .string()
    .trim()
    .min(1, "A reason for the priority change is required")
    .max(1000, "Reason must be at most 1000 characters"),
});

export type ReprioritizeFormValues = z.infer<typeof reprioritizeSchema>;

export const declareIncidentSchema = z.object({
  // Required by the BE (TicketDeclareIncidentCommand) — empty/whitespace → 400.
  incidentDescription: z.string().min(1, "Incident description is required"),
});

export type DeclareIncidentFormValues = z.infer<typeof declareIncidentSchema>;

// Shared addCommentSchema — the real source lives in shared (identical across admin/manager/staff).
export {
  addCommentSchema,
  type AddCommentFormValues,
} from "@/shared/schemas/ticket/ticket-comment.schema";
