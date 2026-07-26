import { Badge } from "@/components/ui/badge";
import { TicketPriorityEnum } from "@/shared/enums/ticket/ticket.enum";

// Badge priority DÙNG CHUNG cho admin/manager/staff — trước đây có 3 bản lệch
// nhau (P3 green ở admin vs blue ở manager/staff; cường độ màu khác nhau; label
// "Critical" vs "Nghiêm trọng"). Dùng token semantic --p1/--p2/--p3 (đã có bản
// dark trong index.css) thay vì hardcode Tailwind → nhất quán + đúng dark mode.
const PRIORITY_CONFIG: Record<
  TicketPriorityEnum,
  { label: string; color: string; soft: string }
> = {
  [TicketPriorityEnum.P1Critical]: {
    label: "P1 · Nghiêm trọng",
    color: "var(--p1)",
    soft: "var(--p1-soft)",
  },
  [TicketPriorityEnum.P2High]: {
    label: "P2 · Cao",
    color: "var(--p2)",
    soft: "var(--p2-soft)",
  },
  [TicketPriorityEnum.P3Normal]: {
    label: "P3 · Bình thường",
    color: "var(--p3)",
    soft: "var(--p3-soft)",
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
