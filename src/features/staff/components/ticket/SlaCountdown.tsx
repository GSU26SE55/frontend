import { useState, useEffect } from "react";
import { SlaTimerStatusEnum } from "@/shared/types/ticket/ticket.types";
import type { SlaTimerDTO } from "@/shared/types/ticket/ticket.types";
import {
  isNearBreachPercent,
  formatSlaRemaining,
  formatSlaDueAt,
} from "@/shared/lib/sla";
import { toneClass } from "@/shared/theme/statusColors";
import { cn } from "@/lib/utils";

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

export function SlaCountdown({
  slaTimer,
  hideBar = false,
  compact = false,
}: Props) {
  const dueAt = slaTimer?.dueAt ?? "";
  const status = slaTimer?.status;
  const remainingPercent = slaTimer?.remainingPercent ?? 0;

  const [remaining, setRemaining] = useState(() =>
    dueAt ? Math.max(0, new Date(dueAt).getTime() - Date.now()) : 0,
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
      const diff = new Date(dueAt).getTime() - Date.now();
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
        title={`Due ${formatSlaDueAt(dueAt)}`}
      >
        {formatSlaRemaining(remaining)}
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
              className="h-1.5 rounded-full bg-muted-foreground transition-[width] duration-(--motion-enter) ease-linear"
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
        {formatSlaRemaining(remaining)}
      </span>
      {!hideBar && (
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className={cn(
              // Width is a countdown: constant motion, so `linear`. The colour flip at
              // the near-breach threshold is a state change, so it eases — sharing one
              // `transition-all` curve made the tone swap read as a glitch.
              "h-1.5 rounded-full",
              "[transition:width_var(--motion-enter)_linear,background-color_var(--motion-enter)_var(--motion-ease-out)]",
              barColor,
            )}
            style={{ width: `${Math.min(100, remainingPercent)}%` }}
          />
        </div>
      )}
    </div>
  );
}
