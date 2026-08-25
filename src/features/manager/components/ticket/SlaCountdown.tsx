import { useEffect, useState } from "react";
import { SlaTimerStatusEnum } from "@/shared/types/ticket/ticket.types";
import type { SlaTimerDTO } from "@/shared/types/ticket/ticket.types";
import {
  isNearBreachPercent,
  formatSlaRemaining,
  formatSlaRemainingCompact,
  formatSlaDueAt,
  slaTextColorClass,
} from "@/shared/lib/sla";
import { toneClass } from "@/shared/theme/statusColors";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Ring = % of the SLA window still left, number in the middle = how much time.
 *
 * Two facts in one 36px cell, and the ring is readable without reading the number —
 * a row of these shows which tickets are running out before you parse any digits.
 * Sized so the coarse label ("11d", "45m") always fits; that is why the list format
 * is capped at one unit.
 */
function SlaRing({
  percent,
  label,
  toneClassName,
}: {
  percent: number;
  label: string;
  toneClassName: string;
}) {
  const size = 36;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(100, percent));
  // 0% draws no arc at all, which rendered an out-of-time ticket as an empty grey
  // circle — the calmest thing in the column. Out of time closes the ring instead.
  const dashOffset = filled <= 0 ? 0 : circumference * (1 - filled / 100);

  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Width shrinks continuously so it is linear; the color band change is a
          // state flip, so it eases — same split as the SLA bar elsewhere.
          className={`${toneClassName} [transition:stroke-dashoffset_var(--motion-enter)_linear,stroke_var(--motion-enter)_var(--motion-ease-out)]`}
        />
      </svg>
      <span
        className={`absolute text-[11px] font-semibold tabular-nums ${toneClassName}`}
      >
        {label}
      </span>
    </span>
  );
}

interface Props {
  slaTimer: SlaTimerDTO | null;
  /**
   * List rendering: one coarse unit ("11d") instead of the full countdown.
   *
   * A table cell is scanned, not read — "11d 17:41:56" spends three fields on
   * precision nobody acts on. The exact value stays one hover (title) or one
   * click (detail page) away. Off by default, so the detail page keeps ticking.
   */
  compact?: boolean;
}

export default function SlaCountdown({ slaTimer, compact = false }: Props) {
  const [remaining, setRemaining] = useState(() =>
    slaTimer ? new Date(slaTimer.dueAt).getTime() - Date.now() : 0,
  );

  useEffect(() => {
    if (
      !slaTimer ||
      slaTimer.status === SlaTimerStatusEnum.Met ||
      slaTimer.status === SlaTimerStatusEnum.Breached
    )
      return;

    const interval = setInterval(() => {
      setRemaining(new Date(slaTimer!.dueAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [slaTimer]);

  if (!slaTimer) return null;

  if (slaTimer.status === SlaTimerStatusEnum.Met) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${toneClass("ok")}`}
      >
        On time
      </span>
    );
  }

  if (slaTimer.status === SlaTimerStatusEnum.Breached) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${toneClass("p1")}`}
      >
        SLA breached
      </span>
    );
  }

  if (slaTimer.status === SlaTimerStatusEnum.Paused) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${toneClass("p3")}`}
      >
        Paused
      </span>
    );
  }

  // Warning threshold kept CONSISTENT with staff SlaCountdown + dashboard isNearBreach:
  // uses remainingPercent (relative, correct for every priority P1/P2/P3) instead of an
  // absolute <1h mark — avoids the same ticket showing a different urgency level per role.
  const isWarning = isNearBreachPercent(slaTimer.remainingPercent);

  // What the ring cannot say: the exact deadline, the exact time left, and the
  // percentage the arc is drawing. Hover is where the precision lives now.
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

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <SlaRing
            percent={slaTimer.remainingPercent}
            label={formatSlaRemainingCompact(remaining)}
            toneClassName={slaTextColorClass(slaTimer.remainingPercent)}
          />
        </TooltipTrigger>
        <TooltipContent>{details}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono font-medium ${
              isWarning ? toneClass("p1") : toneClass("muted")
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
