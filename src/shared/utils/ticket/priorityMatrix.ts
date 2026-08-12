import type {
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketPriorityEnum,
} from "@/shared/types/ticket/ticket.types";

/**
 * Impact × Urgency → Priority matrix, per User Guide §3.9 "How the system computes priority".
 *
 *   Scope \ Urgency      Low   Medium   High
 *   MultiSite            P1     P1      P1
 *   Site                 P3     P2      P1
 *   SingleAsset          P3     P3      P2
 *
 * MultiSite is always P1 regardless of urgency: when several sites fail at once the cause is
 * systemic, not a single battery.
 *
 * This is only a preview so the user sees the result up front — the BE (PriorityCalculator)
 * is what decides. If you change this table you must change the BE too, or the two drift apart.
 */
export const PRIORITY_MATRIX: Record<
  string,
  Record<string, TicketPriorityEnum>
> = {
  MultiSite: { High: "P1Critical", Medium: "P1Critical", Low: "P1Critical" },
  Site: { High: "P1Critical", Medium: "P2High", Low: "P3Normal" },
  SingleAsset: { High: "P2High", Medium: "P3Normal", Low: "P3Normal" },
};

export function computePriority(
  impact?: ImpactScopeEnum,
  urgency?: UrgencyLevelEnum,
): TicketPriorityEnum | undefined {
  if (!impact || !urgency) return undefined;
  return PRIORITY_MATRIX[impact]?.[urgency];
}
