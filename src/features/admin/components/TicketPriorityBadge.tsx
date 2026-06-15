import { Badge } from "@/components/ui/badge";
import { TicketPriorityEnum } from "@/shared/types/ticket.types";

const PRIORITY_CONFIG: Record<
  TicketPriorityEnum,
  { label: string; className: string }
> = {
  [TicketPriorityEnum.P1Critical]: {
    label: "P1 Critical",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  [TicketPriorityEnum.P2High]: {
    label: "P2 High",
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
  [TicketPriorityEnum.P3Normal]: {
    label: "P3 Normal",
    className: "bg-green-100 text-green-800 border-green-300",
  },
};

interface Props {
  priority: TicketPriorityEnum | null;
}

export default function TicketPriorityBadge({ priority }: Props) {
  if (!priority) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Chưa phân loại
      </Badge>
    );
  }
  const config = PRIORITY_CONFIG[priority] ?? {
    label: priority,
    className: "",
  };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
