import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
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
  Low: "Low",
  Medium: "Medium",
  High: "High",
};

const TOPOLOGY_LABEL: Record<ElectricalTopologyName, string> = {
  Independent: "Independent",
  SeriesString: "Series",
  ParallelBank: "Parallel",
  SeriesParallel: "Series-Parallel",
};

// Safe fallback: if the BE returns a value outside the enum (e.g. a number instead
// of the string name), show the raw value instead of silently rendering nothing.
const levelStyle = (lvl: CascadeRiskLevelName) =>
  toneClass(CASCADE_RISK_TONE[lvl] ?? "muted");
const levelLabel = (lvl: CascadeRiskLevelName) =>
  LEVEL_LABEL[lvl] ?? String(lvl);
const topologyLabel = (t: ElectricalTopologyName) =>
  TOPOLOGY_LABEL[t] ?? String(t);

interface CascadeRiskCardProps {
  assetId: string;
  // Admin injects SetTopologyDialog + the button that opens it here. Manager/Staff have
  // no permission → don't pass it → the "Set topology" button doesn't show. BE blocks POST /topology for non-admins.
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
            Cascade risk
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
          No cascade risk data yet.
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
            <dt className="text-muted-foreground">Wiring topology</dt>
            <dd className="text-right font-medium">
              {topologyLabel(data.electricalTopology)}
            </dd>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="text-right font-medium">
              {data.cascadeRiskUpdatedAt
                ? format(
                    new Date(data.cascadeRiskUpdatedAt),
                    "MM/dd/yyyy HH:mm",
                    {
                      locale: enUS,
                    },
                  )
                : "Not computed yet"}
            </dd>
          </dl>
        </div>
      )}
    </Card>
  );
}
