import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DashboardHeading,
  DashboardPanel,
  Stat,
  StatRail,
} from "@/shared/components/dashboard/DashboardPanel";
import {
  BarList,
  ChartFooterStats,
  RecentTable,
  SegmentedRing,
} from "@/shared/components/dashboard/DashboardBlocks";
import { SlaGaugePanel } from "@/shared/components/dashboard/SlaGaugePanel";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import { useAdminTicketQueue } from "@/features/manager/hooks/ticket/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/ticket/useStaffAssignmentList";
import { useTicketDashboardStats } from "@/shared/hooks/dashboard/useDashboardStats";
import { KEY } from "@/shared/utils/queryKeys";
import { plural, statusLine } from "@/shared/utils/plural";
import { categoryColor } from "@/shared/theme/chartPalette";

/**
 * Manager = TICKET COORDINATION: what needs triaging, how old it is, where the pipeline
 * is stuck, who is carrying the load, and whether SLA is holding.
 *
 * ONE FIXED FRAME that fills the viewport at any data volume. Six panels on two equal
 * rows: the frame is full whether the queue holds four tickets or forty, and no panel is
 * sized by its own content, so nothing moves as data lands.
 *
 * Console density, not marketing density: figures sit on a hairline rail rather than in
 * a gradient hero card, and every number is tabular.
 *
 * Does NOT show offline batteries / battery alerts / site health - that is Admin's
 * infrastructure surface. Manager acts on TICKETS; alerts already auto-generate tickets.
 */

const trendConfig = {
  count: { label: "New tickets", color: "var(--primary)" },
} satisfies ChartConfig;

const DAY = 24 * 60 * 60 * 1000;

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
  const statusCounts = ticketStats?.countByStatus ?? {};
  const breached = sla?.breached ?? 0;
  const slaTotal = sla ? sla.met + sla.breached : 0;

  // ── Load per person ──
  const openByStaff = new Map(
    (ticketStats?.openCountByStaff ?? []).map((o) => [
      o.staffId,
      o.activeCount,
    ]),
  );
  const staff = staffList ?? [];
  const workload = staff
    .map((s) => ({
      id: s.accountId,
      name: s.fullName,
      available: s.isAvailable,
      active: openByStaff.get(s.accountId) ?? 0,
    }))
    .sort((a, b) => b.active - a.active);
  const availableStaff = workload.filter((w) => w.available).length;
  const busiest = workload[0]?.active ?? 0;

  // ── Pipeline — stages are steps, not severities, so the palette is categorical ──
  const pipeline = [
    {
      name: "New/Open",
      value: (statusCounts.New ?? 0) + (statusCounts.Open ?? 0),
    },
    { name: "Assigned", value: statusCounts.Assigned ?? 0 },
    { name: "In progress", value: statusCounts.InProgress ?? 0 },
    {
      name: "Waiting",
      value:
        (statusCounts.WaitingCustomer ?? 0) +
        (statusCounts.WaitingParts ?? 0) +
        (statusCounts.WaitingOnsiteSchedule ?? 0),
    },
    {
      name: "Escalated",
      value: (statusCounts.Escalated ?? 0) + (statusCounts.Incident ?? 0),
    },
    {
      name: "Completed",
      value:
        (statusCounts.Resolved ?? 0) +
        (statusCounts.Approved ?? 0) +
        (statusCounts.ClosedPendingRate ?? 0) +
        (statusCounts.Closed ?? 0),
    },
  ]
    .filter((s) => s.value > 0)
    .map((s, i) => ({ ...s, fill: categoryColor(i) }));
  const pipelineTotal = pipeline.reduce((a, p) => a + p.value, 0);

  // ── Priority ──
  const priorityCounts = ticketStats?.countByPriority ?? {};
  const p1 = priorityCounts.P1Critical ?? 0;
  const p2 = priorityCounts.P2High ?? 0;
  const p3 = priorityCounts.P3Normal ?? 0;

  // ── How long the untriaged have been sitting there ──
  // Derived from the queue page rather than the aggregate: the endpoint has no age
  // buckets, and this is the one question the triage list cannot answer at a glance
  // once it is longer than a screen.
  // Read once per mount rather than on every render: the buckets are a snapshot, and
  // re-reading the clock mid-render is both impure and enough to move a ticket between
  // buckets while the user is looking at it.
  const [now] = useState(() => Date.now());
  const ages = queueItems.map((t) => now - new Date(t.createdAt).getTime());
  const ageBuckets = [
    {
      name: "Under a day",
      value: ages.filter((a) => a < DAY).length,
      fill: "var(--ok)",
    },
    {
      name: "1 to 3 days",
      value: ages.filter((a) => a >= DAY && a < 3 * DAY).length,
      fill: "var(--p3)",
    },
    {
      name: "Over 3 days",
      value: ages.filter((a) => a >= 3 * DAY).length,
      fill: "var(--p1)",
    },
  ];
  const oldest = ages.length ? Math.max(...ages) : 0;

  // Tickets Staff has Resolved, awaiting Manager's approve/reject decision.
  const awaitingApproval = statusCounts.Resolved ?? 0;

  const ticketTrend = ticketStats?.createdTrend7Days ?? [];
  const createdThisWeek = ticketTrend.reduce((a, p) => a + p.count, 0);
  const busiestDay = ticketTrend.reduce(
    (best, p) => (p.count > best.count ? p : best),
    { date: "", count: 0 },
  );

  const problems: string[] = [];
  if (breached > 0)
    problems.push(`${plural(breached, "ticket", "tickets")} past SLA`);
  if (queueCount > 0)
    problems.push(
      `${plural(queueCount, "ticket", "tickets")} waiting to be triaged`,
    );
  if (awaitingApproval > 0)
    problems.push(
      `${plural(awaitingApproval, "resolution", "resolutions")} to approve`,
    );
  if (availableStaff === 0 && workload.length > 0)
    problems.push("no staff marked available");
  const status = ticketsLoading
    ? "Reading the ticket queue."
    : statusLine(
        problems,
        `${plural(openCount, "ticket is", "tickets are")} open and nothing is blocked.`,
      );

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-4 lg:overflow-hidden">
      <div className="shrink-0">
        <DashboardHeading
          title="Operations"
          status={status}
          refreshKeys={[KEY.ticketDashboard, KEY.manager.tickets]}
        />

        {/* Figures on a hairline rail: no card, no gradient, no shadow. They are
            readings, not five things to click. */}
        <StatRail className="mt-3">
          <Stat
            label="Open tickets"
            value={ticketsLoading ? "--" : openCount}
            hint={totalTickets > 0 ? `${totalTickets} all time` : undefined}
            to="/manager/tickets"
          />
          <Stat
            label="Waiting to be triaged"
            value={queueLoading ? "--" : queueCount}
            hint={
              oldest > 0
                ? `oldest ${formatDistanceToNowStrict(new Date(now - oldest))}`
                : undefined
            }
            tone={queueCount > 0 ? "p3" : undefined}
            to="/manager/tickets/queue"
          />
          <Stat
            label="Awaiting approval"
            value={ticketsLoading ? "--" : awaitingApproval}
            tone={awaitingApproval > 0 ? "p3" : undefined}
            to="/manager/tickets"
          />
          <Stat
            label="Past SLA"
            value={ticketsLoading ? "--" : breached}
            tone={breached > 0 ? "p1" : undefined}
            to="/manager/tickets"
          />
          {/* A percentage off one closed ticket is noise, so the rail shows the raw
              fraction until there is enough of a record to divide. */}
          <Stat
            label="SLA met"
            value={
              ticketsLoading
                ? "--"
                : slaTotal === 0
                  ? "no data"
                  : slaTotal < 5
                    ? `${sla?.met}/${slaTotal}`
                    : `${sla?.compliancePercent}%`
            }
            hint={
              slaTotal >= 5 ? `${sla?.met} of ${slaTotal}` : "closed tickets"
            }
            tone={breached > 0 ? "p1" : slaTotal > 0 ? "ok" : undefined}
          />
        </StatRail>
      </div>

      {/* Two equal rows that split whatever height is left. Every panel stretches to its
          cell, so the frame is full at four tickets and at forty. */}
      <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-12 lg:grid-rows-2">
        <RecentTable
          title="Waiting to be triaged"
          viewAllTo="/manager/tickets/queue"
          columns={["Ticket", "Subject", "Priority", "Waiting"]}
          isLoading={queueLoading}
          minWidthClass="min-w-0"
          className="min-h-72 lg:col-span-5 lg:min-h-0"
          empty={
            queueItems.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nothing is waiting on triage.
              </p>
            ) : undefined
          }
        >
          {queueItems.map((t) => (
            <tr
              key={t.id}
              onClick={() => navigate(`/manager/tickets/${t.id}`)}
              className="cursor-pointer transition-colors hover:bg-muted/50"
            >
              <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-muted-foreground">
                {t.code}
              </td>
              <td className="max-w-0 truncate px-4 py-2">{t.title}</td>
              <td className="whitespace-nowrap px-4 py-2">
                {t.priority ? (
                  <TicketPriorityBadge priority={t.priority} />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    not triaged
                  </span>
                )}
              </td>
              {/* How long it has sat untriaged, not the date it arrived: the age is what
                  decides which one to pick up next. */}
              <td className="whitespace-nowrap px-4 py-2 text-right font-mono text-xs text-muted-foreground">
                {formatDistanceToNowStrict(new Date(t.createdAt))}
              </td>
            </tr>
          ))}
        </RecentTable>

        <DashboardPanel
          title="New tickets, last 7 days"
          desc={`${createdThisWeek} this week`}
          className="min-h-72 rounded-lg lg:col-span-4 lg:min-h-0"
          bodyClassName="flex flex-col gap-2"
        >
          {ticketsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <>
              <ChartContainer
                config={trendConfig}
                className="aspect-auto min-h-0 w-full flex-1"
              >
                <BarChart
                  accessibilityLayer
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
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    width={24}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={8}
                    maxBarSize={22}
                  />
                </BarChart>
              </ChartContainer>
              <ChartFooterStats
                items={[
                  {
                    label: "this week",
                    value: createdThisWeek,
                    color: "var(--cat-1)",
                  },
                  {
                    label: "busiest day",
                    value: busiestDay.count,
                    color: "var(--cat-3)",
                  },
                  { label: "open now", value: openCount, color: "var(--cat-2)" },
                ]}
              />
            </>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Staff load"
          desc={`${availableStaff}/${workload.length} available`}
          className="min-h-72 rounded-lg lg:col-span-3 lg:min-h-0"
          bodyClassName="overflow-y-auto"
        >
          {staffLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-md" />
              ))}
            </div>
          ) : workload.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No staff on record.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {workload.map((w) => (
                <li key={w.id} className="flex items-center gap-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {w.name}
                  </span>
                  {/* Only the exception is marked. A green dot on every row when
                      everyone is available says nothing. */}
                  {!w.available && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      busy
                    </span>
                  )}
                  {busiest > 0 && (
                    <span className="h-1 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(w.active / busiest) * 100}%` }}
                      />
                    </span>
                  )}
                  <span className="w-4 shrink-0 text-right font-mono text-xs tabular-nums">
                    {w.active}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Ticket pipeline"
          desc={pipelineTotal > 0 ? `${pipelineTotal} by stage` : undefined}
          className="min-h-72 rounded-lg lg:col-span-5 lg:min-h-0"
          bodyClassName="flex flex-col gap-2"
        >
          {ticketsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : pipeline.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No tickets yet.
            </p>
          ) : (
            <>
              <div className="min-h-0 flex-1">
                <SegmentedRing
                  data={pipeline}
                  centerValue={pipelineTotal}
                  centerLabel="tickets"
                />
              </div>
              {/* Priority sits under the ring instead of taking its own row of cards:
                  three numbers do not need three panels. */}
              <ChartFooterStats
                items={[
                  { label: "P1 · 4h SLA", value: p1, color: "var(--p1)" },
                  { label: "P2 · 24h SLA", value: p2, color: "var(--p2)" },
                  { label: "P3 · 72h SLA", value: p3, color: "var(--p3)" },
                ]}
              />
            </>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Untriaged by age"
          desc={queueCount > 0 ? `${queueCount} in the queue` : undefined}
          className="min-h-72 rounded-lg lg:col-span-4 lg:min-h-0"
        >
          {queueLoading ? (
            <Skeleton className="h-full w-full" />
          ) : queueItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing is waiting on triage.
            </p>
          ) : (
            <BarList data={ageBuckets} total={queueItems.length} />
          )}
        </DashboardPanel>

        <SlaGaugePanel
          title="SLA compliance"
          desc="met / (met + breach)"
          sla={sla}
          isLoading={ticketsLoading}
          className="min-h-72 rounded-lg lg:col-span-3 lg:min-h-0"
        />
      </div>
    </div>
  );
}
