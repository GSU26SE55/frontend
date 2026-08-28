import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  TicketActivityDTO,
  TicketAssignmentDTO,
} from "@/shared/types/ticket/ticket.types";
import {
  getActivityMeta,
  activityToneStyle,
} from "@/shared/components/ticket/ticketActivityMeta";

const IS_GUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface Props {
  activities?: TicketActivityDTO[];
  assignments?: TicketAssignmentDTO[] | null;
  isLoading?: boolean;
}

function formatActivityValue(
  action: string,
  val?: string | null,
  assignments?: TicketAssignmentDTO[] | null,
): string | null {
  if (!val || !val.trim()) return null;
  if (val === "Resolved") return "Completed";

  if (IS_GUID.test(val)) {
    if (action === "StaffAssigned" || action === "StaffReassigned") {
      const match = assignments?.find((a) => a.staffId === val);
      if (match?.staffName) return match.staffName;
    }
    return null;
  }
  return val;
}

export default function TicketActivityTimeline({
  activities,
  assignments,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-4">
      {activities.map((activity) => {
        const meta = getActivityMeta(activity.action);
        const style = activityToneStyle(meta.tone);
        const Icon = meta.icon;
        const actorName =
          activity.actorDisplayName && !IS_GUID.test(activity.actorDisplayName)
            ? activity.actorDisplayName
            : null;
        const formattedOld = formatActivityValue(
          activity.action,
          activity.oldValue,
          assignments,
        );
        const formattedNew = formatActivityValue(
          activity.action,
          activity.newValue,
          assignments,
        );

        return (
          <li key={activity.id} className="ml-6">
            <span
              className={`absolute -left-3.5 mt-1 flex size-7 items-center justify-center rounded-full border border-background ${style.bg}`}
            >
              <Icon className={`size-3.5 ${style.iconColor}`} />
            </span>
            <div className="rounded-lg border bg-card px-4 py-2 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-sm font-semibold"
                  style={{ color: style.dot }}
                >
                  {meta.label}
                </p>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(activity.createdAt), "dd/MM/yyyy HH:mm")}
                </time>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {actorName ? `${actorName} · ` : ""}
                {activity.actorRole}
              </p>
              {(formattedOld || formattedNew) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formattedOld && (
                    <span className="line-through mr-1">{formattedOld}</span>
                  )}
                  {formattedNew && <span>{formattedNew}</span>}
                </p>
              )}
              {activity.reason && (
                <p className="text-xs italic text-muted-foreground mt-0.5">
                  {activity.reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
