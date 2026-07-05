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
  DashboardGauge,
} from "@/shared/components/common/DashboardPanel";
import { useSiteList } from "@/features/manager/hooks/useSites";
import {
  useAdminTicketList,
  useAdminTicketQueue,
} from "@/features/manager/hooks/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/useStaffAssignmentList";
import { useAlertList } from "@/shared/hooks/useAlerts";
import { SiteStatusEnum } from "@/shared/types/site.types";
import { AlertSeverityEnum, AlertStatusEnum } from "@/shared/enums/alert.enum";
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
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import {
  Ticket,
  Inbox,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  BellRing,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import {
  siteHealth,
  healthColor,
  summarizeSla,
  isOpenTicket,
  countTicketsByStatus,
  groupTicketsByDay,
} from "@/shared/utils/dashboard.utils";

/**
 * Manager = Điều phối vận hành ticket: pipeline trạng thái, SLA, tải nhân sự,
 * hàng chờ triage, site cần chú ý. Tập trung vận hành — không quản trị hệ thống.
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
  const { data: ticketPage, isLoading: ticketsLoading } = useAdminTicketList({
    pageNumber: 1,
    pageSize: 200,
  });
  const { data: queuePage, isLoading: queueLoading } = useAdminTicketQueue({
    pageNumber: 1,
    pageSize: 50,
  });
  const { data: staffList, isLoading: staffLoading } = useStaffAssignmentList();
  const { data: alertData, isLoading: alertsLoading } = useAlertList({
    pageNumber: 1,
    pageSize: 200,
  });

  // ── Sites ──
  const sites = siteData?.items ?? [];
  const totalSites = siteData?.totalItems ?? 0;
  const activeSites = sites.filter(
    (s) => s.status === SiteStatusEnum.Active,
  ).length;
  const sitesH = sites.map((s) => ({ ...s, health: siteHealth(s) }));
  const atRisk = sitesH.filter((s) => s.health < 80);

  // ── Tickets ──
  const tickets = ticketPage?.items ?? [];
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(isOpenTicket);
  const queueCount = queuePage?.totalItems ?? 0;
  const queueItems = queuePage?.items ?? [];
  const sla = summarizeSla(tickets);
  const slaText =
    sla.compliancePercent === null ? "—" : `${sla.compliancePercent}%`;
  const slaPct = sla.compliancePercent ?? 0;
  const slaColor =
    sla.compliancePercent === null
      ? "var(--muted-foreground)"
      : slaPct >= 90
        ? "var(--ok)"
        : slaPct >= 70
          ? "var(--p3)"
          : "var(--p1)";
  const ticketTrend = groupTicketsByDay(tickets, 7);
  const statusCounts = countTicketsByStatus(tickets);

  const pipeline = [
    {
      stage: "Mới/Mở",
      value: (statusCounts.New ?? 0) + (statusCounts.Open ?? 0),
      fill: "var(--muted-foreground)",
    },
    {
      stage: "Đã gán",
      value: statusCounts.Assigned ?? 0,
      fill: "var(--chart-1)",
    },
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
        (statusCounts.Closed ?? 0) +
        (statusCounts.ClosedRejected ?? 0),
      fill: "var(--ok)",
    },
  ];

  // ── Staff workload (active open tickets / max) ──
  const staff = staffList ?? [];
  const workload = staff
    .map((s) => ({
      id: s.accountId,
      name: s.fullName,
      available: s.isAvailable,
      active: openTickets.filter((t) => t.assignedStaffId === s.accountId)
        .length,
      max: s.maxConcurrentTickets || 0,
    }))
    .sort((a, b) => b.active - a.active);

  // ── Alerts ──
  const alerts = alertData?.items ?? [];
  const openAlerts = alerts.filter(
    (a) => a.status === AlertStatusEnum.Open,
  ).length;
  const criticalOpen = alerts.filter(
    (a) =>
      a.status === AlertStatusEnum.Open &&
      a.severity === AlertSeverityEnum.Critical,
  ).length;

  return (
    <div className="flex flex-col gap-3 p-3 lg:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
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
          queryKeys={[KEY.sites, KEY.manager.tickets, KEY.alerts]}
          label="Đồng bộ"
        />
      </div>

      {/* ── KPI strip (ticket ops) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <DashboardKpi
          label="Tickets mở"
          value={ticketsLoading ? "--" : openTickets.length}
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
          value={ticketsLoading ? "--" : sla.breached}
          sub="breach"
          icon={<AlertTriangle className="size-3.5" />}
          accent={sla.breached > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="SLA"
          value={ticketsLoading ? "--" : slaText}
          hint={`${sla.met} met`}
          icon={<ShieldCheck className="size-3.5" />}
          accent={sla.breached > 0 ? "var(--p1)" : "var(--ok)"}
        />
        <DashboardKpi
          label="Sites"
          value={sitesLoading ? "--" : totalSites}
          hint={`${activeSites} hoạt động`}
          icon={<MapPin className="size-3.5" />}
        />
        <DashboardKpi
          label="Cảnh báo mở"
          value={alertsLoading ? "--" : openAlerts}
          hint={`${criticalOpen} critical`}
          icon={<BellRing className="size-3.5" />}
          accent={criticalOpen > 0 ? "var(--p1)" : undefined}
        />
      </div>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[1.1fr_1fr] gap-3 lg:flex-1 lg:min-h-0">
        {/* Ticket pipeline — horizontal bars */}
        <DashboardPanel
          title="Pipeline xử lý ticket"
          desc={`${totalTickets} ticket theo giai đoạn`}
          className="lg:col-span-5 min-h-60 lg:min-h-0"
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

        {/* SLA gauge */}
        <DashboardPanel
          title="Tuân thủ SLA"
          desc="met / (met + breach)"
          className="lg:col-span-3 min-h-60 lg:min-h-0"
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
                      {sla.met}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground">Met</p>
                  </div>
                  <div className="rounded-md bg-muted/40 py-1.5">
                    <p className="text-sm font-semibold tabular-nums">
                      {sla.running}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground">
                      Running
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 py-1.5">
                    <p
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: "var(--p1)" }}
                    >
                      {sla.breached}
                    </p>
                    <p className="text-[9.5px] text-muted-foreground">Breach</p>
                  </div>
                </div>
              }
            />
          )}
        </DashboardPanel>

        {/* Tickets 7-day — area */}
        <DashboardPanel
          title="Ticket mới · 7 ngày"
          desc="Số ticket tạo theo ngày"
          className="lg:col-span-4 min-h-60 lg:min-h-0"
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
                  dataKey="day"
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
                  <linearGradient
                    id="fillMgrTickets"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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

        {/* Staff workload */}
        <DashboardPanel
          title="Tải nhân sự"
          desc={`${workload.length} staff · ticket đang xử lý / tối đa`}
          className="lg:col-span-5 min-h-55 lg:min-h-0"
          bodyClassName="overflow-y-auto"
        >
          {staffLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : workload.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có nhân sự.</p>
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

        {/* Triage queue */}
        <DashboardPanel
          title="Hàng chờ triage"
          desc={`${queueCount} ticket chờ phân loại`}
          className="lg:col-span-4 min-h-55 lg:min-h-0"
          bodyClassName="overflow-y-auto"
        >
          {queueLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : queueItems.length === 0 ? (
            <div className="h-full grid place-items-center text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="size-7 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Không có ticket chờ triage
                </p>
              </div>
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

        {/* At-risk sites */}
        <DashboardPanel
          title="Sites cần chú ý"
          desc={`Sức khỏe < 80% · ${atRisk.length} site`}
          className="lg:col-span-3 min-h-55 lg:min-h-0"
          bodyClassName="overflow-y-auto"
        >
          {sitesLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : atRisk.length === 0 ? (
            <div className="h-full grid place-items-center text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="size-7 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Tất cả sites khỏe mạnh
                </p>
              </div>
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
      </div>
    </div>
  );
}
