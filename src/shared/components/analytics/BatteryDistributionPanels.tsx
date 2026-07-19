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
    { name: "Khỏe (≥90%)", value: s.healthy, fill: "var(--ok)" },
    { name: "Bình thường (80–89%)", value: s.normal, fill: "var(--chart-2)" },
    { name: "Cảnh báo (75–79%)", value: s.warning, fill: "var(--p3)" },
    { name: "EOL (<75%)", value: s.eol, fill: "var(--p1)" },
    { name: "Chưa rõ", value: s.unknown, fill: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0);

const toDonut = (items: { count: number; name: string }[]): DonutDatum[] =>
  items.map((it, i) => ({
    name: it.name,
    value: it.count,
    fill: PALETTE[i % PALETTE.length],
  }));

/**
 * Phân bố pin từ /battery/dashboard/stats: SOH · Hóa học · Môi trường 24h.
 * Tách từ DashboardStatsSection để Dashboard (Admin) tái dùng — nguồn battery
 * aggregate server-side, không tính client-side.
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

  // Ẩn panel không có dữ liệu → reflow, không để ô trống. Cả 3 rỗng → không render gì.
  if (sohData.length === 0 && chemistryDonut.length === 0 && !hasAmbient)
    return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {sohData.length > 0 && (
        <DashboardPanel title="Phân bố SOH" className="h-50">
          <DashboardDonut
            data={sohData}
            centerValue={stats.totalAssets}
            centerLabel="pin"
          />
        </DashboardPanel>
      )}
      {chemistryDonut.length > 0 && (
        <DashboardPanel title="Hóa học pin" className="h-50">
          <DashboardDonut
            data={chemistryDonut}
            centerValue={stats.totalAssets}
            centerLabel="pin"
          />
        </DashboardPanel>
      )}
      {hasAmbient && (
        <DashboardPanel title="Môi trường (24 giờ)" className="h-50">
          <ReportTimeSeriesChart
            data={stats.ambientTrend24Hours}
            xKey="hourUtc"
            xFormat="HH:mm"
            series={[
              {
                key: "avgTemperature",
                label: "Nhiệt độ (°C)",
                color: "var(--chart-2)",
                connectNulls: true,
              },
              {
                key: "avgHumidity",
                label: "Độ ẩm (%)",
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
