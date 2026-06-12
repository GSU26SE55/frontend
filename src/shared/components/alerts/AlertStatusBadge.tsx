import { Badge } from "@/components/ui/badge";
import { AlertStatusEnum } from "@/shared/enums/alert.enum";

type Variant = "default" | "secondary" | "destructive" | "outline";

const CONFIG: Record<AlertStatusEnum, { label: string; variant: Variant }> = {
  [AlertStatusEnum.Open]: { label: "Mở", variant: "default" },
  [AlertStatusEnum.Acknowledged]: {
    label: "Đã xác nhận",
    variant: "secondary",
  },
  [AlertStatusEnum.Merged]: { label: "Đã gộp", variant: "outline" },
  [AlertStatusEnum.Resolved]: { label: "Đã xử lý", variant: "outline" },
};

export default function AlertStatusBadge({
  status,
}: {
  status: AlertStatusEnum;
}) {
  const cfg = CONFIG[status];
  if (!cfg) return <Badge variant="outline">—</Badge>;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
