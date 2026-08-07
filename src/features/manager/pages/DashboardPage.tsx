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
 * Manager = ĐIỀU PHỐI TICKET: pipeline, SLA, ưu tiên, tải nhân sự, hàng chờ
 * triage, ticket chờ duyệt.
 *
 * KHÔNG hiển thị pin offline / cảnh báo pin / sức khỏe site — đó là bề mặt hạ
 * tầng của Admin. Manager hành động trên TICKET; alert đã tự sinh ticket nên
 * nhìn alert thô chỉ làm trùng việc.
 *
 * Layout: 1 KHUNG CỐ ĐỊNH, trang không cuộn. Lưới 4 cột × 2 hàng — hàng trên
 * pipeline (3 cột) + SLA (1 cột), hàng dưới 4 panel bằng nhau. Panel danh sách
 * tự cuộn bên trong.
 *
 * Mỗi panel một dạng biểu đồ khác nhau (bar ngang / gauge / donut / thanh tải /
 * danh sách / area) để nhận ra loại thông tin ngay từ hình dạng.
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

  // Bar ngang: giai đoạn đầu nằm TRÊN → khai báo ngược rồi reverse.
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
        (statusCounts.Closed ?? 0),
      fill: "var(--ok)",
    },
  ];
  const pipelineTotal = pipeline.reduce((a, p) => a + p.value, 0);
  const pipelineChart = [...pipeline].reverse();

  // ── Ưu tiên ──
  const priorityCounts = ticketStats?.countByPriority ?? {};
  const priorityData = [
    {
      name: "P1 · Khẩn",
      value: priorityCounts.P1Critical ?? 0,
      fill: "var(--p1)",
    },
    { name: "P2 · Cao", value: priorityCounts.P2High ?? 0, fill: "var(--p2)" },
    {
      name: "P3 · Thường",
      value: priorityCounts.P3Normal ?? 0,
      fill: "var(--p3)",
    },
  ].filter((d) => d.value > 0);
  const priorityTotal = priorityData.reduce((a, d) => a + d.value, 0);

  // ── Tải nhân sự ──
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

  // Ticket Staff đã Resolved, đang chờ Manager duyệt/từ chối.
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
            Manager · Điều phối vận hành
          </p>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight truncate mt-0.5">
            {ticketsLoading
              ? "Dashboard"
              : `${openCount} ticket mở · ${queueCount} chờ triage`}
          </h1>
        </div>
        <RefreshButton
          queryKeys={[KEY.ticketDashboard, KEY.manager.tickets]}
          label="Đồng bộ"
        />
      </div>

      {/* ── KPI strip — bấm được ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 shrink-0">
        <DashboardKpi
          label="Tickets mở"
          value={ticketsLoading ? "--" : openCount}
          icon={<Ticket className="size-4" />}
          to="/manager/tickets"
        />
        <DashboardKpi
          label="Cần triage"
          value={queueLoading ? "--" : queueCount}
          icon={<Inbox className="size-4" />}
          accent={queueCount > 0 ? "var(--p3)" : undefined}
          to="/manager/tickets/queue"
        />
        <DashboardKpi
          label="Chờ duyệt"
          value={ticketsLoading ? "--" : awaitingApproval}
          icon={<ClipboardCheck className="size-4" />}
          accent={awaitingApproval > 0 ? "var(--p3)" : undefined}
          to="/manager/tickets"
        />
        <DashboardKpi
          label="Quá hạn SLA"
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
          label="Staff sẵn sàng"
          value={staffLoading ? "--" : availableStaff}
          icon={<Users className="size-4" />}
          accent={availableStaff === 0 ? "var(--p1)" : undefined}
        />
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[580px] flex-1">
        {/* [Bar ngang] pipeline theo giai đoạn */}
        <DashboardPanel
          title={OVERVIEW_PANELS.manager.ticketPipeline}
          desc={`${pipelineTotal} ticket theo giai đoạn`}
          className="lg:col-span-3 min-h-[280px]"
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

        {/* [Gauge] tỉ lệ tuân thủ SLA */}
        <SlaGaugePanel
          title={OVERVIEW_PANELS.manager.sla}
          desc="met / (met + breach)"
          sla={sla}
          isLoading={ticketsLoading}
          className="min-h-[280px]"
        />

        {/* [Donut] cơ cấu ưu tiên */}
        {showPriority && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.priority}
            desc={`${priorityTotal} ticket`}
            className="min-h-[280px]"
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

        {/* [Thanh tải] mức sử dụng từng người */}
        {showWorkload && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.staffLoad}
            desc={`${availableStaff}/${workload.length} sẵn sàng`}
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
                        title={w.available ? "Sẵn sàng" : "Bận"}
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

        {/* [Danh sách] việc cần làm ngay */}
        {showTriage && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.triageQueue}
            desc={`${queueCount} ticket chờ phân loại`}
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

        {/* [Area] xu hướng theo thời gian */}
        {showTrend && (
          <DashboardPanel
            title={OVERVIEW_PANELS.manager.newTickets7d}
            desc="Ticket tạo theo ngày"
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
                      `${v.slice(8, 10)}/${v.slice(5, 7)}`
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
