import type { EscalationReasonEnum } from "@/shared/types/ticket/ticket.types";

/**
 * Display labels for escalation reasons.
 *
 * Lives in shared because both Manager (escalation dialog + sidebar) and Staff
 * (sidebar) use it — this map used to be copied in two places inside the manager
 * feature, so editing one left the two out of sync.
 */
export const ESCALATION_REASON_LABEL: Record<EscalationReasonEnum, string> = {
  SkillGap: "Skill gap",
  PartsRequired: "Replacement parts required",
  SafetyConcern: "Safety concern",
  SlaBreach: "SLA breach",
  CustomerComplaint: "Customer complaint",
};
