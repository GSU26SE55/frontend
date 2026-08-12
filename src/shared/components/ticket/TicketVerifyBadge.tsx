import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  TicketVerifyStatusEnum,
  TicketVerifyStatusLabel,
  TicketOriginEnum,
} from "@/shared/enums/ticket/ticket.enum";

// AI verify badge for manually created tickets — shared across admin/manager/staff.
// AI verify ONLY applies to tickets manually created by a Customer (ManualByCustomer).
// [Auto] tickets (from an Alert) / system / staff → NO badge shown (no need to verify legit/spam).
// Only stands out when Suspicious (suspected spam) or Pending (still checking).
interface Props {
  status?: TicketVerifyStatusEnum | null;
  /** Ticket origin — badge only shows for ManualByCustomer. */
  origin?: TicketOriginEnum | null;
  /** Hide the badge when legitimate/skipped (used in lists to keep things compact). */
  hideWhenOk?: boolean;
}

export default function TicketVerifyBadge({
  status,
  origin,
  hideWhenOk,
}: Props) {
  if (!status) return null;
  // Only manually Customer-created tickets get AI verify — [Auto]/System/Staff hide the badge.
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
