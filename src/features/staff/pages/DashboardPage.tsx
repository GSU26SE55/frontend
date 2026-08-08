import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  DashboardKpi,
  DashboardPanel,
  DashboardDonut,
} from "@/shared/components/dashboard/DashboardPanel";
import { SlaGaugePanel } from "@/shared/components/dashboard/SlaGaugePanel";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { isUnreadStatus } from "@/shared/enums/notification/notification.enum";
import { useStaffTickets } from "@/features/staff/hooks/ticket/useStaffTickets";
import { useStaffTicketDashboardStats } from "@/shared/hooks/dashboard/useDashboardStats";
import { useStaffNotifications } from "@/features/staff/hooks/notification/useStaffNotifications";
import { useUnreadCount } from "@/shared/hooks/notifications/useNotifications";
import { TicketCard } from "@/features/staff/components/ticket/TicketCard";
import { isOpenTicket } from "@/shared/utils/ticket.utils";
import { OVERVIEW_PANELS } from "@/shared/constants/overviewPanels";

/**
 * Staff = PERSONAL WORKBENCH: assigned tickets, SLA risk, notifications.
 *
 * Does NOT show 7-day trends / system-wide stats — Staff acts on individual
 * tickets; trend charts are a Manager/Admin management tool.
 *
 * Layout: 1 FIXED FRAME, the page doesn't scroll. 3-column × 2-row grid; the
 * ticket list and notifications scroll INSIDE their own panel.
 *
 * Each panel uses a different shape (card list / gauge / donut / horizontal
 * bar / timeline) so the type of information is distinguishable by shape alone.
 */

const statusBarConfig = { value: { label: "Ticket" } } satisfies ChartConfig;

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function StaffDashboardPage() {
  const { data, isLoading, isError } = useStaffTickets({
    pageNumber: 1,
    pageSize: 100,
  });
  const { data: notifData, isLoading: notifLoading } = useStaffNotifications({
    pageNumber: 1,
    pageSize: 12,
  });
  const { data: unreadCount, isLoading: unreadLoading } = useUnreadCount();
  const { data: staffStats, isLoading: statsLoading } =
    useStaffTicketDashboardStats();

  const tickets = data?.items ?? [];
  const openTickets = tickets.filter(isOpenTicket);
  const priorityTickets = [...openTickets].sort((a, b) => {
    const aPercent = a.slaTimer?.remainingPercent ?? 101;
    const bPercent = b.slaTimer?.remainingPercent ?? 101;
    return aPercent - bPercent;
  });

  // ── KPI / gauge / donut / trend — server aggregate (B) ──
  const openCount = staffStats?.openCount ?? 0;
  const nearBreach = staffStats?.nearBreachCount ?? 0;
  const breachedCount = staffStats?.breachedCount ?? 0;
  const resolvedCount = staffStats?.resolvedCount ?? 0;

  // Colors + gauge are handled by SlaGaugePanel (shared with Manager); here we only
  // need the % string for the KPI cell.
  const sla = staffStats?.sla;
  const slaText = sla ? `${sla.compliancePercent}%` : "—";

  // ── Ticket status — horizontal bar (donut is already used for SLA risk, avoid 2 donuts) ──
  const statusCounts = staffStats?.countByStatus ?? {};
  const totalTickets = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const statusBuckets = [
    {
      name: "New/Open",
      value: (statusCounts.New ?? 0) + (statusCounts.Open ?? 0),
      fill: "var(--muted-foreground)",
    },
    {
      name: "In progress",
      value: (statusCounts.Assigned ?? 0) + (statusCounts.InProgress ?? 0),
      fill: "var(--chart-1)",
    },
    {
      name: "Waiting",
      value:
        (statusCounts.WaitingCustomer ?? 0) +
        (statusCounts.WaitingParts ?? 0) +
        (statusCounts.WaitingOnsiteSchedule ?? 0),
      fill: "var(--p3)",
    },
    {
      name: "Escalated",
      value: statusCounts.Escalated ?? 0,
      fill: "var(--p1)",
    },
    {
      name: "Completed",
      value:
        (statusCounts.Resolved ?? 0) +
        (statusCounts.ClosedPendingRate ?? 0) +
        (statusCounts.Closed ?? 0),
      fill: "var(--ok)",
    },
  ]
    .filter((b) => b.value > 0)
    .reverse(); // Recharts layout=vertical draws the first element at the BOTTOM

  // ── SLA risk donut (B.slaRisk) ──
  const riskData = [
    {
      name: "Healthy",
      value: staffStats?.slaRisk.healthy ?? 0,
      fill: "var(--ok)",
    },
    {
      name: "Near breach",
      value: staffStats?.slaRisk.near ?? 0,
      fill: "var(--p3)",
    },
    {
      name: "Breached",
      value: staffStats?.slaRisk.breached ?? 0,
      fill: "var(--p1)",
    },
  ].filter((d) => d.value > 0);

  // ── Notifications ──
  const notifications = notifData?.items ?? [];
  const unread = unreadCount ?? 0;

  // ── Visibility ──
  const showStatus = statsLoading || statusBuckets.length > 0;
  const showRisk = statsLoading || riskData.length > 0;
  const showNotifs = notifLoading || notifications.length > 0;

  return (
    <div className="min-h-full flex flex-col gap-4 p-4 lg:p-6 overflow-y-auto space-y-1">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0 pb-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Staff · Workbench
          </p>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight truncate mt-0.5">
            Assigned tickets & SLA risk
          </h1>
        </div>
        <RefreshButton
          queryKeys={[
            KEY.staffTickets,
            KEY.staffTicketDashboard,
            KEY.notifications,
            ["staff", "notifications"],
          ]}
          label="Refresh"
        />
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 shrink-0">
        <DashboardKpi
          label="Currently handling"
          value={statsLoading ? "--" : openCount}
          icon={<FileText className="size-4" />}
        />
        <DashboardKpi
          label="Near breach"
          value={statsLoading ? "--" : nearBreach}
          icon={<Clock className="size-4" />}
          accent={nearBreach > 0 ? "var(--p3)" : undefined}
        />
        <DashboardKpi
          label="Overdue"
          value={statsLoading ? "--" : breachedCount}
          icon={<AlertTriangle className="size-4" />}
          accent={breachedCount > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Resolved"
          value={statsLoading ? "--" : resolvedCount}
          icon={<CheckCircle className="size-4" />}
          accent="var(--ok)"
        />
        <DashboardKpi
          label="SLA met"
          value={statsLoading ? "--" : slaText}
          icon={<ShieldCheck className="size-4" />}
          accent={(sla?.breached ?? 0) > 0 ? "var(--p1)" : "var(--ok)"}
        />
        <DashboardKpi
          label="New notifications"
          value={unreadLoading ? "--" : unread}
          icon={<Bell className="size-4" />}
          accent={unread > 0 ? "var(--p3)" : undefined}
        />
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive shrink-0">
          Couldn't load Staff dashboard data.
        </div>
      )}

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[580px] flex-1">
        {/* [Card list] main working surface */}
        <DashboardPanel
          title={OVERVIEW_PANELS.staff.priority}
          desc="Sorted by remaining SLA %"
          className="lg:col-span-2 min-h-[280px]"
          bodyClassName="overflow-y-auto"
        >
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-md" />
              ))}
            </div>
          ) : priorityTickets.length === 0 ? (
            <div className="h-full grid place-items-center text-center">
              <div>
                <CheckCircle className="mx-auto size-8 text-primary" />
                <p className="mt-3 text-sm font-medium">No open tickets</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Assigned tickets will show up here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {priorityTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </DashboardPanel>

        {/* [Gauge] personal SLA compliance rate */}
        <SlaGaugePanel
          title={OVERVIEW_PANELS.staff.personalSla}
          desc="met / (met + breach)"
          sla={sla}
          isLoading={statsLoading}
          className="min-h-[280px]"
        />

        {/* [Donut] risk breakdown on open tickets */}
        {showRisk && (
          <DashboardPanel
            title={OVERVIEW_PANELS.staff.slaRisk}
            desc="Among open tickets"
            className="min-h-[280px]"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DashboardDonut
                data={riskData}
                centerValue={openCount}
                centerLabel="open"
              />
            )}
          </DashboardPanel>
        )}

        {/* [Horizontal bar] count comparison by status */}
        {showStatus && (
          <DashboardPanel
            title={OVERVIEW_PANELS.staff.ticketStatus}
            desc={`${totalTickets} of my tickets`}
            className="min-h-[280px]"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer
                config={statusBarConfig}
                className="h-full w-full aspect-auto min-h-[200px]"
              >
                <BarChart
                  accessibilityLayer
                  data={statusBuckets}
                  layout="vertical"
                  margin={{ left: 4, right: 16 }}
                >
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={84}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11.5, fontWeight: 500 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" radius={4} maxBarSize={18}>
                    {statusBuckets.map((b) => (
                      <Cell key={b.name} fill={b.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </DashboardPanel>
        )}

        {/* [Timeline] recent notifications */}
        {showNotifs && (
          <DashboardPanel
            title={OVERVIEW_PANELS.staff.recentNotifications}
            desc={`${unread} unread`}
            className="min-h-[280px]"
            bodyClassName="overflow-y-auto"
          >
            {notifLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <ol className="space-y-2">
                {notifications.map((n) => {
                  // The BE's "unread" definition excludes BOTH Read AND Opened — comparing
                  // `!== Read` directly would also bold notifications the user already opened.
                  const isUnread = isUnreadStatus(n.status);
                  return (
                    <li key={n.id} className="flex gap-2.5 items-start py-0.5">
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: isUnread
                            ? "var(--p3)"
                            : "var(--muted-foreground)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`text-xs lg:text-sm truncate ${
                              isUnread
                                ? "font-semibold text-foreground"
                                : "font-medium text-muted-foreground"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="font-mono-num text-xs text-muted-foreground shrink-0">
                            {fmtDateTime(n.createdAt)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {n.body}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </DashboardPanel>
        )}
      </div>
    </div>
  );
}
