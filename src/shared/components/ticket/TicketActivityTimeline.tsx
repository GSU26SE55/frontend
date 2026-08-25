import { ActorRoleEnum } from "@/shared/types/ticket/ticket.types";
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

const ROLE_LABEL: Record<ActorRoleEnum, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Customer",
  System: "System",
};

interface Props {
  activities: TicketActivityDTO[];
  assignments?: TicketAssignmentDTO[] | null;
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

function renderValueDetails(
  action: string,
  oldVal?: string | null,
  newVal?: string | null,
  assignments?: TicketAssignmentDTO[] | null,
) {
  const formattedOld = formatActivityValue(action, oldVal, assignments);
  const formattedNew = formatActivityValue(action, newVal, assignments);

  if (!formattedOld && !formattedNew) return null;
  if (formattedOld && formattedNew)
    return `(${formattedOld} → ${formattedNew})`;
  if (formattedNew) return `(${formattedNew})`;
  return `(${formattedOld})`;
}

/**
 * Ticket activity timeline — SHARED by Manager and Staff.
 */
export default function TicketActivityTimeline({
  activities,
  assignments,
}: Props) {
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
        const actorName =
          act.actorDisplayName && !IS_GUID.test(act.actorDisplayName)
            ? act.actorDisplayName
            : ROLE_LABEL[act.actorRole];
        const valueDetails = renderValueDetails(
          act.action,
          act.oldValue,
          act.newValue,
          assignments,
        );

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
                {actorName}
              </span>
              {valueDetails && (
                <span className="text-muted-foreground ml-1">
                  {valueDetails}
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
