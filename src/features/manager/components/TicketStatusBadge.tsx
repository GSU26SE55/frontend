import { Badge } from "@/components/ui/badge";
import { TicketStatusEnum } from "@/features/manager/types/ticket.types";

const STATUS_CONFIG: Record<
  TicketStatusEnum,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [TicketStatusEnum.New]: { label: "Mới", variant: "secondary" },
  [TicketStatusEnum.Open]: { label: "Chờ triage", variant: "outline" },
  [TicketStatusEnum.Approved]: { label: "Đã duyệt", variant: "default" },
  [TicketStatusEnum.Assigned]: { label: "Đã gán", variant: "default" },
  [TicketStatusEnum.InProgress]: { label: "Đang xử lý", variant: "default" },
  [TicketStatusEnum.WaitingCustomer]: { label: "Chờ KH", variant: "secondary" },
  [TicketStatusEnum.WaitingParts]: {
    label: "Chờ linh kiện",
    variant: "secondary",
  },
  [TicketStatusEnum.WaitingOnsiteSchedule]: {
    label: "Chờ lịch hẹn",
    variant: "secondary",
  },
  [TicketStatusEnum.Resolved]: { label: "Đã xử lý", variant: "default" },
  [TicketStatusEnum.Escalated]: { label: "Chuyển cấp", variant: "destructive" },
  [TicketStatusEnum.ClosedPendingRate]: {
    label: "Chờ đánh giá",
    variant: "outline",
  },
  [TicketStatusEnum.Closed]: { label: "Đã đóng", variant: "secondary" },
  [TicketStatusEnum.ClosedRejected]: {
    label: "Từ chối",
    variant: "destructive",
  },
  [TicketStatusEnum.Incident]: { label: "Sự cố", variant: "destructive" },
};

interface Props {
  status: TicketStatusEnum;
}

export default function TicketStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
