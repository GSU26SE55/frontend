import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardPanel,
  DashboardDonut,
  type DonutDatum,
} from "@/shared/components/dashboard/DashboardPanel";
import { ReportTimeSeriesChart } from "./ReportTimeSeriesChart";
import type { BatteryDashboardStatsDto } from "@/shared/types/dashboard/analytics.types";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const sohDonut = (
  s: BatteryDashboardStatsDto["sohDistribution"],
): DonutDatum[] =>
  [
    { name: "Healthy (≥90%)", value: s.healthy, fill: "var(--ok)" },
    { name: "Normal (80–89%)", value: s.normal, fill: "var(--chart-2)" },
    { name: "Warning (75–79%)", value: s.warning, fill: "var(--p3)" },
    { name: "EOL (<75%)", value: s.eol, fill: "var(--p1)" },
    { name: "Unknown", value: s.unknown, fill: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0);

const toDonut = (items: { count: number; name: string }[]): DonutDatum[] =>
  items.map((it, i) => ({
    name: it.name,
    value: it.count,
    fill: PALETTE[i % PALETTE.length],
  }));

/**
 * Battery distribution from /battery/dashboard/stats: SOH · Chemistry · 24h environment.
 * Extracted from DashboardStatsSection so Dashboard (Admin) can reuse it — the battery
 * data is aggregated server-side, not computed client-side.
 */
export function BatteryDistributionPanels({
  stats,
  isLoading,
}: {
  stats: BatteryDashboardStatsDto | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-50 w-full" />
        ))}
      </div>
    );
  }

  const sohData = sohDonut(stats.sohDistribution);
  const chemistryDonut = toDonut(
    stats.chemistryDistribution.map((b) => ({
      name: b.chemistryName,
      count: b.assetCount,
    })),
  );
  const hasAmbient = stats.ambientTrend24Hours.some(
    (p) => p.avgTemperature != null || p.avgHumidity != null,
  );

  // Hide panels with no data → reflow instead of leaving an empty slot. If all 3 are empty, render nothing.
  if (sohData.length === 0 && chemistryDonut.length === 0 && !hasAmbient)
    return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {sohData.length > 0 && (
        <DashboardPanel title="SOH distribution" className="h-50">
          <DashboardDonut
            data={sohData}
            centerValue={stats.totalAssets}
            centerLabel="batteries"
          />
        </DashboardPanel>
      )}
      {chemistryDonut.length > 0 && (
        <DashboardPanel title="Battery chemistry" className="h-50">
          <DashboardDonut
            data={chemistryDonut}
            centerValue={stats.totalAssets}
            centerLabel="batteries"
          />
        </DashboardPanel>
      )}
      {hasAmbient && (
        <DashboardPanel title="Environment (24 hours)" className="h-50">
          <ReportTimeSeriesChart
            data={stats.ambientTrend24Hours}
            xKey="hourUtc"
            xFormat="HH:mm"
            series={[
              {
                key: "avgTemperature",
                label: "Temperature (°C)",
                color: "var(--chart-2)",
                connectNulls: true,
              },
              {
                key: "avgHumidity",
                label: "Humidity (%)",
                color: "var(--chart-3)",
                connectNulls: true,
              },
            ]}
          />
        </DashboardPanel>
      )}
    </div>
  );
}
