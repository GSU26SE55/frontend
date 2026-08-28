import { Badge } from "@/components/ui/badge";
import type { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import { TICKET_STATUS_LABEL } from "@/shared/constants/ticketLabels";
import { toneClass, TICKET_STATUS_TONE } from "@/shared/theme/statusColors";

// Ticket status badge SHARED across admin/manager/staff — previously had 3 separate versions
// diverging on label + color. Labels now live in shared/constants/ticketLabels so the filter
// dropdowns read the same map; the tone stays semantic (token --ok/--info/--p1...), which
// shadcn's 4-color variant can't express.

interface Props {
  status: TicketStatusEnum;
}

export default function TicketStatusBadge({ status }: Props) {
  const label = TICKET_STATUS_LABEL[status] ?? status;
  const tone = TICKET_STATUS_TONE[status] ?? "muted";
  return (
    <Badge variant="outline" className={toneClass(tone)}>
      {label}
    </Badge>
  );
}
