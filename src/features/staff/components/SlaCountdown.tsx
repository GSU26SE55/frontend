import { useState, useEffect } from "react";
import { SlaTimerStatusEnum } from "@/shared/types/ticket.types";
import type { SlaTimerDTO } from "@/shared/types/ticket.types";
import { isNearBreachPercent } from "@/shared/lib/sla";

interface Props {
  slaTimer: SlaTimerDTO | null;
}

function formatSeconds(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function SlaCountdown({ slaTimer }: Props) {
  const dueAt = slaTimer?.dueAt ?? "";
  const status = slaTimer?.status;
  const remainingPercent = slaTimer?.remainingPercent ?? 0;

  const [remaining, setRemaining] = useState(() =>
    dueAt
      ? Math.max(0, Math.floor((new Date(dueAt).getTime() - Date.now()) / 1000))
      : 0,
  );

  useEffect(() => {
    if (
      !dueAt ||
      status === SlaTimerStatusEnum.Paused ||
      status === SlaTimerStatusEnum.Met ||
      status === SlaTimerStatusEnum.Breached
    ) {
      return;
    }
    const id = setInterval(() => {
      const diff = Math.floor((new Date(dueAt).getTime() - Date.now()) / 1000);
      setRemaining(Math.max(0, diff));
      if (diff <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [dueAt, status]);

  if (!slaTimer) return null;

  if (status === SlaTimerStatusEnum.Breached) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-destructive">
          Đã vi phạm SLA
        </span>
        <div className="h-1.5 w-full rounded-full bg-destructive/20">
          <div className="h-1.5 rounded-full bg-destructive w-full" />
        </div>
      </div>
    );
  }

  if (status === SlaTimerStatusEnum.Met) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ok">
          Đã giải quyết đúng hạn
        </span>
        <div className="h-1.5 w-full rounded-full bg-ok-soft">
          <div className="h-1.5 rounded-full bg-ok w-full" />
        </div>
      </div>
    );
  }

  if (status === SlaTimerStatusEnum.Paused) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          Đang tạm dừng
        </span>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-muted-foreground transition-all"
            style={{ width: `${Math.min(100, remainingPercent)}%` }}
          />
        </div>
      </div>
    );
  }

  const isWarning = isNearBreachPercent(remainingPercent);
  const barColor = isWarning ? "bg-destructive" : "bg-primary";

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`text-sm font-medium tabular-nums ${isWarning ? "text-destructive" : "text-foreground"}`}
      >
        {formatSeconds(remaining)}
      </span>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, remainingPercent)}%` }}
        />
      </div>
    </div>
  );
}
