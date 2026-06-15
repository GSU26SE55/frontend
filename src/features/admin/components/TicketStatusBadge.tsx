import { Badge } from "@/components/ui/badge";
import { TicketStatusEnum } from "@/shared/types/ticket.types";

const STATUS_CONFIG: Record<
  TicketStatusEnum,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [TicketStatusEnum.New]: { label: "Mới", variant: "secondary" },
  [TicketStatusEnum.Open]: { label: "Đang mở", variant: "secondary" },
  [TicketStatusEnum.Approved]: { label: "Đã duyệt", variant: "default" },
  [TicketStatusEnum.Assigned]: { label: "Đã gán", variant: "default" },
  [TicketStatusEnum.InProgress]: { label: "Đang xử lý", variant: "default" },
  [TicketStatusEnum.WaitingCustomer]: {
    label: "Chờ khách hàng",
    variant: "outline",
  },
  [TicketStatusEnum.WaitingParts]: {
    label: "Chờ linh kiện",
    variant: "outline",
  },
  [TicketStatusEnum.WaitingOnsiteSchedule]: {
    label: "Chờ lịch hẹn",
    variant: "outline",
  },
  [TicketStatusEnum.Resolved]: { label: "Đã giải quyết", variant: "default" },
  [TicketStatusEnum.Escalated]: { label: "Chuyển cấp", variant: "destructive" },
  [TicketStatusEnum.ClosedPendingRate]: {
    label: "Chờ đánh giá",
    variant: "secondary",
  },
  [TicketStatusEnum.Closed]: { label: "Đã đóng", variant: "secondary" },
  [TicketStatusEnum.ClosedRejected]: {
    label: "Từ chối đóng",
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
