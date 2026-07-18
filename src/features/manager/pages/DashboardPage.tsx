import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
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
import { useSiteList } from "@/features/manager/hooks/useSites";
import { useAdminTicketQueue } from "@/features/manager/hooks/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/useStaffAssignmentList";
import { useBatteryDashboardStats } from "@/shared/hooks/useBatteryDashboard";
import { useTicketDashboardStats } from "@/shared/hooks/useDashboardStats";
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
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import {
  Ticket,
  Inbox,
  ShieldCheck,
  AlertTriangle,
  WifiOff,
  BellRing,
  ArrowRight,
} from "lucide-react";
import { siteHealth, healthColor } from "@/shared/utils/site.utils";
import { OVERVIEW_PANELS } from "@/shared/utils/overviewPanels";

/**
 * Manager = Điều phối vận hành ticket: pipeline, SLA, phân bố ưu tiên, tải nhân sự,
 * hàng chờ triage, site & pin cần chú ý.
 *
 * UX: hàng hero (pipeline + SLA) luôn hiển thị. Vùng tile bên dưới REFLOW — panel
 * nào không có dữ liệu (không staff / hết triage / không site rủi ro / không pin
 * cảnh báo) thì ẩn hẳn, không để ô trống.
 */

const pipelineConfig = { value: { label: "Ticket" } } satisfies ChartConfig;
const areaConfig = {
  count: { label: "Ticket mới", color: "var(--chart-1)" },
} satisfies ChartConfig;

const loadColor = (active: number, max: number) => {
  const ratio = max > 0 ? active / max : active > 0 ? 1 : 0;
  if (ratio >= 1) return "var(--p1)";
  if (ratio >= 0.7) return "var(--p3)";
  return "var(--ok)";
};

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data: siteData, isLoading: sitesLoading } = useSiteList({
    pageNumber: 1,
    pageSize: 100,
  });
  const { data: ticketStats, isLoading: ticketsLoading } =
    useTicketDashboardStats();
  const { data: queuePage, isLoading: queueLoading } = useAdminTicketQueue({
    pageNumber: 1,
    pageSize: 50,
  });
  const { data: staffList, isLoading: staffLoading } = useStaffAssignmentList();
  const { data: stats, isLoading: statsLoading } = useBatteryDashboardStats();

  // ── Sites at-risk ──
  const sites = siteData?.items ?? [];
  const sitesH = sites.map((s) => ({ ...s, health: siteHealth(s) }));
  const atRisk = sitesH.filter((s) => s.health < 80);

  // ── Tickets ──
  const sla = ticketStats?.sla;
  const totalTickets = ticketStats?.total ?? 0;
  const openCount = ticketStats?.openCount ?? 0;
  const queueCount = queuePage?.totalItems ?? 0;
  const queueItems = queuePage?.items ?? [];
  const slaText = sla ? `${sla.compliancePercent}%` : "—";
  const slaPct = sla?.compliancePercent ?? 0;
  const slaColor = !sla
    ? "var(--muted-foreground)"
    : slaPct >= 90
      ? "var(--ok)"
      : slaPct >= 70
        ? "var(--p3)"
        : "var(--p1)";
  const ticketTrend = ticketStats?.createdTrend7Days ?? [];
  const hasTrend = ticketTrend.some((p) => p.count > 0);
  const statusCounts = ticketStats?.countByStatus ?? {};

  const pipeline = [
    {
      stage: "Mới/Mở",
      value: (statusCounts.New ?? 0) + (statusCounts.Open ?? 0),
      fill: "var(--muted-foreground)",
    },
    { stage: "Đã gán", value: statusCounts.Assigned ?? 0, fill: "var(--chart-1)" },
    {
      stage: "Đang xử lý",
      value: statusCounts.InProgress ?? 0,
      fill: "var(--chart-1)",
    },
    {
      stage: "Đang chờ",
      value:
        (statusCounts.WaitingCustomer ?? 0) +
        (statusCounts.WaitingParts ?? 0) +
        (statusCounts.WaitingOnsiteSchedule ?? 0),
      fill: "var(--p3)",
    },
    {
      stage: "Nâng cấp",
      value: (statusCounts.Escalated ?? 0) + (statusCounts.Incident ?? 0),
      fill: "var(--p1)",
    },
    {
      stage: "Hoàn tất",
      value:
        (statusCounts.Resolved ?? 0) +
        (statusCounts.Approved ?? 0) +
        (statusCounts.ClosedPendingRate ?? 0) +
        (statusCounts.Closed ?? 0),
      fill: "var(--ok)",
    },
  ];
  const pipelineTotal = pipeline.reduce((a, p) => a + p.value, 0);

  // ── Phân bố ưu tiên — countByPriority ──
  const priorityCounts = ticketStats?.countByPriority ?? {};
  const priorityData = [
    { name: "P1 · Khẩn", value: priorityCounts.P1Critical ?? 0, fill: "var(--p1)" },
    { name: "P2 · Cao", value: priorityCounts.P2High ?? 0, fill: "var(--p2)" },
    { name: "P3 · Thường", value: priorityCounts.P3Normal ?? 0, fill: "var(--p3)" },
  ].filter((d) => d.value > 0);
  const priorityTotal = priorityData.reduce((a, d) => a + d.value, 0);

  // ── Staff workload ──
  const staff = staffList ?? [];
  const openByStaff = new Map(
    (ticketStats?.openCountByStaff ?? []).map((o) => [o.staffId, o.activeCount]),
  );
  const workload = staff
    .map((s) => ({
      id: s.accountId,
      name: s.fullName,
      available: s.isAvailable,
      active: openByStaff.get(s.accountId) ?? 0,
      max: s.maxConcurrentTickets || 0,
    }))
    .sort((a, b) => b.active - a.active);

  // ── Alerts + pin ──
  const openAlerts = stats?.openAlerts ?? 0;
  const criticalOpen = stats?.openAlertsCritical ?? 0;
  const offlineBatt = stats?.offlineAssets ?? 0;
  const topAlerting = stats?.topAlertingAssets ?? [];

  // ── Visibility ──
  const showPriority = ticketsLoading || priorityData.length > 0;
  const showWorkload = staffLoading || workload.length > 0;
  const showTriage = queueLoading || queueItems.length > 0;
  const showAtRisk = sitesLoading || atRisk.length > 0;
  const showTopAlerting = statsLoading || topAlerting.length > 0;
  const showTrend = ticketsLoading || hasTrend;

  return (
    <div className="flex flex-col gap-3 p-3 lg:p-4 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            Manager · Điều phối vận hành
          </p>
          <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
            Vận hành ticket & SLA
          </h1>
        </div>
        <RefreshButton
          queryKeys={[
            KEY.sites,
            KEY.ticketDashboard,
            KEY.manager.tickets,
            KEY.batteryDashboard,
          ]}
          label="Đồng bộ"
        />
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <DashboardKpi
          label="Tickets mở"
          value={ticketsLoading ? "--" : openCount}
          sub={`/${totalTickets}`}
          icon={<Ticket className="size-3.5" />}
        />
        <DashboardKpi
          label="Cần triage"
          value={queueLoading ? "--" : queueCount}
          sub="hàng chờ"
          icon={<Inbox className="size-3.5" />}
          accent={queueCount > 0 ? "var(--p3)" : undefined}
        />
        <DashboardKpi
          label="Quá hạn SLA"
          value={ticketsLoading ? "--" : (sla?.breached ?? 0)}
          sub="breach"
          icon={<AlertTriangle className="size-3.5" />}
          accent={(sla?.breached ?? 0) > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="SLA"
          value={ticketsLoading ? "--" : slaText}
          hint={`${sla?.met ?? 0} met`}
          icon={<ShieldCheck className="size-3.5" />}
          accent={(sla?.breached ?? 0) > 0 ? "var(--p1)" : "var(--ok)"}
        />
        <DashboardKpi
          label="Cảnh báo mở"
          value={statsLoading ? "--" : openAlerts}
          hint={`${criticalOpen} critical`}
          icon={<BellRing className="size-3.5" />}
          accent={criticalOpen > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Pin offline"
          value={statsLoading ? "--" : offlineBatt}
          hint="mất kết nối"
          icon={<WifiOff className="size-3.5" />}
          accent={offlineBatt > 0 ? "var(--p3)" : undefined}
        />
      </div>

      {/* ── Hero row (luôn hiển thị) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <DashboardPanel
          title={OVERVIEW_PANELS.manager.ticketPipeline}
          desc={`${pipelineTotal} ticket theo giai đoạn`}
          className="lg:col-span-2 min-h-64"
        >
          {ticketsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : totalTickets === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              Chưa có ticket.
            </div>
          ) : (
            <ChartContainer
              config={pipelineConfig}
              className="h-full w-full aspect-auto min-h-0"
            >
              <BarChart
                accessibilityLayer
                data={pipeline}
                layout="vertical"
                margin={{ left: 4, right: 12 }}
              >
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={72}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10.5 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" radius={4} maxBarSize={20}>
                  {pipeline.map((p) => (
                    <Cell key={p.stage} fill={p.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={OVERVIEW_PANELS.manager.sla}
          desc="met / (met + breach)"
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
        {showPriority && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.priority}
            desc={`${priorityTotal} ticket phân theo mức`}
            className="min-h-56"
          >
            {ticketsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DashboardDonut
                data={priorityData}
                centerValue={priorityTotal}
                centerLabel="ticket"
              />
            )}
          </DashboardPanel>
        )}

        {showWorkload && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.staffLoad}
            desc={`${workload.length} staff · đang xử lý / tối đa`}
            className="min-h-56"
            bodyClassName="overflow-y-auto"
          >
            {staffLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {workload.map((w) => {
                  const pct =
                    w.max > 0
                      ? Math.min(100, (w.active / w.max) * 100)
                      : w.active > 0
                        ? 100
                        : 0;
                  return (
                    <div key={w.id} className="flex items-center gap-2.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background: w.available
                            ? "var(--ok)"
                            : "var(--muted-foreground)",
                        }}
                        title={w.available ? "Sẵn sàng" : "Bận"}
                      />
                      <span className="text-xs font-medium truncate flex-1 min-w-0">
                        {w.name}
                      </span>
                      <div className="w-24 h-1.5 rounded-full bg-border shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: loadColor(w.active, w.max),
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold font-mono-num w-9 text-right shrink-0">
                        {w.active}/{w.max || "–"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardPanel>
        )}

        {showTriage && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.triageQueue}
            desc={`${queueCount} ticket chờ phân loại`}
            className="min-h-56"
            bodyClassName="overflow-y-auto"
          >
            {queueLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <ol className="space-y-1.5">
                {queueItems.map((t) => (
                  <li key={t.id}>
                    <button
                      className="flex items-center gap-2 w-full text-left rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5 group hover:border-primary/40 transition-colors"
                      onClick={() => navigate(`/manager/tickets/${t.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] font-mono-num text-muted-foreground">
                          {t.code}
                        </p>
                        <p className="text-xs font-medium truncate">{t.title}</p>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </DashboardPanel>
        )}

        {showAtRisk && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.sitesNeedAttention}
            desc={`Sức khỏe < 80% · ${atRisk.length} site`}
            className="min-h-56"
            bodyClassName="overflow-y-auto"
          >
            {sitesLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {atRisk.map((s) => (
                  <button
                    key={s.id}
                    className="flex items-center gap-2.5 w-full text-left group"
                    onClick={() => navigate(`/manager/sites/${s.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {s.name}
                      </p>
                      <p className="text-[10.5px] text-muted-foreground truncate">
                        {s.customerName}
                      </p>
                    </div>
                    <div className="w-14 h-1.5 rounded-full bg-border shrink-0">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.health}%`,
                          background: healthColor(s.health),
                        }}
                      />
                    </div>
                    <span
                      className="text-[11px] font-semibold font-mono-num w-8 text-right shrink-0"
                      style={{ color: healthColor(s.health) }}
                    >
                      {s.health}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </DashboardPanel>
        )}

        {showTopAlerting && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.topAlerting}
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
                      onClick={() => navigate("/manager/alerts")}
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
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </DashboardPanel>
        )}

        {showTrend && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.newTickets7d}
            desc="Số ticket tạo theo ngày"
            className="min-h-56"
          >
            {ticketsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer
                config={areaConfig}
                className="h-full w-full aspect-auto min-h-0"
              >
                <AreaChart data={ticketTrend}>
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
                  <defs>
                    <linearGradient id="fillMgrTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-count)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-count)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="count"
                    type="monotone"
                    fill="url(#fillMgrTickets)"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </DashboardPanel>
        )}
      </div>
    </div>
  );
}
