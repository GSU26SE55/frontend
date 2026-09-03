import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SiteCascadeRiskSummaryDto } from "@/shared/types/battery/cascade.types";
import {
  toneText,
  toneVars,
  ELECTRICAL_TOPOLOGY_TONE,
} from "@/shared/theme/statusColors";
import type { StatusTone } from "@/shared/theme/statusColors";
import { displayNameOrShortId } from "@/shared/utils/displayId";
import StatBreakdown from "@/shared/components/dashboard/StatBreakdown";
import type { BreakdownSegment } from "@/shared/components/dashboard/StatBreakdown";
import { TOPOLOGY_LABEL } from "@/shared/constants/cascadeLabels";

interface CascadeRiskSummaryProps {
  summary: SiteCascadeRiskSummaryDto | undefined;
  isLoading?: boolean;
}

/** Score bands mirror the high/medium/low counts the BE sends, so the meter agrees with them. */
function scoreTone(score: number): StatusTone {
  if (score >= 0.7) return "p1";
  if (score >= 0.4) return "p3";
  return "ok";
}

function scoreLabel(score: number): string {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

export default function CascadeRiskSummary({
  summary,
  isLoading,
}: CascadeRiskSummaryProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const hasHighRisk = summary.highRiskCount > 0;
  const maxTone = scoreTone(summary.maxScore);

  const segments: BreakdownSegment[] = [
    { label: "High risk", value: summary.highRiskCount, tone: "p1" },
    { label: "Medium", value: summary.mediumRiskCount, tone: "p3" },
    { label: "Low", value: summary.lowRiskCount, tone: "ok" },
  ];

  // Counted server-side across every asset in the site (see GetSiteCascadeRiskSummaryQueryHandler)
  // — safe to sum here regardless of which page the battery list below happens to be on.
  const topologySegments: BreakdownSegment[] = [
    {
      label: TOPOLOGY_LABEL.Independent,
      value: summary.independentCount,
      tone: ELECTRICAL_TOPOLOGY_TONE.Independent,
    },
    {
      label: TOPOLOGY_LABEL.ParallelBank,
      value: summary.parallelBankCount,
      tone: ELECTRICAL_TOPOLOGY_TONE.ParallelBank,
    },
    {
      label: TOPOLOGY_LABEL.SeriesParallel,
      value: summary.seriesParallelCount,
      tone: ELECTRICAL_TOPOLOGY_TONE.SeriesParallel,
    },
    {
      label: TOPOLOGY_LABEL.SeriesString,
      value: summary.seriesStringCount,
      tone: ELECTRICAL_TOPOLOGY_TONE.SeriesString,
    },
  ];

  const Icon = hasHighRisk ? ShieldAlert : ShieldCheck;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Icon
            className={`size-4 ${hasHighRisk ? toneText("p1") : toneText("ok")}`}
          />
          <CardTitle className="text-base">Cascade risk</CardTitle>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs font-semibold px-2 py-0.5"
        >
          {summary.totalAssets} rated
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <StatBreakdown segments={segments} total={summary.totalAssets} />

        {/* The worst single battery, not a total — a linear meter rather than another
            count, so this card is distinguishable from Site overview at a glance instead
            of repeating the same three-column shape twice across the row. */}
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-end justify-between gap-3">
            <span className="text-xs text-muted-foreground font-medium pb-1">
              Highest risk score
            </span>
            <span className="flex items-baseline gap-2">
              <strong
                className={`font-mono text-3xl font-bold tabular-nums leading-none ${toneText(maxTone)}`}
              >
                {summary.maxScore.toFixed(2)}
              </strong>
              <span className={`text-xs font-semibold ${toneText(maxTone)}`}>
                {scoreLabel(summary.maxScore)}
              </span>
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, summary.maxScore * 100))}%`,
                backgroundColor: toneVars(maxTone).fg,
              }}
            />
          </div>

          {summary.highRiskAssets.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-2xs text-muted-foreground font-medium">
                Watch:
              </span>
              {summary.highRiskAssets.slice(0, 4).map((a) => (
                <Badge
                  key={a.batteryAssetId}
                  variant="outline"
                  className="text-3xs font-mono px-2 py-0.5 border-p1/30 text-p1 bg-p1/10 font-semibold"
                >
                  {displayNameOrShortId(a.serialNumber, a.batteryAssetId)} (
                  {a.cascadeRiskScore.toFixed(2)})
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* By wiring — lets a Manager spot "this site is mostly Series" at a glance, without
            opening every battery's Set topology dialog one at a time. */}
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            By wiring
          </p>
          <StatBreakdown segments={topologySegments} total={summary.totalAssets} />
        </div>
      </CardContent>
    </Card>
  );
}
