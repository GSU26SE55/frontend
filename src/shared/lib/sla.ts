import { SlaTimerStatusEnum } from "@/shared/enums/ticket/ticket.enum";

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

/**
 * Same 3-band scale as `slaComplianceColor`, expressed as a StatusTone — for the
 * `<Stat>` KPI tile, which takes a tone rather than a raw CSS colour. Kept next to the
 * colour fn so the two can never drift: high ≥90 · medium ≥70 · low below that.
 * `undefined` = no finished timer yet, so the tile stays neutral instead of scoring 0.
 */
export function slaComplianceTone(
  compliancePercent: number | null | undefined,
): "ok" | "p3" | "p1" | undefined {
  if (compliancePercent === null || compliancePercent === undefined)
    return undefined;
  if (compliancePercent >= 90) return "ok";
  if (compliancePercent >= 70) return "p3";
  return "p1";
}

/** Same 3-band scale as `slaBarColorClass`, as a text color — SVG strokes pick it up via `currentColor`. */
export function slaTextColorClass(remainingPercent?: number | null): string {
  const pct = remainingPercent ?? 0;
  if (pct > SLA_CAUTION_PERCENT) return "text-sla-ok";
  if (pct > SLA_WARNING_PERCENT) return "text-sla-caution";
  return "text-sla-warning";
}

/** Tailwind class for the SLA progress bar based on % remaining (semantic token — correct in dark mode). */
export function slaBarColorClass(remainingPercent?: number | null): string {
  const pct = remainingPercent ?? 0;
  if (pct > SLA_CAUTION_PERCENT) return "bg-sla-ok";
  if (pct > SLA_WARNING_PERCENT) return "bg-sla-caution";
  return "bg-sla-warning";
}

/**
 * Countdown text for an SLA timer — "11d 17:45:55".
 *
 * Days are split out on purpose: a P3 ticket with a multi-day target rendered as
 * "281:45:55", which nobody reads as "11 days". Under 24h the format is unchanged.
 */
export function formatSlaRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hms = [
    Math.floor((totalSecs % 86400) / 3600),
    Math.floor((totalSecs % 3600) / 60),
    totalSecs % 60,
  ]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days}d ${hms}` : hms;
}

/** Deadline shown under the countdown — "09/05 17:00". Year omitted: SLA windows are days, not months. */
export function formatSlaDueAt(dueAt: string): string {
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Coarsest useful unit only — "11d", "17h", "45m", "30s". For list rows, where the
 * cell answers "how urgent" at a glance; the exact countdown and deadline live on
 * the detail page (and in the chip's title). Granularity tightens as it runs out,
 * so a near-breach ticket still reads in minutes.
 */
export function formatSlaRemainingCompact(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSecs / 86400);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(totalSecs / 3600);
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(totalSecs / 60);
  if (mins > 0) return `${mins}m`;
  return `${totalSecs}s`;
}

/**
 * Is the SLA clock still counting?
 *
 * Only `Running` and `Paused` are live states — every other status is terminal:
 * `Met`/`Breached` are outcomes already decided, and `Stopped` means the clock was
 * cancelled (StopSlaAsync on reject/merge/declare-incident, or the ticket turning
 * Urgent). The BE agrees: `SlaCalculator.GetRemainingPercent` returns 0 for anything
 * that is not Running/Paused, so a terminal timer has no meaningful % left.
 *
 * The detail sidebars use this to decide whether to draw the "Remaining %" row and the
 * progress bar at all. Without it a rejected ticket rendered a full green bar counting
 * down to a deadline nobody is held to any more.
 */
export function isSlaClockLive(status?: SlaTimerStatusEnum | null): boolean {
  return (
    status === SlaTimerStatusEnum.Running ||
    status === SlaTimerStatusEnum.Paused
  );
}
