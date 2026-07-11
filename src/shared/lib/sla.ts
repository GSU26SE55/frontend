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

/** Class Tailwind cho progress bar SLA theo % còn lại (token semantic — đúng dark mode). */
export function slaBarColorClass(remainingPercent?: number | null): string {
  const pct = remainingPercent ?? 0;
  if (pct > SLA_CAUTION_PERCENT) return "bg-sla-ok";
  if (pct > SLA_WARNING_PERCENT) return "bg-sla-caution";
  return "bg-sla-warning";
}
