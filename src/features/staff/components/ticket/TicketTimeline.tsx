import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { TicketActivityDTO } from "@/shared/types/ticket/ticket.types";
import { ActorRoleEnum } from "@/shared/types/ticket/ticket.types";
import {
  getActivityMeta,
  activityToneStyle,
} from "@/shared/components/ticket/ticketActivityMeta";

const ROLE_LABELS: Record<string, string> = {
  [ActorRoleEnum.Admin]: "Admin",
  [ActorRoleEnum.Manager]: "Manager",
  [ActorRoleEnum.Staff]: "Staff",
  [ActorRoleEnum.Customer]: "Khách hàng",
  [ActorRoleEnum.System]: "Hệ thống",
};

interface Props {
  activities: TicketActivityDTO[];
}

export function TicketTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Chưa có hoạt động nào.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-5">
      {activities.map((activity) => {
        const meta = getActivityMeta(activity.action);
        const style = activityToneStyle(meta.tone);
        const Icon = meta.icon;
        return (
          <li key={activity.id} className="ml-6">
            {/* Icon tròn màu theo loại hoạt động */}
            <span
              className={`absolute -left-3.5 flex size-7 items-center justify-center rounded-full border border-background ${style.bg}`}
            >
              <Icon className={`size-3.5 ${style.iconColor}`} />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold" style={{ color: style.dot }}>
                {meta.label}
              </p>
              {activity.newValue && (
                <p className="text-sm text-muted-foreground">
                  {activity.oldValue
                    ? `${activity.oldValue} → ${activity.newValue}`
                    : activity.newValue}
                </p>
              )}
              {activity.reason && (
                <p className="text-xs text-muted-foreground italic">
                  Lý do: {activity.reason}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {activity.actorDisplayName ??
                  ROLE_LABELS[activity.actorRole] ??
                  activity.actorRole}
                {" · "}
                {format(new Date(activity.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
