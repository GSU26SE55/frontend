import { useState, useEffect } from "react";
import { SlaTimerStatusEnum } from "@/shared/types/ticket/ticket.types";
import type { SlaTimerDTO } from "@/shared/types/ticket/ticket.types";
import { isNearBreachPercent } from "@/shared/lib/sla";
import { toneClass } from "@/shared/theme/statusColors";

interface Props {
  slaTimer: SlaTimerDTO | null;
  /**
   * Hide the small accompanying progress bar.
   *
   * Used on the ticket detail page, where the SLA block already has a longer
   * "remaining" bar below it — showing both would draw the same ratio twice.
   * Other places (TicketCard, SlaMonitorPage) don't have their own bar, so they
   * still need this one.
   */
  hideBar?: boolean;
  /**
   * Render as a single-line chip — MATCHES `manager/components/ticket/SlaCountdown`.
   *
   * Used in the SLA block on the detail page so both roles look the same. Defaults
   * to `false`, keeping the multi-line layout for TicketCard and SlaMonitorPage.
   */
  compact?: boolean;
}

function formatSeconds(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function SlaCountdown({
  slaTimer,
  hideBar = false,
  compact = false,
}: Props) {
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

  // Single-line chip — matches exactly how Manager displays it, including labels and colors.
  if (compact) {
    if (status === SlaTimerStatusEnum.Met) {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${toneClass("ok")}`}
        >
          On time
        </span>
      );
    }
    if (status === SlaTimerStatusEnum.Breached) {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${toneClass("p1")}`}
        >
          SLA breached
        </span>
      );
    }
    if (status === SlaTimerStatusEnum.Paused) {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${toneClass("p3")}`}
        >
          Paused
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono font-medium ${
          isNearBreachPercent(remainingPercent)
            ? toneClass("p1")
            : toneClass("muted")
        }`}
      >
        {formatSeconds(remaining)}
      </span>
    );
  }

  if (status === SlaTimerStatusEnum.Breached) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-destructive">
          SLA breached
        </span>
        {!hideBar && (
          <div className="h-1.5 w-full rounded-full bg-destructive/20">
            <div className="h-1.5 rounded-full bg-destructive w-full" />
          </div>
        )}
      </div>
    );
  }

  if (status === SlaTimerStatusEnum.Met) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ok">Resolved on time</span>
        {!hideBar && (
          <div className="h-1.5 w-full rounded-full bg-ok-soft">
            <div className="h-1.5 rounded-full bg-ok w-full" />
          </div>
        )}
      </div>
    );
  }

  if (status === SlaTimerStatusEnum.Paused) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          On hold
        </span>
        {!hideBar && (
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-muted-foreground transition-all"
              style={{ width: `${Math.min(100, remainingPercent)}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  const isWarning = isNearBreachPercent(remainingPercent);
  const barColor = isWarning ? "bg-destructive" : "bg-primary";

  return (
    <div className="flex flex-col gap-1">
      {/* Base size + semibold: on the list card, this number decides which work item
          takes priority — sizing it like secondary text (sm) wouldn't draw the eye. */}
      <span
        className={`text-base font-semibold tabular-nums ${isWarning ? "text-destructive" : "text-foreground"}`}
      >
        {formatSeconds(remaining)}
      </span>
      {!hideBar && (
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className={`h-1.5 rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(100, remainingPercent)}%` }}
          />
        </div>
      )}
    </div>
  );
}
