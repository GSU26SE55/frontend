import { Badge } from "@/components/ui/badge";
import type { TicketStatusEnum } from "@/shared/types/ticket.types";

const STATUS_CONFIG: Record<
  TicketStatusEnum,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  New: { label: "Mới", variant: "secondary" },
  Open: { label: "Đang mở", variant: "secondary" },
  Approved: { label: "Đã duyệt", variant: "default" },
  Assigned: { label: "Đã gán", variant: "default" },
  InProgress: { label: "Đang xử lý", variant: "default" },
  WaitingCustomer: { label: "Chờ khách hàng", variant: "outline" },
  WaitingParts: { label: "Chờ linh kiện", variant: "outline" },
  WaitingOnsiteSchedule: { label: "Chờ lịch hẹn", variant: "outline" },
  Resolved: { label: "Đã giải quyết", variant: "default" },
  Escalated: { label: "Chuyển cấp", variant: "destructive" },
  ClosedPendingRate: { label: "Chờ đánh giá", variant: "secondary" },
  Closed: { label: "Đã đóng", variant: "secondary" },
  ClosedRejected: { label: "Từ chối đóng", variant: "destructive" },
  Incident: { label: "Sự cố", variant: "destructive" },
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
