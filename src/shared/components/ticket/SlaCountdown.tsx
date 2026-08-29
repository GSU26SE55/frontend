import { useEffect, useState } from "react";
import { SlaTimerStatusEnum } from "@/shared/types/ticket/ticket.types";
import type { SlaTimerDTO } from "@/shared/types/ticket/ticket.types";
import {
  isNearBreachPercent,
  SLA_CAUTION_PERCENT,
  SLA_WARNING_PERCENT,
  formatSlaRemaining,
  formatSlaDueAt,
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
  slaTimer: SlaTimerDTO | null;
  /**
   * List rendering: same badge, tightened typography for a table cell.
   *
   * The countdown itself is NOT truncated any more — a row that says "01:12:04" is
   * the point of the column. `tabular-nums` keeps the digits from shifting as it ticks.
   */
  compact?: boolean;
}

export default function SlaCountdown({ slaTimer, compact = false }: Props) {
  const dueAt = slaTimer?.dueAt ?? "";
  // `now` is the only clock read, and it only ever moves inside the effect. Remaining
  // is then derived (deadline - now), so a dueAt change is reflected on the SAME render
  // instead of showing the previous ticket's remainder until the next tick lands.
  const [now, setNow] = useState(() => Date.now());
  const remaining = dueAt ? new Date(dueAt).getTime() - now : 0;

  useEffect(() => {
    if (
      !slaTimer ||
      slaTimer.status === SlaTimerStatusEnum.Met ||
      slaTimer.status === SlaTimerStatusEnum.Breached
    )
      return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [slaTimer]);

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
    return (
      <span className={`${BADGE_BASE} ${toneClass("p1")}`}>SLA breached</span>
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
  // the status yet. `formatSlaRemaining` floors at "00:00:00", so this rendered as a live
  // clock frozen on zero, which reads as "breaching right now" rather than "already over".
  // Say it plainly instead of counting time that has run out.
  if (remaining <= 0) {
    return <span className={`${BADGE_BASE} ${toneClass("p1")}`}>Overdue</span>;
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
