import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useSiteList } from "@/features/admin/hooks/useSites";
import { SiteStatusEnum } from "@/shared/types/site.types";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendDir } from "@/shared/enums/common.enum";

// ── KPI Card ────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { dir: TrendDir; value: string; note: string };
  accent?: string;
}
function KpiCard({ label, value, sub, trend, accent }: KpiProps) {
  const trendColor =
    trend?.dir === TrendDir.Up
      ? "var(--ok)"
      : trend?.dir === TrendDir.Down
        ? "var(--p1)"
        : "var(--muted-foreground)";
  return (
    <div
      className="bg-card rounded-lg border border-border p-4 flex flex-col gap-1.5"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase text-muted-foreground">
          {label}
        </span>
        {accent && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: accent }}
          />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {sub && (
          <span className="text-xs text-muted-foreground font-mono-num">
            {sub}
          </span>
        )}
      </div>
      {trend && (
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: trendColor }}
        >
          {trend.dir === TrendDir.Up ? (
            <TrendingUp size={11} />
          ) : trend.dir === TrendDir.Down ? (
            <TrendingDown size={11} />
          ) : null}
          <span className="font-mono-num font-medium">{trend.value}</span>
          <span className="text-muted-foreground">· {trend.note}</span>
        </div>
      )}
    </div>
  );
}

// ── Card shell ───────────────────────────────────────────────────────────────
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card rounded-lg border border-border ${className}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {children}
    </div>
  );
}

// ── Alert bar chart ─────────────────────────────────────────────────────────
const alertChartConfig = {
  critical: { label: "Critical", color: "var(--destructive)" },
  warning: { label: "Warning", color: "var(--p3)" },
  info: { label: "Info", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const ALERT_DATA = [
  { week: "T17", critical: 12, warning: 24, info: 18 },
  { week: "T18", critical: 8, warning: 21, info: 22 },
  { week: "T19", critical: 15, warning: 19, info: 16 },
  { week: "T20", critical: 6, warning: 14, info: 19 },
  { week: "T21", critical: 9, warning: 17, info: 21 },
];

function AlertsChart() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Cảnh báo theo tuần</h3>
          <p className="text-xs text-muted-foreground">
            Phân bổ theo mức độ nghiêm trọng
          </p>
        </div>
      </div>
      <ChartContainer
        config={alertChartConfig}
        className="h-[240px] w-full aspect-auto"
        initialDimension={{ width: 640, height: 240 }}
      >
        <BarChart accessibilityLayer data={ALERT_DATA} barGap={3} barSize={18}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis width={28} tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="critical"
            fill="var(--color-critical)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="warning"
            fill="var(--color-warning)"
            radius={[4, 4, 0, 0]}
          />
          <Bar dataKey="info" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

// ── Health color helper ──────────────────────────────────────────────────────
const hc = (h: number) =>
  h >= 80 ? "var(--ok)" : h >= 60 ? "var(--p3)" : "var(--p1)";

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSiteList({ pageNumber: 1, pageSize: 100 });

  const sites = data?.items ?? [];
  const totalSites = data?.totalItems ?? 0;
  const activeSites = sites.filter(
    (s) => s.status === SiteStatusEnum.Active,
  ).length;
  const totalBatt = sites.reduce((s, x) => s + x.batteryAssetCount, 0);
  const activeBatt = sites.reduce((s, x) => s + x.activeBatteryAssetCount, 0);

  const sitesH = sites.map((s) => ({
    ...s,
    health:
      s.batteryAssetCount > 0
        ? Math.round((s.activeBatteryAssetCount / s.batteryAssetCount) * 100)
        : 100,
  }));

  return (
    <div className="p-6 space-y-5 max-w-[1440px] mx-auto">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Admin · Tổng quan hệ thống
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {isLoading ? "Dashboard" : `Solar System · ${totalSites} site`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan hạ tầng pin, người dùng và sức khỏe vận hành.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <RefreshButton queryKeys={[KEY.sites]} label="Đồng bộ" />
          <button
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => navigate("/admin/battery-assets")}
          >
            <Plus size={14} /> Tạo asset
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-lg border border-border p-4 space-y-3"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Total Sites"
            value={totalSites}
            sub="sites"
            trend={{
              dir: TrendDir.Up,
              value: `${activeSites}`,
              note: "đang hoạt động",
            }}
          />
          <KpiCard
            label="Active Batteries"
            value={activeBatt}
            sub={`/${totalBatt}`}
            trend={{
              dir: TrendDir.Up,
              value: `+${activeBatt}`,
              note: "online",
            }}
            accent="var(--ok)"
          />
          <KpiCard
            label="Cần theo dõi"
            value={totalBatt - activeBatt}
            sub="pin"
            trend={{
              dir: totalBatt - activeBatt > 0 ? TrendDir.Down : TrendDir.Flat,
              value: `${totalBatt - activeBatt}`,
              note: "inactive",
            }}
            accent={totalBatt - activeBatt > 0 ? "var(--p1)" : undefined}
          />
          <KpiCard
            label="SLA Compliance"
            value="96.4%"
            sub="30 ngày"
            trend={{ dir: TrendDir.Up, value: "+1.2pp", note: "tháng trước" }}
            accent="var(--ok)"
          />
        </div>
      )}

      {/* ── Row 2: Alerts chart | Site health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Card className="lg:col-span-3 p-4">
          <AlertsChart />
        </Card>
        <Card className="lg:col-span-2 p-4">
          <h3 className="text-sm font-semibold mb-3">Sức khỏe site</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : sitesH.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có site nào.</p>
          ) : (
            <div className="space-y-3">
              {sitesH.map((s) => (
                <button
                  key={s.id}
                  className="flex items-center gap-3 w-full text-left group"
                  onClick={() => navigate(`/admin/sites/${s.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium truncate group-hover:text-primary transition-colors">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.batteryAssetCount} pin
                    </p>
                  </div>
                  <div className="w-24 h-1.5 rounded-full bg-border shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.health}%`,
                        background: hc(s.health),
                      }}
                    />
                  </div>
                  <span
                    className="text-[11.5px] font-semibold font-mono-num w-8 text-right shrink-0"
                    style={{ color: hc(s.health) }}
                  >
                    {s.health}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 3: Recent activity ── */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Hoạt động gần đây</h3>
        <ol className="grid gap-3 lg:grid-cols-2">
          {[
            {
              action: "BATTERY.ASSIGN",
              target: "SN-B0042",
              actor: "Phan Quốc Hùng",
              note: "Gán pin cho site ST-003",
              ok: true,
              dt: "21/05 · 14:32",
            },
            {
              action: "SITE.UPDATE",
              target: "ST-001",
              actor: "Phan Quốc Hùng",
              note: "Cập nhật capacity → 450 kW",
              ok: true,
              dt: "21/05 · 11:10",
            },
            {
              action: "THRESHOLD.SET",
              target: "BT-LFP-01",
              actor: "Admin",
              note: "Nhiệt độ max 47°C",
              ok: true,
              dt: "20/05 · 09:48",
            },
            {
              action: "USER.CREATE",
              target: "U-412",
              actor: "Admin",
              note: "Mời Staff mới — Nguyễn Văn B",
              ok: true,
              dt: "19/05 · 16:00",
            },
          ].map((item, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-md border border-border/70 bg-muted/20 p-3"
            >
              <span
                className="mt-0.75 w-2 h-2 rounded-full shrink-0"
                style={{ background: item.ok ? "var(--ok)" : "var(--p1)" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">
                    <span className="font-mono-num text-[11px] text-muted-foreground">
                      {item.action}
                    </span>
                    {" · "}
                    <span className="font-medium">{item.target}</span>
                  </span>
                  <span className="font-mono-num text-[11px] text-muted-foreground shrink-0">
                    {item.dt}
                  </span>
                </div>
                <p className="text-[12.5px] text-muted-foreground">
                  {item.note}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  {item.actor}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
