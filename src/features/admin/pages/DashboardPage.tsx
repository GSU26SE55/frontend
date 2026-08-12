import { useNavigate } from "react-router-dom";
import {
  MapPin,
  BatteryCharging,
  BellRing,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DashboardKpi,
  DashboardPanel,
  DashboardDonut,
  DashboardGauge,
} from "@/shared/components/dashboard/DashboardPanel";
import { TopAlertingPanel } from "@/shared/components/dashboard/TopAlertingPanel";
import { useBatteryDashboardStats } from "@/shared/hooks/dashboard/useBatteryDashboard";
import { useSiteDashboardStats } from "@/shared/hooks/dashboard/useDashboardStats";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { TicketHealthCard } from "@/features/admin/components/ticket/TicketHealthCard";
import { KEY } from "@/shared/utils/queryKeys";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { OVERVIEW_PANELS } from "@/shared/constants/overviewPanels";

/**
 * Admin = INFRASTRUCTURE & SYSTEM HEALTH: sites, batteries, connectivity, alerts,
 * environmental incidents, service health.
 *
 * Does NOT show SLA / ticket pipeline — that is the Manager's coordination surface.
 * Admin needs to know "is the system healthy", not "how far along is the ticket".
 *
 * Layout: ONE FIXED FRAME, the page does not scroll (`overflow-hidden`). The
 * remaining height is split into exactly 2 panel rows via `grid-rows-2` +
 * `flex-1 min-h-0`; any panel that is a list scrolls INSIDE itself instead of
 * stretching the page.
 *
 * Each panel uses a different chart shape (area / gauge / horizontal bar / donut /
 * leaderboard) so the kind of information is recognizable from the shape alone.
 */

const alertChartConfig = {
  critical: { label: "Critical", color: "var(--destructive)" },
  warning: { label: "Warning", color: "var(--p3)" },
  info: { label: "Info", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const anomalyChartConfig = {
  value: { label: "Alerts" },
} satisfies ChartConfig;

const ANOMALY_LABEL: Record<number, string> = {
  1: "Overheat",
  2: "Overvoltage",
  3: "Voltage drop",
  4: "Low SOC",
  5: "Fast discharge",
  6: "Abnormal charging",
  7: "Connection lost",
  8: "SOH degradation",
  9: "High temperature",
  10: "High humidity",
  11: "High heat-humidity",
  12: "High internal resistance",
  13: "Cell imbalance",
  14: "Env. incident",
  15: "Sensor drift",
};

const ANOMALY_SEVERITY_COLOR: Record<number, string> = {
  1: "var(--p1)",
  2: "var(--p1)",
  3: "var(--p3)",
  4: "var(--p3)",
  5: "var(--p3)",
  6: "var(--p3)",
  7: "var(--muted-foreground)",
  8: "var(--p3)",
  9: "var(--p1)",
  10: "var(--p3)",
  11: "var(--p1)",
  12: "var(--p3)",
  13: "var(--p3)",
  14: "var(--p3)",
  15: "var(--muted-foreground)",
};

const BATTERY_STATUS_META: Record<number, { name: string; fill: string }> = {
  1: { name: "Active", fill: "var(--ok)" },
  2: { name: "Inactive", fill: "var(--p3)" },
  3: { name: "Decommissioned", fill: "var(--p1)" },
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useBatteryDashboardStats();
  const { data: siteStats, isLoading: siteStatsLoading } =
    useSiteDashboardStats();

  // ── Infrastructure ──
  const totalSites = siteStats?.total ?? 0;
  const totalBatt = stats?.totalAssets ?? 0;
  const offlineBatt = stats?.offlineAssets ?? 0;
  const openAlerts = stats?.openAlerts ?? 0;
  const criticalOpen = stats?.openAlertsCritical ?? 0;
  const activeIncidents = stats?.openEnvironmentalIncidents ?? 0;

  // ── Share of batteries still connected — the "can the system still see the devices" metric ──
  const onlineBatt = Math.max(0, totalBatt - offlineBatt);
  const onlinePct =
    totalBatt > 0 ? Math.round((onlineBatt / totalBatt) * 100) : 0;
  const onlineColor =
    totalBatt === 0
      ? "var(--muted-foreground)"
      : onlinePct >= 90
        ? "var(--ok)"
        : onlinePct >= 70
          ? "var(--p3)"
          : "var(--p1)";

  const alertSeries = stats?.alertTrend7Days ?? [];

  // Horizontal bar: take the top 6 and reverse the order so the most frequent
  // type sits at the TOP (Recharts draws the first category at the bottom with
  // a vertical layout).
  const anomalyData = (stats?.openAlertsByType ?? [])
    .map((a) => ({
      label: ANOMALY_LABEL[a.anomalyType] ?? `Type ${a.anomalyType}`,
      value: a.count,
      color: ANOMALY_SEVERITY_COLOR[a.anomalyType] ?? "var(--muted-foreground)",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .reverse();

  const topAlerting = stats?.topAlertingAssets ?? [];

  const battByStatus = (stats?.assetStatusDistribution ?? [])
    .map((b) => ({
      name: BATTERY_STATUS_META[b.status]?.name ?? b.statusName,
      value: b.count,
      fill: BATTERY_STATUS_META[b.status]?.fill ?? "var(--muted-foreground)",
    }))
    .filter((d) => d.value > 0);

  // ── Visibility: empty panels are hidden entirely, so no blank cells inside the fixed frame ──
  const showAnomaly = statsLoading || anomalyData.length > 0;
  const showBattStatus = statsLoading || battByStatus.length > 0;
  const showTopAlerting = statsLoading || topAlerting.length > 0;

  return (
    <div className="h-full flex flex-col gap-2.5 p-3 lg:p-4 overflow-y-auto lg:overflow-hidden">
      {/* ── Header ── */}
      <div className="flex justify-end shrink-0">
        <RefreshButton
          queryKeys={[KEY.siteDashboard, KEY.batteryDashboard]}
          label="Sync"
        />
      </div>

      {/* ── KPI strip — clickable, jumps straight to the matching page ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-2.5 shrink-0">
        <DashboardKpi
          label="Sites"
          value={siteStatsLoading ? "--" : totalSites}
          icon={<MapPin className="size-4" />}
          to="/admin/sites"
        />
        <DashboardKpi
          label="Batteries online"
          value={statsLoading ? "--" : onlineBatt}
          icon={<BatteryCharging className="size-4" />}
          to="/admin/battery-assets"
        />
        <DashboardKpi
          label="Batteries offline"
          value={statsLoading ? "--" : offlineBatt}
          icon={<WifiOff className="size-4" />}
          accent={offlineBatt > 0 ? "var(--p3)" : undefined}
          to="/admin/iot-devices"
        />
        <DashboardKpi
          label="Open alerts"
          value={statsLoading ? "--" : openAlerts}
          icon={<BellRing className="size-4" />}
          accent={criticalOpen > 0 ? "var(--p1)" : undefined}
          to="/admin/alerts"
        />
        <DashboardKpi
          label="Environmental incidents"
          value={statsLoading ? "--" : activeIncidents}
          icon={<ShieldAlert className="size-4" />}
          accent={activeIncidents > 0 ? "var(--p1)" : undefined}
          to="/admin/environmental-incidents"
        />
      </div>

      {/* ── Service health (thin strip) ── */}
      <div className="shrink-0">
        <TicketHealthCard />
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 lg:gap-3 flex-1 min-h-0">
        {/* [Area] trend over time */}
        <DashboardPanel
          title={OVERVIEW_PANELS.admin.alerts7d}
          desc="By severity"
          className="lg:col-span-2 min-h-[180px] lg:min-h-0"
        >
          {statsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer
              config={alertChartConfig}
              className="h-full w-full aspect-auto min-h-0"
            >
              <AreaChart
                data={alertSeries}
                margin={{ left: 0, right: 6, top: 4 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) =>
                    `${v.slice(5, 7)}/${v.slice(8, 10)}`
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                {/* width 38 clips 3-digit numbers (alert counts reach the hundreds). */}
                <YAxis
                  width={38}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <defs>
                  {(["critical", "warning", "info"] as const).map((k) => (
                    <linearGradient
                      key={k}
                      id={`alertFill-${k}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`var(--color-${k})`}
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${k})`}
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  ))}
                </defs>
                {(["critical", "warning", "info"] as const).map((k) => (
                  <Area
                    key={k}
                    dataKey={k}
                    type="monotone"
                    stackId="a"
                    stroke={`var(--color-${k})`}
                    fill={`url(#alertFill-${k})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
          )}
        </DashboardPanel>

        {/* [Gauge] a single ratio */}
        <DashboardPanel
          title="Batteries connected"
          desc={`${onlineBatt}/${totalBatt} devices reporting data`}
          className="min-h-[180px] lg:min-h-0"
        >
          {statsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <DashboardGauge
              percent={onlinePct}
              valueText={totalBatt > 0 ? `${onlinePct}%` : "—"}
              caption="online"
              color={onlineColor}
              footer={
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-muted/40 py-2 px-1">
                    <p
                      className="text-base font-bold tabular-nums"
                      style={{ color: "var(--ok)" }}
                    >
                      {onlineBatt}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Online
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 py-2 px-1">
                    <p
                      className="text-base font-bold tabular-nums"
                      style={{
                        color: offlineBatt > 0 ? "var(--p3)" : undefined,
                      }}
                    >
                      {offlineBatt}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Offline
                    </p>
                  </div>
                </div>
              }
            />
          )}
        </DashboardPanel>

        {/* [Horizontal bar] category comparison */}
        {showAnomaly && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.alertsByType}
            desc="Top types · color by severity"
            className="min-h-[160px] lg:min-h-0"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer
                config={anomalyChartConfig}
                className="h-full w-full aspect-auto min-h-0"
              >
                <BarChart
                  accessibilityLayer
                  data={anomalyData}
                  layout="vertical"
                  margin={{ left: 4, right: 16 }}
                >
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11.5, fontWeight: 500 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" radius={4} maxBarSize={18}>
                    {anomalyData.map((d) => (
                      <Cell key={d.label} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </DashboardPanel>
        )}
        {/* [Donut] composition breakdown */}
        {showBattStatus && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.batteryByStatus}
            desc={`${totalBatt} batteries`}
            className="min-h-[160px] lg:min-h-0"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DashboardDonut
                data={battByStatus}
                centerValue={totalBatt}
                centerLabel="batteries"
              />
            )}
          </DashboardPanel>
        )}

        {/* [Leaderboard] actionable list */}
        {showTopAlerting && (
          <TopAlertingPanel
            title={OVERVIEW_PANELS.admin.topAlerting}
            assets={topAlerting}
            isLoading={statsLoading}
            onSelect={(a) =>
              navigate(`/admin/battery-assets/${a.batteryAssetId}`)
            }
            className="min-h-[160px] lg:min-h-0"
          />
        )}
      </div>
    </div>
  );
}
