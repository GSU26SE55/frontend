import { Badge } from "@/components/ui/badge";
import { AlertSeverityEnum } from "@/shared/enums/alerts/alert.enum";
import { toneClass, ALERT_SEVERITY_TONE } from "@/shared/theme/statusColors";

const LABEL: Record<AlertSeverityEnum, string> = {
  [AlertSeverityEnum.Info]: "Thông tin",
  [AlertSeverityEnum.Warning]: "Cảnh báo",
  [AlertSeverityEnum.Critical]: "Nguy hiểm",
};

export default function AlertSeverityBadge({
  severity,
}: {
  severity: AlertSeverityEnum;
}) {
  const label = LABEL[severity];
  if (!label) return <Badge variant="outline">—</Badge>;
  return (
    <Badge
      variant="outline"
      className={toneClass(ALERT_SEVERITY_TONE[severity])}
    >
      {label}
    </Badge>
  );
}
