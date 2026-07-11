import { Badge } from "@/components/ui/badge";
import { TicketStatusEnum } from "@/shared/enums/ticket.enum";
import { toneClass, TICKET_STATUS_TONE } from "@/shared/theme/statusColors";

// Badge trạng thái ticket DÙNG CHUNG cho admin/manager/staff — trước đây có 3 bản
// riêng lệch nhau về label + màu. 1 nguồn label + tông màu semantic duy nhất
// (token --ok/--info/--p1... — phân biệt được Escalated/Incident vs Resolved,
// điều shadcn variant 4-màu không làm được).
const STATUS_LABEL: Record<TicketStatusEnum, string> = {
  [TicketStatusEnum.New]: "Mới",
  [TicketStatusEnum.Open]: "Chờ triage",
  [TicketStatusEnum.Approved]: "Đã duyệt",
  [TicketStatusEnum.Assigned]: "Đã gán",
  [TicketStatusEnum.InProgress]: "Đang xử lý",
  [TicketStatusEnum.WaitingCustomer]: "Chờ khách hàng",
  [TicketStatusEnum.WaitingParts]: "Chờ linh kiện",
  [TicketStatusEnum.WaitingOnsiteSchedule]: "Chờ lịch hẹn",
  [TicketStatusEnum.Resolved]: "Đã xử lý",
  [TicketStatusEnum.Escalated]: "Đã chuyển cấp",
  [TicketStatusEnum.ClosedPendingRate]: "Chờ đánh giá",
  [TicketStatusEnum.Closed]: "Đã đóng",
  [TicketStatusEnum.ClosedRejected]: "Bị từ chối",
  [TicketStatusEnum.Incident]: "Sự cố",
};

interface Props {
  status: TicketStatusEnum;
}

export default function TicketStatusBadge({ status }: Props) {
  const label = STATUS_LABEL[status] ?? status;
  const tone = TICKET_STATUS_TONE[status] ?? "muted";
  return (
    <Badge variant="outline" className={toneClass(tone)}>
      {label}
    </Badge>
  );
}
