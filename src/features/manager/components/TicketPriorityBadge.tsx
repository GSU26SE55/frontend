import { Badge } from "@/components/ui/badge";
import { TicketPriorityEnum } from "@/shared/types/ticket.types";

const PRIORITY_CONFIG: Record<
  TicketPriorityEnum,
  { label: string; className: string }
> = {
  [TicketPriorityEnum.P1Critical]: {
    label: "P1 Critical",
    className: "bg-red-600 text-white hover:bg-red-700",
  },
  [TicketPriorityEnum.P2High]: {
    label: "P2 High",
    className: "bg-orange-500 text-white hover:bg-orange-600",
  },
  [TicketPriorityEnum.P3Normal]: {
    label: "P3 Normal",
    className: "bg-blue-500 text-white hover:bg-blue-600",
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
  return <Badge className={config.className}>{config.label}</Badge>;
}
