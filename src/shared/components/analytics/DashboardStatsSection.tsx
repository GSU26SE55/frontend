import {
  Battery,
  BatteryCharging,
  PowerOff,
  BellRing,
  ShieldAlert,
  MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardKpi,
  DashboardPanel,
  DashboardDonut,
  type DonutDatum,
} from "@/shared/components/common/DashboardPanel";
import { ReportTimeSeriesChart } from "./ReportTimeSeriesChart";
import { useBatteryDashboardStats } from "@/shared/hooks/useBatteryDashboard";
import type {
  BatteryDashboardStatsDto,
  DashboardStatsParams,
} from "@/shared/types/analytics.types";

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

// Phần dashboard tổng quan: KPI + charts từ 1 call /battery/dashboard/stats.
export function DashboardStatsSection({
  params,
}: {
  params: DashboardStatsParams;
}) {
  const { data: stats, isLoading } = useBatteryDashboardStats(params);

  if (isLoading || !stats) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  const statusDonut = toDonut(
    stats.assetStatusDistribution.map((b) => ({
      name: b.statusName,
      count: b.count,
    })),
  );
  const chemistryDonut = toDonut(
    stats.chemistryDistribution.map((b) => ({
      name: b.chemistryName,
      count: b.assetCount,
    })),
  );

  return (
    <div className="space-y-3">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <DashboardKpi
          label="Tổng pin"
          value={stats.totalAssets}
          icon={<Battery className="size-4" />}
        />
        <DashboardKpi
          label="Đang hoạt động"
          value={stats.activeAssets}
          icon={<BatteryCharging className="size-4" />}
        />
        <DashboardKpi
          label="Offline"
          value={stats.offlineAssets}
          icon={<PowerOff className="size-4" />}
        />
        <DashboardKpi
          label="Cảnh báo mở"
          value={stats.openAlerts}
          sub={`${stats.openAlertsCritical} critical`}
          icon={<BellRing className="size-4" />}
        />
        <DashboardKpi
          label="Sự cố môi trường"
          value={stats.openEnvironmentalIncidents}
          icon={<ShieldAlert className="size-4" />}
        />
        <DashboardKpi
          label="Số site"
          value={stats.sites}
          icon={<MapPin className="size-4" />}
        />
      </div>

      {/* Donut distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <DashboardPanel title="Trạng thái pin" className="h-50">
          <DashboardDonut
            data={statusDonut}
            centerValue={stats.totalAssets}
            centerLabel="pin"
          />
        </DashboardPanel>
        <DashboardPanel title="Phân bố SOH" className="h-50">
          <DashboardDonut
            data={sohDonut(stats.sohDistribution)}
            centerValue={stats.totalAssets}
            centerLabel="pin"
          />
        </DashboardPanel>
        <DashboardPanel title="Hóa học pin" className="h-50">
          <DashboardDonut
            data={chemistryDonut}
            centerValue={stats.totalAssets}
            centerLabel="pin"
          />
        </DashboardPanel>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DashboardPanel title="Xu hướng cảnh báo (7 ngày)">
          <ReportTimeSeriesChart
            data={stats.alertTrend7Days}
            xKey="date"
            xFormat="dd/MM"
            series={[
              { key: "critical", label: "Critical", color: "var(--p1)" },
              { key: "warning", label: "Warning", color: "var(--p3)" },
              { key: "info", label: "Info", color: "var(--muted-foreground)" },
            ]}
          />
        </DashboardPanel>
        <DashboardPanel title="Môi trường (24 giờ)">
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
      </div>
    </div>
  );
}
