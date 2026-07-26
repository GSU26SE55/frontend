import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  TicketVerifyStatusEnum,
  TicketVerifyStatusLabel,
  TicketOriginEnum,
} from "@/shared/enums/ticket/ticket.enum";

// Badge AI verify ticket thủ công — dùng chung admin/manager/staff.
// AI verify CHỈ áp dụng cho ticket do Customer tạo thủ công (ManualByCustomer).
// Ticket [Auto] (từ Alert) / hệ thống / staff → KHÔNG hiện badge (không cần verify thật/rác).
// Chỉ nổi bật khi Suspicious (nghi rác) hoặc Pending (đang kiểm tra).
interface Props {
  status?: TicketVerifyStatusEnum | null;
  /** Origin ticket — badge chỉ hiện với ManualByCustomer. */
  origin?: TicketOriginEnum | null;
  /** Ẩn badge khi hợp lệ/bỏ qua (dùng ở list cho gọn). */
  hideWhenOk?: boolean;
}

export default function TicketVerifyBadge({
  status,
  origin,
  hideWhenOk,
}: Props) {
  if (!status) return null;
  // Chỉ ticket Customer tạo thủ công mới có AI verify — [Auto]/System/Staff ẩn badge.
  if (origin && origin !== TicketOriginEnum.ManualByCustomer) return null;
  if (
    hideWhenOk &&
    (status === TicketVerifyStatusEnum.Legitimate ||
      status === TicketVerifyStatusEnum.Skipped)
  ) {
    return null;
  }

  const label = TicketVerifyStatusLabel[status] ?? status;

  if (status === TicketVerifyStatusEnum.Suspicious) {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700"
      >
        <AlertTriangle className="size-3" />
        AI: {label}
      </Badge>
    );
  }
  if (status === TicketVerifyStatusEnum.Pending) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        AI: {label}
      </Badge>
    );
  }
  if (status === TicketVerifyStatusEnum.Legitimate) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        <ShieldCheck className="size-3" />
        AI: {label}
      </Badge>
    );
  }
  // Skipped
  return (
    <Badge variant="outline" className="text-muted-foreground">
      AI: {label}
    </Badge>
  );
}
