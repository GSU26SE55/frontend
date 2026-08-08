import { Badge } from "@/components/ui/badge";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import { toneClass, TICKET_STATUS_TONE } from "@/shared/theme/statusColors";

// Ticket status badge SHARED across admin/manager/staff — previously had 3 separate versions
// diverging on label + color. One single source of labels + semantic color tone
// (token --ok/--info/--p1... — distinguishes Escalated/Incident from Resolved,
// something shadcn's 4-color variant can't do).
const STATUS_LABEL: Record<TicketStatusEnum, string> = {
  // "Awaiting triage" is New, NOT Open. Per the BE's TicketStatusEnum, Open means
  // "preliminarily triaged, awaiting Staff assignment" — calling it "Awaiting triage" would
  // make an auto-created ticket (created directly at Open, already has a priority) look like
  // it's still awaiting review when it already skipped that step.
  [TicketStatusEnum.New]: "Awaiting triage",
  [TicketStatusEnum.Open]: "Awaiting assignment",
  [TicketStatusEnum.Assigned]: "Assigned",
  [TicketStatusEnum.InProgress]: "In progress",
  [TicketStatusEnum.WaitingCustomer]: "Waiting on customer",
  [TicketStatusEnum.WaitingParts]: "Waiting on parts",
  [TicketStatusEnum.WaitingOnsiteSchedule]: "Waiting on schedule",
  [TicketStatusEnum.Resolved]: "Resolved",
  [TicketStatusEnum.Escalated]: "Escalated",
  [TicketStatusEnum.ClosedPendingRate]: "Awaiting rating",
  [TicketStatusEnum.Closed]: "Closed",
  [TicketStatusEnum.ClosedRejected]: "Rejected",
  [TicketStatusEnum.Incident]: "Incident",
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
