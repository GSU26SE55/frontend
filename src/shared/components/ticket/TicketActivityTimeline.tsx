import { ActorRoleEnum } from "@/shared/types/ticket/ticket.types";
import type { TicketActivityDTO } from "@/shared/types/ticket/ticket.types";
import {
  getActivityMeta,
  activityToneStyle,
} from "@/shared/components/ticket/ticketActivityMeta";

const ROLE_LABEL: Record<ActorRoleEnum, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Customer",
  System: "System",
};

interface Props {
  activities: TicketActivityDTO[];
}

/**
 * Ticket activity timeline — SHARED by Manager and Staff.
 *
 * Previously each feature had its own copy (`manager/.../TicketActivityTimeline` and
 * `staff/.../TicketTimeline`) rendering the same data but laid out differently, so the same
 * ticket looked different depending on role. Action permissions still live in each role's
 * detail page — this component only displays, it contains no actions.
 */
export default function TicketActivityTimeline({ activities }: Props) {
  if (!activities.length) {
    return (
      <p className="text-sm text-muted-foreground">No activity history yet.</p>
    );
  }

  return (
    <ol className="relative border-l border-muted ml-3 space-y-5">
      {activities.map((act) => {
        const meta = getActivityMeta(act.action);
        const style = activityToneStyle(meta.tone);
        const Icon = meta.icon;
        return (
          <li key={act.id} className="ml-6">
            <span
              className={`absolute -left-3.5 flex size-7 items-center justify-center rounded-full border border-background ${style.bg}`}
            >
              <Icon className={`size-3.5 ${style.iconColor}`} />
            </span>
            <div className="text-sm">
              <span className="font-semibold" style={{ color: style.dot }}>
                {meta.label}
              </span>
              <span className="text-muted-foreground">
                {" · "}
                {act.actorDisplayName ?? ROLE_LABEL[act.actorRole]}
              </span>
              {act.oldValue && act.newValue && (
                <span className="text-muted-foreground ml-1">
                  ({act.oldValue} → {act.newValue})
                </span>
              )}
              {act.reason && (
                <span className="ml-1 text-muted-foreground italic">
                  : {act.reason}
                </span>
              )}
            </div>
            <time className="text-xs text-muted-foreground">
              {new Date(act.createdAt).toLocaleString("vi-VN")}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
