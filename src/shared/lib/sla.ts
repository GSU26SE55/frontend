// Ngưỡng SLA THỐNG NHẤT toàn app (fix bất nhất staff ≤25% vs manager <1h vs
// bar >50/>20). Dùng remainingPercent (tương đối) để đúng cho mọi priority.
//
// - remainingPercent > 50        → ok (xanh)
// - 25 < remainingPercent ≤ 50   → chú ý (vàng)
// - remainingPercent ≤ 25        → cảnh báo / near-breach (đỏ)

export const SLA_WARNING_PERCENT = 25;
export const SLA_CAUTION_PERCENT = 50;

/** Ticket sắp breach — dùng cho KPI "sắp breach", màu cảnh báo countdown. */
export function isNearBreachPercent(remainingPercent?: number | null): boolean {
  return (remainingPercent ?? 100) <= SLA_WARNING_PERCENT;
}

/**
 * Màu cho % TUÂN THỦ SLA của một TẬP ticket (met / (met + breach)).
 * Khác `slaBarColorClass` — cái đó theo % thời gian còn lại của MỘT ticket.
 * ≥90% ok · ≥70% chú ý · dưới nữa là báo động.
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

/** Class Tailwind cho progress bar SLA theo % còn lại (token semantic — đúng dark mode). */
export function slaBarColorClass(remainingPercent?: number | null): string {
  const pct = remainingPercent ?? 0;
  if (pct > SLA_CAUTION_PERCENT) return "bg-sla-ok";
  if (pct > SLA_WARNING_PERCENT) return "bg-sla-caution";
  return "bg-sla-warning";
}
