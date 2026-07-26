import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCascadeRisk } from "@/shared/hooks/battery/useCascadeRisk";
import type {
  CascadeRiskLevelName,
  ElectricalTopologyName,
} from "@/shared/types/battery/cascade.types";
import { toneClass, CASCADE_RISK_TONE } from "@/shared/theme/statusColors";

const LEVEL_LABEL: Record<CascadeRiskLevelName, string> = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
};

const TOPOLOGY_LABEL: Record<ElectricalTopologyName, string> = {
  Independent: "Độc lập",
  SeriesString: "Nối tiếp (Series)",
  ParallelBank: "Song song (Parallel)",
  SeriesParallel: "Hỗn hợp (Series-Parallel)",
};

// Fallback an toàn: nếu BE trả giá trị ngoài enum (vd số thay vì string name)
// thì hiển thị chính giá trị thô thay vì render trống im lặng.
const levelStyle = (lvl: CascadeRiskLevelName) =>
  toneClass(CASCADE_RISK_TONE[lvl] ?? "muted");
const levelLabel = (lvl: CascadeRiskLevelName) =>
  LEVEL_LABEL[lvl] ?? String(lvl);
const topologyLabel = (t: ElectricalTopologyName) =>
  TOPOLOGY_LABEL[t] ?? String(t);

interface CascadeRiskCardProps {
  assetId: string;
  // Admin bơm SetTopologyDialog + nút mở qua đây. Manager/Staff không có quyền →
  // không truyền → không hiện nút "Set topology". BE chặn POST /topology cho non-admin.
  topologyAction?: (ctx: {
    currentTopology?: ElectricalTopologyName;
    isLoading: boolean;
  }) => ReactNode;
}

export default function CascadeRiskCard({
  assetId,
  topologyAction,
}: CascadeRiskCardProps) {
  const { data, isLoading } = useCascadeRisk(assetId);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-muted-foreground" />
          <h3 className="text-base font-semibold tracking-tight">
            Rủi ro lan truyền
          </h3>
        </div>
        {topologyAction?.({
          currentTopology: data?.electricalTopology,
          isLoading,
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">
          Chưa có dữ liệu cascade risk.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums leading-none">
              {data.cascadeRiskScore.toFixed(2)}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${levelStyle(data.level)}`}
            >
              {levelLabel(data.level)}
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Cách đấu nối</dt>
            <dd className="text-right font-medium">
              {topologyLabel(data.electricalTopology)}
            </dd>
            <dt className="text-muted-foreground">Cập nhật gần nhất</dt>
            <dd className="text-right font-medium">
              {data.cascadeRiskUpdatedAt
                ? format(
                    new Date(data.cascadeRiskUpdatedAt),
                    "dd/MM/yyyy HH:mm",
                    {
                      locale: vi,
                    },
                  )
                : "Chưa tính"}
            </dd>
          </dl>
        </div>
      )}
    </Card>
  );
}
