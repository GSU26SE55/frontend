import { Badge } from "@/components/ui/badge";
import { EnvironmentalIncidentStatusEnum } from "@/shared/enums/environmental.enum";

type Variant = "default" | "secondary" | "destructive" | "outline";

const CONFIG: Record<
  EnvironmentalIncidentStatusEnum,
  { label: string; variant: Variant }
> = {
  [EnvironmentalIncidentStatusEnum.Open]: {
    label: "Mở",
    variant: "destructive",
  },
  [EnvironmentalIncidentStatusEnum.Acknowledged]: {
    label: "Đã xác nhận",
    variant: "default",
  },
  [EnvironmentalIncidentStatusEnum.Resolved]: {
    label: "Đã xử lý",
    variant: "outline",
  },
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: {
    label: "Báo động giả",
    variant: "secondary",
  },
};

export default function IncidentStatusBadge({
  status,
}: {
  status: EnvironmentalIncidentStatusEnum;
}) {
  const cfg = CONFIG[status];
  if (!cfg) return <Badge variant="outline">—</Badge>;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
