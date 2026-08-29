import { useEffect, useState } from "react";
import { format } from "date-fns";
import { formatSlaRemaining } from "@/shared/lib/sla";
import { toneClass } from "@/shared/theme/statusColors";

/**
 * The clock that IS running on a periodic-maintenance ticket nobody has picked up yet.
 *
 * A ticket like this has no SLA timer — that one is only created when work actually starts
 * (ApplySlaAsync, on the transition to InProgress) — so the SLA block used to read
 * "No SLA timer yet", i.e. nothing is due. Two other deadlines are live in the meantime:
 *
 *  - periodicMaintenanceDueAtUtc: the battery's maintenance cycle deadline. Past it, the
 *    ticket is genuinely late even though no SLA has started.
 *  - periodicMaintenanceScheduleDeadlineAtUtc: the last moment the customer can book a
 *    slot. Past it the BE REFUSES to schedule (CustomerSchedulePeriodicMaintenanceCommandHandler),
 *    so this is the deadline with real consequences while the ticket is unassigned.
 *
 * Showing the schedule deadline as a live countdown puts the actionable one where people
 * already look for urgency, instead of leaving it invisible.
 */
interface Props {
  dueAtUtc?: string | null;
  scheduleDeadlineAtUtc?: string | null;
  isOverdue: boolean;
}

export default function MaintenanceScheduleCountdown({
  dueAtUtc,
  scheduleDeadlineAtUtc,
  isOverdue,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = scheduleDeadlineAtUtc
    ? new Date(scheduleDeadlineAtUtc).getTime() - now
    : 0;

  useEffect(() => {
    if (!scheduleDeadlineAtUtc) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [scheduleDeadlineAtUtc]);

  // Not a periodic-maintenance ticket — nothing extra to say beyond "no SLA yet".
  if (!dueAtUtc && !scheduleDeadlineAtUtc) {
    return <p className="text-xs text-muted-foreground">No SLA timer yet.</p>;
  }

  // Booking window has closed: the customer can no longer schedule this themselves, so a
  // countdown would imply time that no longer exists. Needs a manager to step in.
  const bookingClosed = Boolean(scheduleDeadlineAtUtc) && remaining <= 0;

  return (
    <div className="space-y-2.5">
      {isOverdue && (
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${toneClass("p1")}`}
        >
          Maintenance overdue
        </span>
      )}

      {scheduleDeadlineAtUtc && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Schedule before
            </span>
            <span className="text-xs font-medium tabular-nums">
              {format(new Date(scheduleDeadlineAtUtc), "dd/MM HH:mm")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {bookingClosed ? "Booking" : "Remaining"}
            </span>
            {bookingClosed ? (
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${toneClass("p1")}`}
              >
                Closed
              </span>
            ) : (
              <span className="text-xs font-medium font-mono tabular-nums">
                {formatSlaRemaining(remaining)}
              </span>
            )}
          </div>
        </>
      )}

      {/* The SLA clock itself genuinely has not started — say so, but quietly, now that the
          block leads with the deadline that is actually running. */}
      <p className="text-xs text-muted-foreground">
        SLA starts when work begins.
      </p>
    </div>
  );
}
