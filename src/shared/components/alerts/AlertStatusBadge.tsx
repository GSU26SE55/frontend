import { Badge } from "@/components/ui/badge";
import { AlertStatusEnum } from "@/shared/enums/alerts/alert.enum";
import { toneClass, ALERT_STATUS_TONE } from "@/shared/theme/statusColors";

const LABEL: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: "Open",
  [AlertStatusEnum.Acknowledged]: "Acknowledged",
  [AlertStatusEnum.Merged]: "Merged",
  [AlertStatusEnum.Resolved]: "Resolved",
};

export default function AlertStatusBadge({
  status,
}: {
  status: AlertStatusEnum;
}) {
  const label = LABEL[status];
  if (!label) return <Badge variant="outline">—</Badge>;
  return (
    <Badge variant="outline" className={toneClass(ALERT_STATUS_TONE[status])}>
      {label}
    </Badge>
  );
}
