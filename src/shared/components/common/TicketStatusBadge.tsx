import { Badge } from "@/components/ui/badge";
import { TicketStatusEnum } from "@/shared/enums/ticket.enum";

// Badge trạng thái ticket DÙNG CHUNG cho admin/manager/staff — trước đây có 3 bản
// riêng lệch nhau về label + màu (cùng status hiển thị khác nhau tuỳ role).
// 1 nguồn label + variant duy nhất để nhất quán cross-role.
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
  [TicketStatusEnum.Resolved]: { label: "Đã xử lý", variant: "default" },
  [TicketStatusEnum.Escalated]: {
    label: "Đã chuyển cấp",
    variant: "destructive",
  },
  [TicketStatusEnum.ClosedPendingRate]: {
    label: "Chờ đánh giá",
    variant: "secondary",
  },
  [TicketStatusEnum.Closed]: { label: "Đã đóng", variant: "secondary" },
  [TicketStatusEnum.ClosedRejected]: {
    label: "Bị từ chối",
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
