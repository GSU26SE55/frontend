import { Badge } from "@/components/ui/badge";
import { EnvironmentalIncidentTypeEnum } from "@/shared/enums/alerts/environmental.enum";
import { incidentTypeLabel } from "@/shared/constants/incidentLabels";

export default function IncidentTypeBadge({
  incidentType,
}: {
  incidentType: EnvironmentalIncidentTypeEnum;
}) {
  return <Badge variant="outline">{incidentTypeLabel(incidentType)}</Badge>;
}
