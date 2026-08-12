import { Badge } from "@/components/ui/badge";
import { EnvironmentalIncidentStatusEnum } from "@/shared/enums/alerts/environmental.enum";
import { toneClass, INCIDENT_STATUS_TONE } from "@/shared/theme/statusColors";

const LABEL: Record<EnvironmentalIncidentStatusEnum, string> = {
  [EnvironmentalIncidentStatusEnum.Open]: "Open",
  [EnvironmentalIncidentStatusEnum.Acknowledged]: "Acknowledged",
  [EnvironmentalIncidentStatusEnum.Resolved]: "Resolved",
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: "False alarm",
};

export default function IncidentStatusBadge({
  status,
}: {
  status: EnvironmentalIncidentStatusEnum;
}) {
  const label = LABEL[status];
  if (!label) return <Badge variant="outline">—</Badge>;
  return (
    <Badge
      variant="outline"
      className={toneClass(INCIDENT_STATUS_TONE[status])}
    >
      {label}
    </Badge>
  );
}
