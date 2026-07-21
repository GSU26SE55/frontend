import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import { SlaCountdown } from "./SlaCountdown";

interface Props {
  ticket: TicketDTO;
}

export function TicketCard({ ticket }: Props) {
  return (
    <Link to={`/staff/tickets/${ticket.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-mono">
                {ticket.code}
              </p>
              <p
                className="font-medium leading-snug line-clamp-2 mt-0.5"
                title={ticket.title}
              >
                {ticket.title}
              </p>
            </div>
            <TicketStatusBadge status={ticket.status} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-3">
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <SlaCountdown slaTimer={ticket.slaTimer} />
        </CardContent>
      </Card>
    </Link>
  );
}
