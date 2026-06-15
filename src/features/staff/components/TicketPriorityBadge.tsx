import { Badge } from "@/components/ui/badge";
import { TicketPriorityEnum } from "@/shared/types/ticket.types";

const PRIORITY_CONFIG: Record<
  TicketPriorityEnum,
  { label: string; className: string }
> = {
  [TicketPriorityEnum.P1Critical]: {
    label: "P1 - Nghiêm trọng",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  [TicketPriorityEnum.P2High]: {
    label: "P2 - Cao",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  [TicketPriorityEnum.P3Normal]: {
    label: "P3 - Bình thường",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

interface Props {
  priority: TicketPriorityEnum | null;
}

export function TicketPriorityBadge({ priority }: Props) {
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
