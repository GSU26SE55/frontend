import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketActivityDTO } from "@/shared/types/ticket/ticket.types";
import {
  getActivityMeta,
  activityToneStyle,
} from "@/shared/components/ticket/ticketActivityMeta";

interface Props {
  activities?: TicketActivityDTO[];
  isLoading?: boolean;
}

export default function TicketActivityTimeline({
  activities,
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
                  {format(new Date(activity.createdAt), "MM/dd/yyyy HH:mm")}
                </time>
              </div>
              {activity.actorDisplayName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.actorDisplayName} · {activity.actorRole}
                </p>
              )}
              {(activity.oldValue || activity.newValue) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.oldValue && (
                    <span className="line-through mr-1">
                      {activity.oldValue}
                    </span>
                  )}
                  {activity.newValue && <span>{activity.newValue}</span>}
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
