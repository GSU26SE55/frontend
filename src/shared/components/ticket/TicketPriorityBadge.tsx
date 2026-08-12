import { Badge } from "@/components/ui/badge";
import { TicketPriorityEnum } from "@/shared/enums/ticket/ticket.enum";

// Priority badge SHARED across admin/manager/staff — previously had 3 diverging versions
// (P3 green in admin vs blue in manager/staff; different color intensities; English "Critical"
// vs Vietnamese "Nghiêm trọng" labels). Uses semantic tokens --p1/--p2/--p3 (already has a dark
// variant in index.css) instead of hardcoded Tailwind → consistent + correct dark mode.
const PRIORITY_CONFIG: Record<
  TicketPriorityEnum,
  { label: string; color: string; soft: string }
> = {
  [TicketPriorityEnum.P1Critical]: {
    label: "P1 · Critical",
    color: "var(--p1)",
    soft: "var(--p1-soft)",
  },
  [TicketPriorityEnum.P2High]: {
    label: "P2 · High",
    color: "var(--p2)",
    soft: "var(--p2-soft)",
  },
  [TicketPriorityEnum.P3Normal]: {
    label: "P3 · Normal",
    color: "var(--p3)",
    soft: "var(--p3-soft)",
  },
  // GH-1176: Urgent priority — SLA timer never runs for these tickets.
  [TicketPriorityEnum.Urgent]: {
    label: "Urgent",
    color: "var(--p1)",
    soft: "var(--p1-soft)",
  },
};

interface Props {
  priority: TicketPriorityEnum | null;
}

export default function TicketPriorityBadge({ priority }: Props) {
  if (!priority) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Unclassified
      </Badge>
    );
  }
  const config = PRIORITY_CONFIG[priority];
  if (!config) {
    return <Badge variant="outline">{priority}</Badge>;
  }
  return (
    <Badge
      variant="outline"
      style={{
        backgroundColor: config.soft,
        color: config.color,
        borderColor: config.color,
      }}
    >
      {config.label}
    </Badge>
  );
}
