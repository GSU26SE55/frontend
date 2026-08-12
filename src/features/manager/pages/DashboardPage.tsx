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
} from "@/shared/components/dashboard/DashboardPanel";
import { SlaGaugePanel } from "@/shared/components/dashboard/SlaGaugePanel";
import { useAdminTicketQueue } from "@/features/manager/hooks/ticket/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/ticket/useStaffAssignmentList";
import { useTicketDashboardStats } from "@/shared/hooks/dashboard/useDashboardStats";
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
  ClipboardCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import { OVERVIEW_PANELS } from "@/shared/constants/overviewPanels";

/**
 * Manager = TICKET COORDINATION: pipeline, SLA, priority, staff load, triage
 * queue, tickets awaiting approval.
 *
 * Does NOT show offline batteries / battery alerts / site health — that's
 * Admin's infrastructure surface. Manager acts on TICKETS; alerts already
 * auto-generate tickets, so showing raw alerts just duplicates the work.
 *
 * Layout: 1 FIXED FRAME, the page doesn't scroll. 4-column × 2-row grid — top
 * row is pipeline (3 cols) + SLA (1 col), bottom row is 4 equal panels. List
 * panels scroll internally.
 *
 * Each panel uses a different chart shape (horizontal bar / gauge / donut /
 * load bars / list / area) so the type of information is recognizable from
 * its shape alone.
 */

const pipelineConfig = { value: { label: "Ticket" } } satisfies ChartConfig;
const areaConfig = {
  count: { label: "New tickets", color: "var(--chart-1)" },
} satisfies ChartConfig;

const loadColor = (active: number, max: number) => {
  const ratio = max > 0 ? active / max : active > 0 ? 1 : 0;
  if (ratio >= 1) return "var(--p1)";
  if (ratio >= 0.7) return "var(--p3)";
  return "var(--ok)";
};

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data: ticketStats, isLoading: ticketsLoading } =
    useTicketDashboardStats();
  const { data: queuePage, isLoading: queueLoading } = useAdminTicketQueue({
    pageNumber: 1,
    pageSize: 50,
  });
  const { data: staffList, isLoading: staffLoading } = useStaffAssignmentList();

  // ── Tickets ──
  const sla = ticketStats?.sla;
  const totalTickets = ticketStats?.total ?? 0;
  const openCount = ticketStats?.openCount ?? 0;
  const queueCount = queuePage?.totalItems ?? 0;
  const queueItems = queuePage?.items ?? [];
  const ticketTrend = ticketStats?.createdTrend7Days ?? [];
  const hasTrend = ticketTrend.some((p) => p.count > 0);
  const statusCounts = ticketStats?.countByStatus ?? {};

  // Horizontal bar: the first stage sits ON TOP → declare in reverse then reverse it.
  const pipeline = [
    {
      stage: "New/Open",
      value: (statusCounts.New ?? 0) + (statusCounts.Open ?? 0),
      fill: "var(--muted-foreground)",
    },
    {
      stage: "Assigned",
      value: statusCounts.Assigned ?? 0,
      fill: "var(--chart-1)",
    },
    {
      stage: "In progress",
      value: statusCounts.InProgress ?? 0,
      fill: "var(--chart-1)",
    },
    {
      stage: "Waiting",
      value:
        (statusCounts.WaitingCustomer ?? 0) +
        (statusCounts.WaitingParts ?? 0) +
        (statusCounts.WaitingOnsiteSchedule ?? 0),
      fill: "var(--p3)",
    },
    {
      stage: "Escalated",
      value: (statusCounts.Escalated ?? 0) + (statusCounts.Incident ?? 0),
      fill: "var(--p1)",
    },
    {
      stage: "Completed",
      value:
        (statusCounts.Resolved ?? 0) +
        (statusCounts.Approved ?? 0) +
        (statusCounts.ClosedPendingRate ?? 0) +
        (statusCounts.Closed ?? 0),
      fill: "var(--ok)",
    },
  ];
  const pipelineTotal = pipeline.reduce((a, p) => a + p.value, 0);
  const pipelineChart = [...pipeline].reverse();

  // ── Priority ──
  const priorityCounts = ticketStats?.countByPriority ?? {};
  const priorityData = [
    {
      name: "P1 · Critical",
      value: priorityCounts.P1Critical ?? 0,
      fill: "var(--p1)",
    },
    { name: "P2 · High", value: priorityCounts.P2High ?? 0, fill: "var(--p2)" },
    {
      name: "P3 · Standard",
      value: priorityCounts.P3Normal ?? 0,
      fill: "var(--p3)",
    },
  ].filter((d) => d.value > 0);
  const priorityTotal = priorityData.reduce((a, d) => a + d.value, 0);

  // ── Staff load ──
  const staff = staffList ?? [];
  const openByStaff = new Map(
    (ticketStats?.openCountByStaff ?? []).map((o) => [
      o.staffId,
      o.activeCount,
    ]),
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
  const availableStaff = workload.filter((w) => w.available).length;

  // Tickets Staff has Resolved, awaiting Manager's approve/reject decision.
  const awaitingApproval = statusCounts.Resolved ?? 0;

  // ── Visibility ──
  const showPriority = ticketsLoading || priorityData.length > 0;
  const showWorkload = staffLoading || workload.length > 0;
  const showTriage = queueLoading || queueItems.length > 0;
  const showTrend = ticketsLoading || hasTrend;

  return (
    <div className="min-h-full flex flex-col gap-4 p-4 lg:p-6 overflow-y-auto space-y-1">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0 pb-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manager · Operations coordination
          </p>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight truncate mt-0.5">
            {ticketsLoading
              ? "Dashboard"
              : `${openCount} open tickets · ${queueCount} awaiting triage`}
          </h1>
        </div>
        <RefreshButton
          queryKeys={[KEY.ticketDashboard, KEY.manager.tickets]}
          label="Sync"
        />
      </div>

      {/* ── KPI strip — clickable ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 shrink-0">
        <DashboardKpi
          label="Open tickets"
          value={ticketsLoading ? "--" : openCount}
          icon={<Ticket className="size-4" />}
          to="/manager/tickets"
        />
        <DashboardKpi
          label="Needs triage"
          value={queueLoading ? "--" : queueCount}
          icon={<Inbox className="size-4" />}
          accent={queueCount > 0 ? "var(--p3)" : undefined}
          to="/manager/tickets/queue"
        />
        <DashboardKpi
          label="Awaiting approval"
          value={ticketsLoading ? "--" : awaitingApproval}
          icon={<ClipboardCheck className="size-4" />}
          accent={awaitingApproval > 0 ? "var(--p3)" : undefined}
          to="/manager/tickets"
        />
        <DashboardKpi
          label="SLA breached"
          value={ticketsLoading ? "--" : (sla?.breached ?? 0)}
          icon={<AlertTriangle className="size-4" />}
          accent={(sla?.breached ?? 0) > 0 ? "var(--p1)" : undefined}
          to="/manager/tickets"
        />
        <DashboardKpi
          label="SLA"
          value={
            ticketsLoading ? "--" : sla ? `${sla.compliancePercent}%` : "—"
          }
          icon={<ShieldCheck className="size-4" />}
          accent={(sla?.breached ?? 0) > 0 ? "var(--p1)" : "var(--ok)"}
        />
        <DashboardKpi
          label="Staff available"
          value={staffLoading ? "--" : availableStaff}
          icon={<Users className="size-4" />}
          accent={availableStaff === 0 ? "var(--p1)" : undefined}
        />
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[580px] flex-1">
        {/* [Horizontal bar] pipeline by stage */}
        <DashboardPanel
          title={OVERVIEW_PANELS.manager.ticketPipeline}
          desc={`${pipelineTotal} tickets by stage`}
          className="lg:col-span-3 min-h-[280px]"
        >
          {ticketsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : totalTickets === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              No tickets yet.
            </div>
          ) : (
            <ChartContainer
              config={pipelineConfig}
              className="h-full w-full aspect-auto min-h-[200px]"
            >
              <BarChart
                accessibilityLayer
                data={pipelineChart}
                layout="vertical"
                margin={{ left: 4, right: 16 }}
              >
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={84}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11.5, fontWeight: 500 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" radius={4} maxBarSize={20}>
                  {pipelineChart.map((p) => (
                    <Cell key={p.stage} fill={p.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </DashboardPanel>

        {/* [Gauge] SLA compliance rate */}
        <SlaGaugePanel
          title={OVERVIEW_PANELS.manager.sla}
          desc="met / (met + breach)"
          sla={sla}
          isLoading={ticketsLoading}
          className="min-h-[280px]"
        />

        {/* [Donut] priority breakdown */}
        {showPriority && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.priority}
            desc={`${priorityTotal} tickets`}
            className="min-h-[280px]"
          >
            {ticketsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DashboardDonut
                data={priorityData}
                centerValue={priorityTotal}
                centerLabel="tickets"
              />
            )}
          </DashboardPanel>
        )}

        {/* [Load bars] usage level per person */}
        {showWorkload && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.staffLoad}
            desc={`${availableStaff}/${workload.length} available`}
            className="min-h-[280px]"
            bodyClassName="overflow-y-auto"
          >
            {staffLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
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
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: w.available
                            ? "var(--ok)"
                            : "var(--muted-foreground)",
                        }}
                        title={w.available ? "Available" : "Busy"}
                      />
                      <span className="text-xs lg:text-sm font-medium truncate flex-1 min-w-0">
                        {w.name}
                      </span>
                      <div className="w-14 h-2 rounded-full bg-border shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: loadColor(w.active, w.max),
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold font-mono-num w-9 text-right shrink-0">
                        {w.active}/{w.max || "–"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardPanel>
        )}

        {/* [List] items needing immediate action */}
        {showTriage && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.triageQueue}
            desc={`${queueCount} tickets awaiting triage`}
            className="min-h-[280px]"
            bodyClassName="overflow-y-auto"
          >
            {queueLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <ol className="space-y-2">
                {queueItems.map((t) => (
                  <li key={t.id}>
                    <button
                      className="flex items-center gap-2.5 w-full text-left rounded-lg border border-border/70 bg-muted/20 px-2.5 py-2 group hover:border-primary/40 hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/manager/tickets/${t.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold font-mono-num text-muted-foreground">
                          {t.code}
                        </p>
                        <p className="text-xs lg:text-sm font-medium truncate mt-0.5">
                          {t.title}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </DashboardPanel>
        )}

        {/* [Area] trend over time */}
        {showTrend && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.newTickets7d}
            desc="Tickets created per day"
            className="min-h-[280px]"
          >
            {ticketsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer
                config={areaConfig}
                className="h-full w-full aspect-auto min-h-[200px]"
              >
                <AreaChart
                  data={ticketTrend}
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
                  <YAxis
                    width={32}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
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
        )}
      </div>
    </div>
  );
}
