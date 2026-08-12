// PrimaryHandler tier rules by ticket priority — mirrors the BE's
// `TicketService.Application.Common.Helpers.AssignmentRoleHelper`.
// This FE copy exists to warn EARLY; it does NOT replace the BE check:
// the BE still returns 403 for anything that slips through. If the BE rule changes,
// this file has to change with it.

import {
  StaffSkillTierEnum,
  StaffSkillTierLabel,
  StaffSkillTierShortLabel,
} from "@/shared/enums/account/staff-tier.enum";
import { TicketPriorityEnum } from "@/shared/enums/ticket/ticket.enum";

/**
 * Minimum tier a PrimaryHandler must reach.
 * Urgent/P1 → Tier 3 · P2 → Tier 2 · P3 → Tier 1.
 * Returns `null` when the ticket has not been triaged (priority null) — the BE skips the
 * tier check in that case (`ticket.Priority.HasValue`), so the FE does not block it either.
 */
export function getMinTierForPriority(
  priority: TicketPriorityEnum | null | undefined,
): StaffSkillTierEnum | null {
  switch (priority) {
    case TicketPriorityEnum.Urgent:
    case TicketPriorityEnum.P1Critical:
      return StaffSkillTierEnum.SeniorSpecialist;
    case TicketPriorityEnum.P2High:
      return StaffSkillTierEnum.ModuleSpecialist;
    case TicketPriorityEnum.P3Normal:
      return StaffSkillTierEnum.Generalist;
    default:
      return null;
  }
}

/**
 * Whether a staff member's tier is high enough to be the PrimaryHandler.
 *
 * Safe fallback: `skillTier` undefined (the BE does not expose the field yet) → returns `true`.
 * Better to let the Manager try and get a 403 than to lock the whole list by mistake.
 */
export function isEligiblePrimaryHandler(
  skillTier: number | undefined,
  minTier: StaffSkillTierEnum | null,
): boolean {
  if (minTier === null || skillTier === undefined) return true;
  return skillTier >= minTier;
}

// Short labels — match TicketPriorityBadge so the Manager can line them up with the badge
// on the ticket.
const PRIORITY_SHORT_LABEL: Record<TicketPriorityEnum, string> = {
  [TicketPriorityEnum.Urgent]: "Urgent",
  [TicketPriorityEnum.P1Critical]: "P1 · Critical",
  [TicketPriorityEnum.P2High]: "P2 · High",
  [TicketPriorityEnum.P3Normal]: "P3 · Standard",
};

/**
 * One-line label for a staff option in the dropdown: "Name · Tier 2".
 * Drops the tier part when the BE has not returned `skillTier` — never shows "Tier undefined".
 */
export function staffOptionLabel(staff: {
  accountId: string;
  fullName?: string | null;
  skillTier?: number;
}): string {
  const name = staff.fullName ?? staff.accountId;
  if (staff.skillTier === undefined) return name;
  return `${name} · ${StaffSkillTierShortLabel[staff.skillTier] ?? `Tier ${staff.skillTier}`}`;
}

/** Hint shown in the assign/reassign dialog. `null` = no constraint. */
export function getTierRequirementHint(
  priority: TicketPriorityEnum | null | undefined,
): string | null {
  const minTier = getMinTierForPriority(priority);
  if (!priority || minTier === null) return null;
  return `A ${PRIORITY_SHORT_LABEL[priority]} ticket requires a primary handler at ${StaffSkillTierLabel[minTier]} or above.`;
}
