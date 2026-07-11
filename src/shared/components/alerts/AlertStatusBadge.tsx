import { Badge } from "@/components/ui/badge";
import { AlertStatusEnum } from "@/shared/enums/alert.enum";
import { toneClass, ALERT_STATUS_TONE } from "@/shared/theme/statusColors";

const LABEL: Record<AlertStatusEnum, string> = {
  [AlertStatusEnum.Open]: "Mở",
  [AlertStatusEnum.Acknowledged]: "Đã xác nhận",
  [AlertStatusEnum.Merged]: "Đã gộp",
  [AlertStatusEnum.Resolved]: "Đã xử lý",
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
