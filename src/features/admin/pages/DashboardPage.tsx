import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DashboardHeading,
  DashboardPanel,
  DashboardDonut,
  DashboardGauge,
  GaugeFooter,
  Stat,
  StatRail,
} from "@/shared/components/dashboard/DashboardPanel";
import { TopAlertingPanel } from "@/shared/components/dashboard/TopAlertingPanel";
import { useBatteryDashboardStats } from "@/shared/hooks/dashboard/useBatteryDashboard";
import { useSiteDashboardStats } from "@/shared/hooks/dashboard/useDashboardStats";
import { TicketHealthCard } from "@/features/admin/components/ticket/TicketHealthCard";
import { KEY } from "@/shared/utils/queryKeys";
import { plural, statusLine } from "@/shared/utils/plural";
import { toneVars } from "@/shared/theme/statusColors";
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
 * The page opens with a sentence stating whether anything is wrong, then the headline
 * numbers, then panels. Each panel uses a different chart shape (area, gauge, horizontal
 * bar, donut, ranking) so the kind of information is recognisable from the shape alone.
 */

const alertChartConfig = {
  critical: { label: "Critical", color: "var(--p1)" },
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
  16: "Low temperature",
  17: "Data integrity",
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
  // Undertemp là rủi ro an toàn (lithium plating khi sạc lạnh) nên cùng thang với Overheat;
  // 17 làm thiết bị bị Decommissioned vĩnh viễn — không có mức nào nặng hơn.
  16: "var(--p1)",
  17: "var(--p1)",
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
        ? toneVars("ok").fg
        : onlinePct >= 70
          ? toneVars("p3").fg
          : toneVars("p1").fg;

  // ── Site health: the average health score across sites, and how many sit below the
  // at-risk line. Read as a gauge so it matches "Batteries connected" above it. ──
  const avgHealth = Math.round(siteStats?.avgHealth ?? 0);
  const atRiskSites = siteStats?.atRiskCount ?? 0;
  const healthySites = Math.max(0, totalSites - atRiskSites);
  const healthColor =
    totalSites === 0
      ? "var(--muted-foreground)"
      : avgHealth >= 90
        ? toneVars("ok").fg
        : avgHealth >= 80
          ? toneVars("p3").fg
          : toneVars("p1").fg;

  const problems: string[] = [];
  if (offlineBatt > 0)
    problems.push(`${plural(offlineBatt, "battery", "batteries")} offline`);
  if (criticalOpen > 0)
    problems.push(
      `${plural(criticalOpen, "critical alert", "critical alerts")} open`,
    );
  if (activeIncidents > 0)
    problems.push(
      plural(
        activeIncidents,
        "environmental incident",
        "environmental incidents",
      ),
    );
  if (atRiskSites > 0)
    problems.push(`${plural(atRiskSites, "site", "sites")} below 80% health`);
  const status = statsLoading
    ? "Reading the latest device data."
    : statusLine(
        problems,
        "Every device is reporting and no alert is critical.",
      );

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

  // ── Visibility: empty panels are hidden entirely rather than left as blank cells ──
  const showAnomaly = statsLoading || anomalyData.length > 0;
  const showBattStatus = statsLoading || battByStatus.length > 0;
  const showTopAlerting = statsLoading || topAlerting.length > 0;

  return (
    <PageContainer>
      <DashboardHeading
        title="System health"
        status={status}
        refreshKeys={[KEY.siteDashboard, KEY.batteryDashboard]}
      />

      <StatRail className="mt-6">
        <Stat
          label="Sites"
          value={siteStatsLoading ? "--" : totalSites}
          to="/admin/sites"
        />
        <Stat
          label="Batteries online"
          value={statsLoading ? "--" : onlineBatt}
          to="/admin/battery-assets"
        />
        <Stat
          label="Batteries offline"
          value={statsLoading ? "--" : offlineBatt}
          tone={offlineBatt > 0 ? "p3" : undefined}
          to="/admin/iot-devices"
        />
        <Stat
          label="Open alerts"
          value={statsLoading ? "--" : openAlerts}
          tone={criticalOpen > 0 ? "p1" : undefined}
          to="/admin/alerts"
        />
        <Stat
          label="Environmental incidents"
          value={statsLoading ? "--" : activeIncidents}
          tone={activeIncidents > 0 ? "p1" : undefined}
          to="/admin/environmental-incidents"
        />
      </StatRail>

      <div className="mt-6">
        <TicketHealthCard />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* [Area] trend over time */}
        <DashboardPanel
          title={OVERVIEW_PANELS.admin.alerts7d}
          desc="By severity"
          className="h-80 lg:col-span-2"
        >
          {statsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer
              config={alertChartConfig}
              className="aspect-auto h-full min-h-0 w-full"
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
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${k})`}
                        stopOpacity={0.03}
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
          desc={`${onlineBatt} of ${totalBatt} reporting`}
          className="h-80"
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
                <GaugeFooter
                  cells={[
                    { value: onlineBatt, label: "Online", tone: "ok" },
                    {
                      value: offlineBatt,
                      label: "Offline",
                      tone: offlineBatt > 0 ? "p3" : undefined,
                    },
                  ]}
                />
              }
            />
          )}
        </DashboardPanel>

        {/* [Horizontal bar] category comparison */}
        {showAnomaly && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.alertsByType}
            desc="Colour by severity"
            className="h-70"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer
                config={anomalyChartConfig}
                className="aspect-auto h-full min-h-0 w-full"
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
                    tick={{ fontSize: 11.5 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" radius={4} maxBarSize={16}>
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
            className="h-70"
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

        {/* [Gauge] average health across sites — the third cell of this row, so the grid
            stays complete whether or not the ranking below has anything to show. */}
        <DashboardPanel
          title={OVERVIEW_PANELS.admin.siteHealth}
          desc={`${plural(totalSites, "site", "sites")}`}
          className="h-70"
        >
          {siteStatsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <DashboardGauge
              percent={avgHealth}
              valueText={totalSites > 0 ? `${avgHealth}%` : "—"}
              caption="avg health"
              color={healthColor}
              footer={
                <GaugeFooter
                  cells={[
                    { value: healthySites, label: "Healthy", tone: "ok" },
                    {
                      value: atRiskSites,
                      label: "At risk",
                      tone: atRiskSites > 0 ? "p1" : undefined,
                    },
                  ]}
                />
              }
            />
          )}
        </DashboardPanel>

        {/* [Ranking] actionable list */}
        {showTopAlerting && (
          <TopAlertingPanel
            title={OVERVIEW_PANELS.admin.topAlerting}
            assets={topAlerting}
            isLoading={statsLoading}
            onSelect={(a) =>
              navigate(`/admin/battery-assets/${a.batteryAssetId}`)
            }
            className="h-70"
          />
        )}
      </div>
    </PageContainer>
  );
}
