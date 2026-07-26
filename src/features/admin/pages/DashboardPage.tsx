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
 * Admin = HẠ TẦNG & SỨC KHỎE HỆ THỐNG: sites, pin, kết nối, cảnh báo, sự cố
 * môi trường, sức khỏe service.
 *
 * KHÔNG hiển thị SLA / pipeline ticket — đó là bề mặt điều phối của Manager.
 * Admin cần biết "hệ thống có khỏe không", không phải "ticket chạy tới đâu".
 *
 * Layout: 1 KHUNG CỐ ĐỊNH, trang không cuộn (`overflow-hidden`). Chiều cao còn
 * lại chia đúng 2 hàng panel bằng `grid-rows-2` + `flex-1 min-h-0`; panel nào
 * là danh sách thì tự cuộn BÊN TRONG, không đẩy trang dài ra.
 *
 * Mỗi panel một dạng biểu đồ khác nhau (area / gauge / bar ngang / donut /
 * bảng xếp hạng) để phân biệt được loại thông tin ngay từ hình dạng.
 */

const alertChartConfig = {
  critical: { label: "Critical", color: "var(--destructive)" },
  warning: { label: "Warning", color: "var(--p3)" },
  info: { label: "Info", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const anomalyChartConfig = { value: { label: "Cảnh báo" } } satisfies ChartConfig;

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

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useBatteryDashboardStats();
  const { data: siteStats, isLoading: siteStatsLoading } =
    useSiteDashboardStats();

  // ── Hạ tầng ──
  const totalSites = siteStats?.total ?? 0;
  const activeSites = siteStats?.activeCount ?? 0;
  const totalBatt = stats?.totalAssets ?? 0;
  const activeBatt = stats?.activeAssets ?? 0;
  const offlineBatt = stats?.offlineAssets ?? 0;
  const openAlerts = stats?.openAlerts ?? 0;
  const criticalOpen = stats?.openAlertsCritical ?? 0;
  const activeIncidents = stats?.openEnvironmentalIncidents ?? 0;

  // ── Tỉ lệ pin còn kết nối — chỉ số "hệ thống có đang thấy được thiết bị không" ──
  const onlineBatt = Math.max(0, totalBatt - offlineBatt);
  const onlinePct = totalBatt > 0 ? Math.round((onlineBatt / totalBatt) * 100) : 0;
  const onlineColor =
    totalBatt === 0
      ? "var(--muted-foreground)"
      : onlinePct >= 90
        ? "var(--ok)"
        : onlinePct >= 70
          ? "var(--p3)"
          : "var(--p1)";

  const alertSeries = stats?.alertTrend7Days ?? [];

  // Bar ngang: cắt top 6 và đảo thứ tự để loại nhiều nhất nằm TRÊN CÙNG
  // (Recharts vẽ category đầu tiên ở dưới với layout vertical).
  const anomalyData = (stats?.openAlertsByType ?? [])
    .map((a) => ({
      label: ANOMALY_LABEL[a.anomalyType] ?? `Loại ${a.anomalyType}`,
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

  // ── Visibility: panel rỗng ẩn hẳn, không để ô trống trong khung cố định ──
  const showAnomaly = statsLoading || anomalyData.length > 0;
  const showBattStatus = statsLoading || battByStatus.length > 0;
  const showTopAlerting = statsLoading || topAlerting.length > 0;

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 p-3 lg:p-4 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            Admin · Hạ tầng & sức khỏe hệ thống
          </p>
          <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
            {siteStatsLoading || statsLoading
              ? "Dashboard"
              : `${totalSites} site · ${totalBatt} pin · ${openAlerts} cảnh báo mở`}
          </h1>
        </div>
        <RefreshButton
          queryKeys={[KEY.siteDashboard, KEY.batteryDashboard]}
          label="Đồng bộ"
        />
      </div>

      {/* ── KPI strip — bấm được, nhảy thẳng tới trang tương ứng ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
        <DashboardKpi
          label="Sites"
          value={siteStatsLoading ? "--" : totalSites}
          hint={`${activeSites} hoạt động`}
          icon={<MapPin className="size-3.5" />}
          to="/admin/sites"
        />
        <DashboardKpi
          label="Pin hoạt động"
          value={statsLoading ? "--" : activeBatt}
          sub={`/${totalBatt}`}
          icon={<BatteryCharging className="size-3.5" />}
          to="/admin/battery-assets"
        />
        <DashboardKpi
          label="Pin offline"
          value={statsLoading ? "--" : offlineBatt}
          hint="mất kết nối"
          icon={<WifiOff className="size-3.5" />}
          accent={offlineBatt > 0 ? "var(--p3)" : undefined}
          to="/admin/iot-devices"
        />
        <DashboardKpi
          label="Cảnh báo mở"
          value={statsLoading ? "--" : openAlerts}
          hint={`${criticalOpen} critical`}
          icon={<BellRing className="size-3.5" />}
          accent={criticalOpen > 0 ? "var(--p1)" : undefined}
          to="/admin/alerts"
        />
        <DashboardKpi
          label="Sự cố môi trường"
          value={statsLoading ? "--" : activeIncidents}
          hint="đang mở"
          icon={<ShieldAlert className="size-3.5" />}
          accent={activeIncidents > 0 ? "var(--p1)" : undefined}
          to="/admin/environmental-incidents"
        />
      </div>

      {/* ── Sức khỏe service (dải mỏng) ── */}
      <div className="shrink-0">
        <TicketHealthCard />
      </div>

      {/* ── Bento cố định: 2 hàng chia đều chiều cao còn lại, KHÔNG cuộn trang ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-3 overflow-hidden">
        {/* [Area] xu hướng theo thời gian */}
        <DashboardPanel
          title={OVERVIEW_PANELS.admin.alerts7d}
          desc="Theo mức độ nghiêm trọng"
          className="lg:col-span-2 min-h-0"
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
                  tickFormatter={(v: string) => `${v.slice(8, 10)}/${v.slice(5, 7)}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                />
                {/* width 24 cắt mất số từ 3 chữ số (đếm cảnh báo lên hàng trăm). */}
                <YAxis
                  width={38}
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

        {/* [Gauge] một tỉ lệ duy nhất */}
        <DashboardPanel
          title="Pin còn kết nối"
          desc={`${onlineBatt}/${totalBatt} thiết bị gửi dữ liệu`}
          className="min-h-0"
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
                <div className="grid grid-cols-2 gap-1.5 text-center">
                  <div className="rounded-md bg-muted/40 py-1.5">
                    <p
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: "var(--ok)" }}
                    >
                      {onlineBatt}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground">Online</p>
                  </div>
                  <div className="rounded-md bg-muted/40 py-1.5">
                    <p
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: offlineBatt > 0 ? "var(--p3)" : undefined }}
                    >
                      {offlineBatt}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground">Offline</p>
                  </div>
                </div>
              }
            />
          )}
        </DashboardPanel>

        {/* [Bar ngang] so sánh hạng mục */}
        {showAnomaly && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.alertsByType}
            desc="Top loại · màu theo mức độ"
            className="min-h-0"
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
                    width={92}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10.5 }}
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

        {/* [Donut] cơ cấu thành phần */}
        {showBattStatus && (
          <DashboardPanel
            title={OVERVIEW_PANELS.admin.batteryByStatus}
            desc={`${totalBatt} pin`}
            className="min-h-0"
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

        {/* [Bảng xếp hạng] danh sách hành động được */}
        {showTopAlerting && (
          <TopAlertingPanel
            title={OVERVIEW_PANELS.admin.topAlerting}
            assets={topAlerting}
            isLoading={statsLoading}
            onSelect={(a) => navigate(`/admin/battery-assets/${a.batteryAssetId}`)}
            className="min-h-0"
          />
        )}
      </div>
    </div>
  );
}
