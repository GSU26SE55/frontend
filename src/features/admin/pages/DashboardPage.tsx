import { useNavigate } from "react-router-dom";
import {
  MapPin,
  BatteryCharging,
  BellRing,
  Ticket,
  ShieldAlert,
  WifiOff,
  ArrowRight,
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
import { useSiteList } from "@/features/admin/hooks/useSites";
import { useBatteryDashboardStats } from "@/shared/hooks/useBatteryDashboard";
import {
  useTicketDashboardStats,
  useSiteDashboardStats,
} from "@/shared/hooks/useDashboardStats";
import { BatteryDistributionPanels } from "@/shared/components/analytics/BatteryDistributionPanels";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { TicketHealthCard } from "@/features/admin/components/TicketHealthCard";
import { KEY } from "@/shared/utils/queryKeys";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { siteHealth, healthColor } from "@/shared/utils/site.utils";
import { OVERVIEW_PANELS } from "@/shared/utils/overviewPanels";

/**
 * Admin = Trung tâm điều khiển: bao quát TOÀN hệ thống ở mức oversight —
 * hạ tầng (sites/pin/offline), an toàn (cảnh báo/sự cố/pin nóng nhất),
 * telemetry fleet, và vận hành ticket/SLA ở mức tổng quan.
 *
 * UX: hàng "hero" (xu hướng cảnh báo + SLA) LUÔN hiển thị (chart/gauge có nghĩa
 * kể cả khi = 0). Vùng tile bên dưới REFLOW — panel nào không có dữ liệu thì ẩn
 * hẳn, không để ô trống. KPI 0 vẫn giữ (0 offline / 0 sự cố là thông tin tốt).
 */

const alertChartConfig = {
  critical: { label: "Critical", color: "var(--destructive)" },
  warning: { label: "Warning", color: "var(--p3)" },
  info: { label: "Info", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const ANOMALY_LABEL: Record<number, string> = {
  1: "Quá nhiệt",
  2: "Quá áp",
  3: "Sụt áp",
  4: "SOC thấp",
  5: "Xả nhanh",
  6: "Sạc bất thường",
  7: "Mất kết nối",
  8: "Suy giảm SOH",
  9: "Nhiệt độ cao",
  10: "Độ ẩm cao",
  11: "Nhiệt-ẩm cao",
  12: "Nội trở cao",
  13: "Lệch cell",
  14: "Sự cố MT",
  15: "Sai lệch sensor",
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
  1: { name: "Hoạt động", fill: "var(--ok)" },
  2: { name: "Ngưng", fill: "var(--p3)" },
  3: { name: "Ngừng vận hành", fill: "var(--p1)" },
};

const fmtMetric = (v: number | null | undefined, unit: string, digits = 1) =>
  v === null || v === undefined ? "—" : `${v.toFixed(digits)}${unit}`;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: siteData, isLoading: sitesLoading } = useSiteList({
    pageNumber: 1,
    pageSize: 100,
  });
  const { data: stats, isLoading: statsLoading } = useBatteryDashboardStats();
  const { data: ticketStats, isLoading: ticketsLoading } =
    useTicketDashboardStats();
  const { data: siteStats, isLoading: siteStatsLoading } =
    useSiteDashboardStats();

  // ── Sites ──
  const sites = siteData?.items ?? [];
  const totalSites = siteStats?.total ?? 0;
  const activeSites = siteStats?.activeCount ?? 0;
  const sitesH = sites.map((s) => ({ ...s, health: siteHealth(s) }));
  const avgHealth = sitesH.length
    ? Math.round(sitesH.reduce((a, s) => a + s.health, 0) / sitesH.length)
    : 0;

  // ── Battery + Alert + Incident ──
  const totalBatt = stats?.totalAssets ?? 0;
  const activeBatt = stats?.activeAssets ?? 0;
  const offlineBatt = stats?.offlineAssets ?? 0;
  const openAlerts = stats?.openAlerts ?? 0;
  const criticalOpen = stats?.openAlertsCritical ?? 0;
  const alertSeries = stats?.alertTrend7Days ?? [];
  const anomalyData = (stats?.openAlertsByType ?? [])
    .map((a) => ({
      label: ANOMALY_LABEL[a.anomalyType] ?? `Loại ${a.anomalyType}`,
      value: a.count,
      color: ANOMALY_SEVERITY_COLOR[a.anomalyType] ?? "var(--muted-foreground)",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const anomalyMax = Math.max(1, ...anomalyData.map((d) => d.value));
  const topAlerting = stats?.topAlertingAssets ?? [];
  const telem = stats?.sensorAggregate24Hours;
  const hasTelem = !!telem && telem.readingsCount > 0;

  // ── Tickets ──
  const sla = ticketStats?.sla;
  const totalTickets = ticketStats?.total ?? 0;
  const openTickets = ticketStats?.openCount ?? 0;
  const slaText = sla ? `${sla.compliancePercent}%` : "—";
  const slaPct = sla?.compliancePercent ?? 0;
  const slaColor = !sla
    ? "var(--muted-foreground)"
    : slaPct >= 90
      ? "var(--ok)"
      : slaPct >= 70
        ? "var(--p3)"
        : "var(--p1)";

  // ── Battery status distribution ──
  const battByStatus = (stats?.assetStatusDistribution ?? [])
    .map((b) => ({
      name: BATTERY_STATUS_META[b.status]?.name ?? b.statusName,
      value: b.count,
      fill: BATTERY_STATUS_META[b.status]?.fill ?? "var(--muted-foreground)",
    }))
    .filter((d) => d.value > 0);

  const activeIncidents = stats?.openEnvironmentalIncidents ?? 0;

  // ── Visibility (giữ skeleton lúc load; chỉ ẩn khi đã load & rỗng) ──
  const showAnomaly = statsLoading || anomalyData.length > 0;
  const showBattStatus = statsLoading || battByStatus.length > 0;
  const showTopAlerting = statsLoading || topAlerting.length > 0;
  const showSiteHealth = sitesLoading || sitesH.length > 0;
  const showTelemetry = statsLoading || hasTelem;

  return (
    <div className="flex flex-col gap-3 p-3 lg:p-4 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            Admin · Trung tâm điều khiển hệ thống
          </p>
          <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
            {siteStatsLoading || statsLoading
              ? "Dashboard"
              : `Hạ tầng · ${totalSites} site · ${totalBatt} pin`}
          </h1>
        </div>
        <RefreshButton
          queryKeys={[
            KEY.sites,
            KEY.siteDashboard,
            KEY.batteryDashboard,
            KEY.ticketDashboard,
          ]}
          label="Đồng bộ"
        />
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <DashboardKpi
          label="Sites"
          value={siteStatsLoading ? "--" : totalSites}
          hint={`${activeSites} hoạt động`}
          icon={<MapPin className="size-3.5" />}
        />
        <DashboardKpi
          label="Pin hoạt động"
          value={statsLoading ? "--" : activeBatt}
          sub={`/${totalBatt}`}
          icon={<BatteryCharging className="size-3.5" />}
        />
        <DashboardKpi
          label="Pin offline"
          value={statsLoading ? "--" : offlineBatt}
          hint="mất kết nối"
          icon={<WifiOff className="size-3.5" />}
          accent={offlineBatt > 0 ? "var(--p3)" : undefined}
        />
        <DashboardKpi
          label="Cảnh báo mở"
          value={statsLoading ? "--" : openAlerts}
          hint={`${criticalOpen} critical`}
          icon={<BellRing className="size-3.5" />}
          accent={criticalOpen > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Tickets mở"
          value={ticketsLoading ? "--" : openTickets}
          sub={`/${totalTickets}`}
          hint={`${sla?.breached ?? 0} breach`}
          icon={<Ticket className="size-3.5" />}
          accent={(sla?.breached ?? 0) > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Sự cố môi trường"
          value={statsLoading ? "--" : activeIncidents}
          hint="đang mở"
          icon={<ShieldAlert className="size-3.5" />}
          accent={activeIncidents > 0 ? "var(--p1)" : undefined}
        />
      </div>

      {/* ── Ticket Service Health ── */}
      <TicketHealthCard />

      {/* ── Hero row (luôn hiển thị) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <DashboardPanel
          title={OVERVIEW_PANELS.admin.alerts7d}
          desc="Theo mức độ nghiêm trọng"
          className="lg:col-span-2 min-h-64"
        >
          {statsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer
              config={alertChartConfig}
              className="h-full w-full aspect-auto min-h-0"
            >
              <AreaChart data={alertSeries} margin={{ left: 0, right: 6, top: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) =>
                    `${v.slice(8, 10)}/${v.slice(5, 7)}`
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                />
                <YAxis
                  width={24}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  allowDecimals={false}
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
                <Area
                  dataKey="critical"
                  type="monotone"
                  stackId="a"
                  stroke="var(--color-critical)"
                  fill="url(#alertFill-critical)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="warning"
                  type="monotone"
                  stackId="a"
                  stroke="var(--color-warning)"
                  fill="url(#alertFill-warning)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="info"
                  type="monotone"
                  stackId="a"
                  stroke="var(--color-info)"
                  fill="url(#alertFill-info)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={OVERVIEW_PANELS.admin.slaSystem}
          desc={`${openTickets}/${totalTickets} ticket mở`}
          className="min-h-64"
        >
          {ticketsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <DashboardGauge
              percent={slaPct}
              valueText={slaText}
              caption="SLA met"
              color={slaColor}
              footer={
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-md bg-muted/40 py-1.5">
                    <p
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: "var(--ok)" }}
                    >
                      {sla?.met ?? 0}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground">Met</p>
                  </div>
                  <div className="rounded-md bg-muted/40 py-1.5">
                    <p className="text-sm font-semibold tabular-nums">
                      {sla?.running ?? 0}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground">Running</p>
                  </div>
                  <div className="rounded-md bg-muted/40 py-1.5">
                    <p
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: "var(--p1)" }}
                    >
                      {sla?.breached ?? 0}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground">Breach</p>
                  </div>
                </div>
              }
            />
          )}
        </DashboardPanel>
      </div>

      {/* ── Vùng tile REFLOW (ẩn panel rỗng) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {showAnomaly && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.alertsByType}
            desc="Top loại · màu theo mức độ"
            className="min-h-56"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ul className="flex flex-col h-full justify-center gap-3">
                {anomalyData.map((d, i) => {
                  const pct = Math.round((d.value / anomalyMax) * 100);
                  return (
                    <li key={d.label} className="flex items-center gap-2.5">
                      <span className="w-3.5 shrink-0 text-right text-[10px] font-semibold font-mono-num text-muted-foreground/60">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ background: d.color }}
                            />
                            <span className="text-xs font-medium truncate">
                              {d.label}
                            </span>
                          </span>
                          <span className="text-[11px] font-semibold tabular-nums text-muted-foreground shrink-0">
                            {d.value}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: d.color }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardPanel>
        )}

        {showBattStatus && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.batteryByStatus}
            desc={`${totalBatt} pin`}
            className="min-h-56"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DashboardDonut
                data={battByStatus}
                centerValue={totalBatt}
                centerLabel="pin"
              />
            )}
          </DashboardPanel>
        )}

        {showTopAlerting && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.topAlerting}
            desc="Nhiều cảnh báo mở nhất"
            className="min-h-56"
            bodyClassName="overflow-y-auto"
          >
            {statsLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <ol className="space-y-1">
                {topAlerting.map((a, i) => (
                  <li key={a.batteryAssetId}>
                    <button
                      className="flex items-center gap-2.5 w-full text-left rounded-md px-1.5 py-1.5 group hover:bg-muted/40 transition-colors"
                      onClick={() =>
                        navigate(`/admin/battery-assets/${a.batteryAssetId}`)
                      }
                    >
                      <span className="w-3.5 shrink-0 text-right text-[10px] font-semibold font-mono-num text-muted-foreground/60">
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {a.serialNumber}
                      </span>
                      {a.criticalCount > 0 && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold shrink-0"
                          style={{
                            background: "var(--p1-soft)",
                            color: "var(--p1)",
                          }}
                        >
                          {a.criticalCount} critical
                        </span>
                      )}
                      <span className="text-[11px] font-semibold font-mono-num tabular-nums w-5 text-right shrink-0">
                        {a.alertCount}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </DashboardPanel>
        )}

        {showSiteHealth && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.siteHealth}
            desc={`Trung bình ${avgHealth}%`}
            className="min-h-56"
            bodyClassName="overflow-y-auto"
          >
            {sitesLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {sitesH.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.name}</p>
                      <p className="text-[10.5px] text-muted-foreground tabular-nums">
                        {s.activeBatteryAssetCount}/{s.batteryAssetCount} pin
                      </p>
                    </div>
                    <div className="w-16 h-1.5 rounded-full bg-border shrink-0">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.health}%`,
                          background: healthColor(s.health),
                        }}
                      />
                    </div>
                    <span
                      className="text-[11px] font-semibold font-mono-num w-7 text-right shrink-0"
                      style={{ color: healthColor(s.health) }}
                    >
                      {s.health}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DashboardPanel>
        )}

        {showTelemetry && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.telemetry24h}
            desc={
              telem?.readingsCount
                ? `${telem.readingsCount.toLocaleString("vi-VN")} lượt đọc`
                : "Trung bình toàn fleet"
            }
            className="min-h-56"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-2 h-full content-center">
                {[
                  { label: "Điện áp", value: fmtMetric(telem!.avgVoltage, "V", 2) },
                  { label: "Dòng", value: fmtMetric(telem!.avgCurrent, "A", 2) },
                  { label: "Nhiệt độ", value: fmtMetric(telem!.avgTemperature, "°C") },
                  { label: "SOC", value: fmtMetric(telem!.avgSoc, "%") },
                  { label: "SOH", value: fmtMetric(telem!.avgSoh, "%") },
                ].map((m) => (
                  <div key={m.label} className="rounded-md bg-muted/40 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {m.label}
                    </p>
                    <p className="text-base font-semibold tabular-nums leading-tight mt-0.5">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DashboardPanel>
        )}
      </div>

      {/* ── Phân bố pin (component tự ẩn khi rỗng) ── */}
      <BatteryDistributionPanels stats={stats} isLoading={statsLoading} />
    </div>
  );
}
