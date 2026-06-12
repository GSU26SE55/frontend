import { Badge } from "@/components/ui/badge";
import { AlertSeverityEnum } from "@/shared/enums/alert.enum";

type Variant = "default" | "secondary" | "destructive" | "outline";

const CONFIG: Record<AlertSeverityEnum, { label: string; variant: Variant }> = {
  [AlertSeverityEnum.Info]: { label: "Thông tin", variant: "secondary" },
  [AlertSeverityEnum.Warning]: { label: "Cảnh báo", variant: "default" },
  [AlertSeverityEnum.Critical]: { label: "Nguy hiểm", variant: "destructive" },
};

export default function AlertSeverityBadge({
  severity,
}: {
  severity: AlertSeverityEnum;
}) {
  const cfg = CONFIG[severity];
  if (!cfg) return <Badge variant="outline">—</Badge>;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
