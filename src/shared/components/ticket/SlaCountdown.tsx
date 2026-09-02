import { useEffect, useState } from "react";
import { SlaTimerStatusEnum } from "@/shared/types/ticket/ticket.types";
import type { SlaTimerDTO } from "@/shared/types/ticket/ticket.types";
import {
  isNearBreachPercent,
  SLA_CAUTION_PERCENT,
  SLA_WARNING_PERCENT,
  formatSlaRemaining,
  formatSlaDueAt,
  formatSlaOverdue,
} from "@/shared/lib/sla";
import { toneClass, type StatusTone } from "@/shared/theme/statusColors";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Same 3-band scale as `slaTextColorClass`, expressed as a badge tone so the running
 * countdown sits in the SAME chip family as "On time" / "SLA breached" / "Paused".
 * The ring that used to live here read as a different kind of object in the column.
 */
function slaTone(remainingPercent?: number | null): StatusTone {
  const pct = remainingPercent ?? 0;
  if (pct > SLA_CAUTION_PERCENT) return "ok";
  if (pct > SLA_WARNING_PERCENT) return "p3";
  return "p1";
}

const BADGE_BASE =
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium";

interface Props {
  slaTimer?: SlaTimerDTO | null;
  /**
   * List rendering: same badge, tightened typography for a table cell.
   *
   * The countdown itself is NOT truncated any more — a row that says "01:12:04" is
   * the point of the column. `tabular-nums` keeps the digits from shifting as it ticks.
   */
  compact?: boolean;
  /**
   * Thời điểm hoàn thành SLA (ví dụ: thời điểm First Response hoặc Resolved).
   * Khi được truyền vào, đồng hồ sẽ đóng băng tại mốc chênh lệch đó thay vì tiếp tục đếm live.
   */
  completedAt?: string | Date | null;
}

export default function SlaCountdown({
  slaTimer,
  compact = false,
  completedAt,
}: Props) {
  const dueAt = slaTimer?.dueAt ?? "";
  const isStopped =
    !!completedAt ||
    slaTimer?.status === SlaTimerStatusEnum.Met ||
    slaTimer?.status === SlaTimerStatusEnum.Stopped;

  // `now` is the only clock read, and it only ever moves inside the effect. Remaining
  // is then derived (deadline - now), so a dueAt change is reflected on the SAME render
  // instead of showing the previous ticket's remainder until the next tick lands.
  const [now, setNow] = useState(() => Date.now());
  const effectiveEnd = completedAt ? new Date(completedAt).getTime() : now;
  const remaining = dueAt ? new Date(dueAt).getTime() - effectiveEnd : 0;

  // Deps là giá trị nguyên thủy, KHÔNG phải object `slaTimer`: callers như TicketSlaSection
  // truyền một `slaTimer` được useMemo lại mỗi giây (phụ thuộc `now`), nên dùng `slaTimer`
  // làm dep sẽ clear + tạo lại interval trước khi nó kịp fire → countdown đứng.
  const hasTimer = !!slaTimer;
  useEffect(() => {
    if (!hasTimer || isStopped) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasTimer, isStopped]);

  // No timer at all. The clock is only created when a ticket is actually picked up
  // (ApplySlaAsync, on the transition to InProgress), and Urgent tickets never get one —
  // so an unassigned ticket legitimately has nothing to count down. An empty cell read
  // as missing data; this says the SLA has not started, which is the real state.
  //
  // Detail pages render their own SLA block, so a placeholder there would be noise —
  // only the list needs the column to stay aligned.
  if (!slaTimer) {
    if (!compact) return null;
    return (
      <span className={`${BADGE_BASE} ${toneClass("muted")}`}>Not started</span>
    );
  }

  if (slaTimer.status === SlaTimerStatusEnum.Met) {
    return <span className={`${BADGE_BASE} ${toneClass("ok")}`}>On time</span>;
  }

  if (slaTimer.status === SlaTimerStatusEnum.Breached) {
    if (completedAt) {
      return (
        <span
          className={`${BADGE_BASE} ${toneClass("p1")}`}
          title={`SLA breached · Due ${formatSlaDueAt(slaTimer.dueAt)}`}
        >
          Breached
        </span>
      );
    }
    const overdueMs = Math.abs(remaining);
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={`${BADGE_BASE} font-mono tabular-nums ${toneClass("p1")}`}
            />
          }
        >
          {formatSlaOverdue(overdueMs)}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-0.5 text-left">
            <div className="font-medium tabular-nums">
              SLA breached · {formatSlaOverdue(overdueMs)} overdue
            </div>
            <div className="opacity-80">
              Due {formatSlaDueAt(slaTimer.dueAt)}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (slaTimer.status === SlaTimerStatusEnum.Paused) {
    return <span className={`${BADGE_BASE} ${toneClass("p3")}`}>Paused</span>;
  }

  // Stopped is a real BE state (SlaTimerStatusEnum.Stopped = 5): the clock was cancelled,
  // e.g. StopSlaAsync, or the ticket became Urgent after a timer already existed. It used
  // to fall through to the countdown branch below, which rendered a LIVE badge counting
  // against a dueAt nobody is held to any more — and once that date passed it showed a red
  // 00:00:00, i.e. an about-to-breach ticket that is not being timed at all.
  if (slaTimer.status === SlaTimerStatusEnum.Stopped) {
    return (
      <span className={`${BADGE_BASE} ${toneClass("muted")}`}>No SLA</span>
    );
  }

  // Warning threshold kept CONSISTENT with staff SlaCountdown + dashboard isNearBreach:
  // uses remainingPercent (relative, correct for every priority P1/P2/P3) instead of an
  // absolute <1h mark — avoids the same ticket showing a different urgency level per role.
  const isWarning = isNearBreachPercent(slaTimer.remainingPercent);

  // What the badge cannot say: the exact deadline and the percentage left.
  const details = (
    <div className="space-y-0.5 text-left">
      <div className="font-medium tabular-nums">
        {formatSlaRemaining(remaining)} left
      </div>
      <div className="opacity-80 tabular-nums">
        Due {formatSlaDueAt(slaTimer.dueAt)} ·{" "}
        {slaTimer.remainingPercent.toFixed(0)}% remaining
      </div>
    </div>
  );

  // Running, but the deadline is already behind us — the BE breach sweep has not flipped
  // the status yet. Show live overdue counter instead of a frozen 00:00:00 or static label.
  if (remaining <= 0) {
    const overdueMs = Math.abs(remaining);
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={`${BADGE_BASE} font-mono tabular-nums ${toneClass("p1")}`}
            />
          }
        >
          {formatSlaOverdue(overdueMs)}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-0.5 text-left">
            <div className="font-medium tabular-nums">
              Overdue · {formatSlaOverdue(overdueMs)}
            </div>
            <div className="opacity-80">
              Due {formatSlaDueAt(slaTimer.dueAt)}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // In a list the badge is graded green→amber→red by % left, so a column of them still
  // sorts by urgency at a glance — the one thing the ring was actually good at. On the
  // detail page there is nothing to compare against, so it stays the plain near-breach flip.
  const tone = compact ? slaTone(slaTimer.remainingPercent) : undefined;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={`${BADGE_BASE} font-mono tabular-nums ${
              tone
                ? toneClass(tone)
                : isWarning
                  ? toneClass("p1")
                  : toneClass("muted")
            }`}
          />
        }
      >
        {formatSlaRemaining(remaining)}
      </TooltipTrigger>
      <TooltipContent>{details}</TooltipContent>
    </Tooltip>
  );
}
