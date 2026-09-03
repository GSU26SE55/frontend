import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/shared/utils/datetime";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCascadeRisk } from "@/shared/hooks/battery/useCascadeRisk";
import type {
  CascadeRiskLevelName,
  ElectricalTopologyName,
} from "@/shared/types/battery/cascade.types";
import { toneClass, CASCADE_RISK_TONE } from "@/shared/theme/statusColors";
import { TOPOLOGY_LABEL } from "@/shared/constants/cascadeLabels";

const LEVEL_LABEL: Record<CascadeRiskLevelName, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
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
                ? formatDateTime(data.cascadeRiskUpdatedAt)
                : "Not computed yet"}
            </dd>
          </dl>

          {/* Live breakdown — see CascadeRiskDto.riskFactors. Empty for a healthy Independent
              battery with no open alerts, so the section just doesn't render rather than
              showing an empty "Why" heading. */}
          {data.riskFactors.length > 0 && (
            <div className="pt-1 border-t border-border/50 space-y-1">
              <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                Why
              </p>
              <ul className="space-y-0.5">
                {data.riskFactors.map((reason) => (
                  <li
                    key={reason}
                    className="text-xs text-muted-foreground list-disc list-inside"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
