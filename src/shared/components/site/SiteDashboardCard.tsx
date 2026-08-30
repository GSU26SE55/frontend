import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SiteDashboardDto } from "@/shared/types/site/site.types";
import {
  toneText,
  toneVars,
  healthScoreTone,
} from "@/shared/theme/statusColors";
import StatBreakdown from "@/shared/components/dashboard/StatBreakdown";
import type { BreakdownSegment } from "@/shared/components/dashboard/StatBreakdown";

function getHealthLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 50) return "Needs monitoring";
  return "Critical";
}

interface SiteDashboardCardProps {
  data: SiteDashboardDto;
}

export default function SiteDashboardCard({ data }: SiteDashboardCardProps) {
  const activeOnly = Math.max(
    0,
    data.activeAssets - data.assetsWithActiveAlerts,
  );
  const alertsCount = data.assetsWithActiveAlerts;
  // Everything not Active — Suspended and Decommissioned both land here, so this keeps the
  // umbrella term rather than borrowing either status name from the table below.
  const inactiveCount = Math.max(0, data.totalAssets - data.activeAssets);

  const healthTone = healthScoreTone(data.healthScore);

  const segments: BreakdownSegment[] = [
    { label: "Healthy", value: activeOnly, tone: "ok" },
    { label: "Open alerts", value: alertsCount, tone: "p1" },
    { label: "Inactive", value: inactiveCount, tone: "muted" },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Site overview</CardTitle>
        <Badge
          variant="outline"
          className="font-mono text-xs font-semibold px-2 py-0.5"
        >
          Total: {data.totalAssets}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <StatBreakdown segments={segments} total={data.totalAssets} />

        {/* Health score is a separate measure from the counts above — 100 less a penalty per
            inactive battery and per battery with an open alert — so it sits below its own
            divider instead of reading as a fourth column of the breakdown. It is the card's
            verdict, so it outsizes the breakdown counts rather than trailing them. */}
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-end justify-between gap-3">
            <span className="text-xs text-muted-foreground font-medium pb-1">
              Health score
            </span>
            <span className="flex items-baseline gap-2">
              <strong
                className={`text-3xl font-bold tabular-nums leading-none ${toneText(healthTone)}`}
              >
                {data.healthScore}
                <span className="text-xl">%</span>
              </strong>
              <span className={`text-xs font-semibold ${toneText(healthTone)}`}>
                {getHealthLabel(data.healthScore)}
              </span>
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, data.healthScore))}%`,
                backgroundColor: toneVars(healthTone).fg,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
