import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { KpiCard } from "@/shared/components/common/KpiCard";
import { useSiteList } from "@/features/manager/hooks/useSites";
import { SiteStatusEnum } from "@/shared/types/site.types";
import { TrendDir } from "@/shared/enums/common.enum";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
  Label,
} from "recharts";
import {
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Battery,
  MapPin,
  ShieldCheck,
  Timer,
} from "lucide-react";

const hc = (h: number) =>
  h >= 80 ? "var(--ok)" : h >= 60 ? "var(--p3)" : "var(--p1)";

const statusVariant = (status: number) => {
  if (status === SiteStatusEnum.Active) return "default" as const;
  if (status === SiteStatusEnum.UnderMaintenance) return "secondary" as const;
  return "destructive" as const;
};

const statusLabel = (status: number) => {
  if (status === SiteStatusEnum.Active) return "Hoạt động";
  if (status === SiteStatusEnum.UnderMaintenance) return "Bảo trì";
  return "Ngừng";
};

const weeklyChartConfig = {
  volume: { label: "Hoạt động", color: "var(--chart-1)" },
} satisfies ChartConfig;

const pieChartConfig = {
  active: { label: "Hoạt động", color: "var(--ok)" },
  maintenance: { label: "Bảo trì", color: "var(--p3)" },
  decommissioned: { label: "Ngừng", color: "var(--p1)" },
} satisfies ChartConfig;

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSiteList({ pageNumber: 1, pageSize: 100 });

  const sites = data?.items ?? [];
  const totalSites = data?.totalItems ?? 0;
  const activeSites = sites.filter(
    (s) => s.status === SiteStatusEnum.Active,
  ).length;
  const maintSites = sites.filter(
    (s) => s.status === SiteStatusEnum.UnderMaintenance,
  ).length;
  const decommSites = sites.filter(
    (s) => s.status === SiteStatusEnum.Decommissioned,
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
  const atRisk = sitesH.filter((s) => s.health < 80);

  const weeklyData = [
    { day: "T2", volume: 14 },
    { day: "T3", volume: 18 },
    { day: "T4", volume: 11 },
    { day: "T5", volume: 22 },
    { day: "T6", volume: 19 },
    { day: "T7", volume: 25 },
    { day: "CN", volume: 21 },
  ];

  const pieData = [
    { name: "active", value: activeSites, fill: "var(--ok)" },
    { name: "maintenance", value: maintSites, fill: "var(--p3)" },
    { name: "decommissioned", value: decommSites, fill: "var(--p1)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Tổng quan
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Điều phối vận hành
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm">
            <RefreshCw className="size-3.5" /> Đồng bộ
          </Button>
          <Button variant="outline" size="sm">
            <Download className="size-3.5" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* ── KPI row ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-2 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-14" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Sites theo dõi"
            value={totalSites}
            icon={<MapPin className="size-4" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            trend={{
              dir: TrendDir.Flat,
              value: `${activeSites}`,
              note: "hoạt động",
            }}
          />
          <KpiCard
            label="Đang bảo trì"
            value={maintSites}
            icon={<AlertCircle className="size-4" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            trend={{
              dir: maintSites > 0 ? TrendDir.Down : TrendDir.Flat,
              value: `${maintSites}`,
              note: "sites",
            }}
          />
          <KpiCard
            label="SLA Compliance"
            value="96.4%"
            sub="30 ngày"
            icon={<ShieldCheck className="size-4" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            trend={{ dir: TrendDir.Up, value: "+1.2pp", note: "tháng trước" }}
          />
          <KpiCard
            label="Avg Resolution"
            value="16.4h"
            sub="trung bình"
            icon={<Timer className="size-4" />}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            trend={{ dir: TrendDir.Down, value: "−2.1h", note: "tuần trước" }}
          />
        </div>
      )}

      {/* ── Row 2: Pie chart | Battery summary ── */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Sites theo trạng thái</CardTitle>
              <CardDescription>Phân bổ {totalSites} sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <ChartContainer
                  config={pieChartConfig}
                  className="h-[160px] w-[160px] shrink-0"
                >
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={75}
                      strokeWidth={2}
                      stroke="var(--background)"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="text-2xl font-bold fill-foreground"
                                >
                                  {totalSites}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy ?? 0) + 18}
                                  className="text-xs fill-muted-foreground"
                                >
                                  sites
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-3">
                  {[
                    {
                      label: "Hoạt động",
                      value: activeSites,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Bảo trì",
                      value: maintSites,
                      color: "bg-amber-500",
                    },
                    { label: "Ngừng", value: decommSites, color: "bg-red-500" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${s.color}`} />
                        <span className="text-sm text-muted-foreground">
                          {s.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng hợp pin</CardTitle>
              <CardDescription>Trạng thái hoạt động</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    icon: <CheckCircle className="size-4" />,
                    label: "Pin hoạt động",
                    value: activeBatt,
                    total: totalBatt,
                    color: "text-emerald-600",
                    bg: "bg-emerald-500",
                  },
                  {
                    icon: <AlertCircle className="size-4" />,
                    label: "Pin không active",
                    value: totalBatt - activeBatt,
                    total: totalBatt,
                    color: "text-red-600",
                    bg: "bg-red-500",
                  },
                  {
                    icon: <Clock className="size-4" />,
                    label: "Sites bảo trì",
                    value: maintSites,
                    total: totalSites,
                    color: "text-amber-600",
                    bg: "bg-amber-500",
                  },
                ].map((item) => {
                  const pct =
                    item.total > 0
                      ? Math.round((item.value / item.total) * 100)
                      : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={item.color}>{item.icon}</span>
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {item.value}
                          </span>
                          /{item.total}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.bg} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Row 3: At-risk table | Weekly chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 gap-0 py-0 overflow-hidden">
          <CardHeader className="border-b border-border py-4">
            <CardTitle>Sites cần chú ý</CardTitle>
            <CardDescription>
              Sức khỏe &lt; 80% · {atRisk.length} site
            </CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">STT</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Pin</TableHead>
                <TableHead>Sức khỏe</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {atRisk.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="size-8 text-emerald-500" />
                      <p className="text-sm text-muted-foreground">
                        Tất cả sites đang khỏe mạnh
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                atRisk.slice(0, 6).map((s, index) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/manager/sites/${s.id}`)}
                  >
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.customerName}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {s.activeBatteryAssetCount}/{s.batteryAssetCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${s.health}%`,
                              background: hc(s.health),
                            }}
                          />
                        </div>
                        <span
                          className="tabular-nums font-semibold text-xs"
                          style={{ color: hc(s.health) }}
                        >
                          {s.health}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/manager/sites/${s.id}`);
                        }}
                      >
                        Xem <ArrowRight className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động 7 ngày</CardTitle>
              <CardDescription>Số lượng thao tác theo ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={weeklyChartConfig}
                className="h-[140px] w-full"
              >
                <AreaChart data={weeklyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-volume)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-volume)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="volume"
                    type="monotone"
                    fill="url(#fillVolume)"
                    stroke="var(--color-volume)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLA · 30 ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                96.4
                <span className="text-lg font-normal text-muted-foreground">
                  %
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Avg resolution
                  </p>
                  <p className="font-semibold tabular-nums mt-0.5">14h 32m</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">CSAT</p>
                  <p className="font-semibold tabular-nums mt-0.5">4.71 / 5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Row 4: Sites grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Tất cả sites</h2>
            <p className="text-xs text-muted-foreground">
              {totalSites} sites đang quản lý
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/manager/sites")}
          >
            Xem tất cả <ArrowRight className="size-3.5" />
          </Button>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-full mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="size-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có site nào.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sitesH.slice(0, 9).map((site) => (
              <Card
                key={site.id}
                className="cursor-pointer transition-all hover:shadow-md hover:ring-primary/20"
                onClick={() => navigate(`/manager/sites/${site.id}`)}
              >
                <CardContent>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {site.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {site.customerName}
                      </p>
                    </div>
                    <Badge variant={statusVariant(site.status)}>
                      {statusLabel(site.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Battery className="size-3" />
                    <span className="tabular-nums">
                      {site.activeBatteryAssetCount}/{site.batteryAssetCount}{" "}
                      pin
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sức khỏe</span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: hc(site.health) }}
                      >
                        {site.health}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${site.health}%`,
                          background: hc(site.health),
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
