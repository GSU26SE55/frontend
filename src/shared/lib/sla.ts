// SLA thresholds UNIFIED across the app (fixes the inconsistency between staff ≤25% vs
// manager <1h vs bar >50/>20). Uses remainingPercent (relative) so it's correct for every priority.
//
// - remainingPercent > 50        → ok (green)
// - 25 < remainingPercent ≤ 50   → caution (yellow)
// - remainingPercent ≤ 25        → warning / near-breach (red)

export const SLA_WARNING_PERCENT = 25;
export const SLA_CAUTION_PERCENT = 50;

/** Ticket about to breach — used for the "about to breach" KPI, countdown warning color. */
export function isNearBreachPercent(remainingPercent?: number | null): boolean {
  return (remainingPercent ?? 100) <= SLA_WARNING_PERCENT;
}

/**
 * Color for the SLA COMPLIANCE % of a SET of tickets (met / (met + breach)).
 * Different from `slaBarColorClass` — that one is based on the % time remaining
 * of a SINGLE ticket.
 * ≥90% ok · ≥70% caution · below that is alarm.
 */
export function slaComplianceColor(
  compliancePercent: number | null | undefined,
): string {
  if (compliancePercent === null || compliancePercent === undefined)
    return "var(--muted-foreground)";
  if (compliancePercent >= 90) return "var(--ok)";
  if (compliancePercent >= 70) return "var(--p3)";
  return "var(--p1)";
}

/** Tailwind class for the SLA progress bar based on % remaining (semantic token — correct in dark mode). */
export function slaBarColorClass(remainingPercent?: number | null): string {
  const pct = remainingPercent ?? 0;
  if (pct > SLA_CAUTION_PERCENT) return "bg-sla-ok";
  if (pct > SLA_WARNING_PERCENT) return "bg-sla-caution";
  return "bg-sla-warning";
}
