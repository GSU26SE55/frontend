import { useEffect, useState } from "react";
import { SlaTimerStatusEnum } from "@/shared/types/ticket/ticket.types";
import type { SlaTimerDTO } from "@/shared/types/ticket/ticket.types";
import { isNearBreachPercent } from "@/shared/lib/sla";
import { toneClass } from "@/shared/theme/statusColors";

function formatDuration(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

interface Props {
  slaTimer: SlaTimerDTO | null;
}

export default function SlaCountdown({ slaTimer }: Props) {
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
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono font-medium ${
        isWarning ? toneClass("p1") : toneClass("muted")
      }`}
    >
      {formatDuration(remaining)}
    </span>
  );
}
