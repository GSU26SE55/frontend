import { useEffect, useMemo, useState } from "react";
import {
  ActivityActionEnum,
  TicketStatusEnum,
  type TicketActivityDTO,
} from "@/shared/types/ticket/ticket.types";

interface ProcessingDurationTimerProps {
  activities: TicketActivityDTO[];
  status: TicketStatusEnum;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = h > 0 ? [h, m, s] : [m, s];
  return parts.map((v) => String(v).padStart(2, "0")).join(":");
}

/**
 * Counts processing time since the most recent transition to InProgress — auto-resets
 * every time staff Resumes after a Hold (matches the meaning "how long has it been
 * processing", not a cumulative total). Derived from the activity log already fetched for
 * the Timeline tab — no extra API call.
 */
export function ProcessingDurationTimer({
  activities,
  status,
}: ProcessingDurationTimerProps) {
  const startedAt = useMemo(() => {
    const entries = activities.filter(
      (a) =>
        a.action === ActivityActionEnum.StatusChanged &&
        a.newValue === TicketStatusEnum.InProgress,
    );
    if (entries.length === 0) return null;
    return entries.reduce((latest, a) =>
      new Date(a.createdAt) > new Date(latest.createdAt) ? a : latest,
    ).createdAt;
  }, [activities]);

  const [elapsedMs, setElapsedMs] = useState(() =>
    startedAt ? Date.now() - new Date(startedAt).getTime() : 0,
  );

  useEffect(() => {
    if (!startedAt || status !== TicketStatusEnum.InProgress) return;
    const tick = () => setElapsedMs(Date.now() - new Date(startedAt).getTime());
    // setState deferred via callback (setTimeout 0 + setInterval) instead of calling
    // synchronously in the effect body — avoids a cascading render.
    const immediate = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(id);
    };
  }, [startedAt, status]);

  if (status !== TicketStatusEnum.InProgress || !startedAt) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <span className="text-xs font-medium tabular-nums">
      {formatElapsed(elapsedMs)}
    </span>
  );
}
