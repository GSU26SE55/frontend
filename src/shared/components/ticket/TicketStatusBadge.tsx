import { Badge } from "@/components/ui/badge";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import { toneClass, TICKET_STATUS_TONE } from "@/shared/theme/statusColors";

// Ticket status badge SHARED across admin/manager/staff — previously had 3 separate versions
// diverging on label + color. One single source of labels + semantic color tone
// (token --ok/--info/--p1... — distinguishes Escalated/Incident from Resolved,
// something shadcn's 4-color variant can't do).
// GH-1176: updated for 8-status canonical lifecycle.
const STATUS_LABEL: Record<TicketStatusEnum, string> = {
  [TicketStatusEnum.Open]: "Awaiting assignment",
  [TicketStatusEnum.Pending]: "Pending",
  [TicketStatusEnum.InProgress]: "In progress",
  [TicketStatusEnum.Request]: "Escalation request",
  [TicketStatusEnum.ReAssign]: "Pending reassignment",
  [TicketStatusEnum.Completed]: "Completed",
  [TicketStatusEnum.Closed]: "Closed",
  [TicketStatusEnum.ClosedRejected]: "Rejected",
};

interface Props {
  status: TicketStatusEnum;
}

export default function TicketStatusBadge({ status }: Props) {
  const label = STATUS_LABEL[status] ?? status;
  const tone = TICKET_STATUS_TONE[status] ?? "muted";
  return (
    <Badge variant="outline" className={toneClass(tone)}>
      {label}
    </Badge>
  );
}
