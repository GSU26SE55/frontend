import { Badge } from "@/components/ui/badge";
import { EnvironmentalIncidentTypeEnum } from "@/shared/enums/environmental.enum";
import { incidentTypeLabel } from "./incidentLabels";

export default function IncidentTypeBadge({
  incidentType,
}: {
  incidentType: EnvironmentalIncidentTypeEnum;
}) {
  return <Badge variant="outline">{incidentTypeLabel(incidentType)}</Badge>;
}
