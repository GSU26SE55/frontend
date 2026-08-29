import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
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
} from "@/shared/components/dashboard/DashboardBlocks";
import { SlaGaugePanel } from "@/shared/components/dashboard/SlaGaugePanel";
import { slaComplianceTone } from "@/shared/lib/sla";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import { KEY } from "@/shared/utils/queryKeys";
import { plural, statusLine } from "@/shared/utils/plural";
import { categoryColor } from "@/shared/theme/chartPalette";
import { useStaffTickets } from "@/features/staff/hooks/ticket/useStaffTickets";
import { useStaffTicketDashboardStats } from "@/shared/hooks/dashboard/useDashboardStats";
import { isOpenTicket } from "@/shared/utils/ticket.utils";
// KbCategoryLabel is the label map for TicketCategoryEnum — KB reuses the ticket enum,
// and this is the only place the human-readable names live.
import { KbCategoryLabel } from "@/shared/enums/kb/kb.enum";

/**
 * Staff = PERSONAL WORKBENCH: what to open next, and the figures that explain why.
 *
 * ONE FIXED FRAME that fills the viewport at any data volume. Five panels on two equal
 * rows; nothing is sized by its own content, so two tickets and thirty produce the same
 * frame and nothing moves as data lands.
 *
 * The list leads because it is the only thing here anyone acts on, and it is sorted by
 * SLA time left, so the row that runs out first is the top row. Rows past their SLA get
 * an edge accent, not an outline: a ring around a card reads as an error state on the
 * container rather than a property of the ticket.
 *
 * The two breakdowns are bars, not donuts. One person's queue is two or three tickets,
 * and at that size a ring is a decoration with a legend beside it - the same numbers
 * read faster as bars that fill the panel edge to edge.
 */

const trendConfig = {
  count: { label: "Assigned", color: "var(--primary)" },
} satisfies ChartConfig;

/** How a row reads at a glance: past SLA, close to it, or fine. */
function slaTone(remaining: number | null | undefined) {
  if (remaining === undefined || remaining === null) return null;
  if (remaining <= 0) return "p1" as const;
  if (remaining <= 25) return "p3" as const;
  return null;
}

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useStaffTickets({
    pageNumber: 1,
    pageSize: 100,
  });
  const { data: staffStats, isLoading: statsLoading } =
    useStaffTicketDashboardStats();

  const tickets = data?.items ?? [];
  const openTickets = tickets.filter(isOpenTicket);
  // Least SLA time left first: the top row is always the one to open next.
  const priorityTickets = [...openTickets].sort((a, b) => {
    const aPercent = a.slaTimer?.remainingPercent ?? 101;
    const bPercent = b.slaTimer?.remainingPercent ?? 101;
    return aPercent - bPercent;
  });

  // ── Server aggregate ──
  const openCount = staffStats?.openCount ?? 0;
  const nearBreach = staffStats?.nearBreachCount ?? 0;
  const breachedCount = staffStats?.breachedCount ?? 0;
  const resolvedCount = staffStats?.resolvedCount ?? 0;
  const sla = staffStats?.sla;
  const slaTotal = sla ? sla.met + sla.breached : 0;

  const problems: string[] = [];
  if (breachedCount > 0)
    problems.push(
      `${plural(breachedCount, "ticket is", "tickets are")} overdue`,
    );
  if (nearBreach > 0)
    problems.push(
      `${plural(nearBreach, "ticket is", "tickets are")} near breach`,
    );
  const status = statsLoading
    ? "Reading your assigned tickets."
    : statusLine(
        problems,
        openCount > 0
          ? `${plural(openCount, "ticket", "tickets")} in hand, all within SLA.`
          : "Nothing assigned to you right now.",
      );

  // ── SLA risk — here the hue IS the message, so it keeps the status tones ──
  const risk = [
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
  ];
  // Scale against the risk total, not `openCount`: the two disagree when a ticket has no
  // SLA timer, and a bar that never fills while the header says otherwise is worse than
  // no bar at all.
  const riskTotal = risk.reduce((a, r) => a + r.value, 0);

  // ── Status split — stages are steps, not severities, so the palette is categorical ──
  const statusCounts = staffStats?.countByStatus ?? {};
  const byStatus = [
    {
      name: "New/Open",
      value: (statusCounts.New ?? 0) + (statusCounts.Open ?? 0),
    },
    {
      name: "In progress",
      value: (statusCounts.Assigned ?? 0) + (statusCounts.InProgress ?? 0),
    },
    {
      name: "Waiting",
      value:
        (statusCounts.WaitingCustomer ?? 0) +
        (statusCounts.WaitingParts ?? 0) +
        (statusCounts.WaitingOnsiteSchedule ?? 0),
    },
    { name: "Escalated", value: statusCounts.Escalated ?? 0 },
    {
      name: "Completed",
      value:
        (statusCounts.Resolved ?? 0) +
        (statusCounts.ClosedPendingRate ?? 0) +
        (statusCounts.Closed ?? 0),
    },
  ]
    .filter((b) => b.value > 0)
    .map((b, i) => ({ ...b, fill: categoryColor(i) }));
  const statusTotal = byStatus.reduce((a, b) => a + b.value, 0);

  // ── Week in bars ──
  const trend = staffStats?.createdTrend7Days ?? [];
  const assignedThisWeek = trend.reduce((a, p) => a + p.count, 0);
  const busiestDay = trend.reduce(
    (best, p) => (p.count > best.count ? p : best),
    { date: "", count: 0 },
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto py-6 pl-(--page-pl) pr-(--page-pr) lg:overflow-hidden">
      <div className="shrink-0">
        <DashboardHeading
          title="Your work"
          status={status}
          refreshKeys={[KEY.staffTickets, KEY.staffTicketDashboard]}
        />

        {/* Flat cards: no gradient, no shadow at rest — only a tone tints one. */}
        <StatRail className="mt-3">
          <Stat
            label="Handling now"
            value={statsLoading ? "--" : openCount}
            to="/staff/tickets"
          />
          <Stat
            label="Near breach"
            value={statsLoading ? "--" : nearBreach}
            tone={nearBreach > 0 ? "p3" : undefined}
            to="/staff/tickets"
          />
          <Stat
            label="Overdue"
            value={statsLoading ? "--" : breachedCount}
            tone={breachedCount > 0 ? "p1" : undefined}
            to="/staff/tickets"
          />
          <Stat label="Resolved" value={statsLoading ? "--" : resolvedCount} />
          {/* A percentage off one closed ticket is noise, so the rail shows the raw
              fraction until there is enough of a record to divide. */}
          <Stat
            label="SLA on time"
            value={
              statsLoading
                ? "--"
                : slaTotal === 0
                  ? "0"
                  : slaTotal < 5
                    ? `${sla?.met}/${slaTotal}`
                    : `${sla?.compliancePercent}%`
            }
            tone={slaComplianceTone(
              slaTotal > 0 ? sla?.compliancePercent : undefined,
            )}
          />
        </StatRail>

        {isError && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Couldn&apos;t load your dashboard data.
          </p>
        )}
      </div>

      {/* Two equal rows that split whatever height is left, so the frame is full at two
          tickets and at thirty. */}
      <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-12 lg:grid-rows-2">
        <RecentTable
          title="Work priority"
          viewAllTo="/staff/tickets"
          columns={[
            "Ticket",
            "Subject",
            "Category",
            "Priority",
            "SLA left",
            "Status",
          ]}
          isLoading={isLoading}
          className="min-h-72 lg:col-span-8 lg:min-h-0"
          empty={
            priorityTickets.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No open tickets. Anything assigned to you shows up here.
              </p>
            ) : undefined
          }
        >
          {priorityTickets.map((t) => {
            const remaining = t.slaTimer?.remainingPercent;
            const tone = slaTone(remaining);
            return (
              <tr
                key={t.id}
                onClick={() => navigate(`/staff/tickets/${t.id}`)}
                className={
                  tone === "p1"
                    ? "cursor-pointer bg-p1-soft transition-colors hover:bg-p1/20"
                    : tone === "p3"
                      ? "cursor-pointer bg-p3-soft/60 transition-colors hover:bg-p3/20"
                      : "cursor-pointer transition-colors hover:bg-muted/50"
                }
              >
                {/* The accent rides on the first cell: a <tr> border does not paint
                    reliably across cells once the table has its own row dividers. */}
                <td
                  className="whitespace-nowrap border-l-[3px] px-4 py-2 font-mono text-xs text-muted-foreground"
                  style={{
                    borderLeftColor: tone
                      ? tone === "p1"
                        ? "var(--p1)"
                        : "var(--p3)"
                      : "transparent",
                  }}
                >
                  {t.code}
                </td>
                <td className="max-w-0 truncate px-4 py-2">
                  <span className={tone === "p1" ? "font-medium" : undefined}>
                    {t.title}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                  {KbCategoryLabel[t.category] ?? t.category}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  {t.priority ? (
                    <TicketPriorityBadge priority={t.priority} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      not triaged
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs tabular-nums">
                  {remaining === undefined || remaining === null ? (
                    <span className="text-muted-foreground">no timer</span>
                  ) : tone === "p1" ? (
                    <span className="inline-flex items-center gap-1.5 text-p1">
                      <AlertTriangle className="size-3.5" />
                      Overdue
                    </span>
                  ) : (
                    <span className={tone === "p3" ? "text-p3" : undefined}>
                      {Math.round(remaining)}%
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <TicketStatusBadge status={t.status} />
                </td>
              </tr>
            );
          })}
        </RecentTable>

        <DashboardPanel
          title="SLA risk"
          desc={riskTotal > 0 ? `${riskTotal} on a timer` : undefined}
          className="min-h-52 rounded-lg lg:col-span-4 lg:min-h-0"
        >
          {statsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : riskTotal === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No open tickets to track.
            </p>
          ) : (
            <BarList data={risk} total={riskTotal} />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Assigned to you, last 7 days"
          desc={`${assignedThisWeek} this week`}
          className="min-h-72 rounded-lg lg:col-span-5 lg:min-h-0"
          bodyClassName="flex flex-col gap-2"
        >
          {statsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <>
              <ChartContainer
                config={trendConfig}
                className="aspect-auto min-h-0 w-full flex-1"
              >
                <BarChart
                  accessibilityLayer
                  data={trend}
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
                    maxBarSize={20}
                  />
                </BarChart>
              </ChartContainer>
              <ChartFooterStats
                items={[
                  {
                    label: "this week",
                    value: assignedThisWeek,
                    color: "var(--cat-1)",
                  },
                  {
                    label: "busiest day",
                    value: busiestDay.count,
                    color: "var(--cat-3)",
                  },
                  { label: "in hand", value: openCount, color: "var(--cat-2)" },
                ]}
              />
            </>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="By status"
          desc={statusTotal > 0 ? `${statusTotal} tickets` : undefined}
          className="min-h-52 rounded-lg lg:col-span-4 lg:min-h-0"
        >
          {statsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : byStatus.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nothing assigned to you yet.
            </p>
          ) : (
            <BarList data={byStatus} total={statusTotal} />
          )}
        </DashboardPanel>

        <SlaGaugePanel
          title="SLA compliance"
          desc="finished timers"
          sla={sla}
          isLoading={statsLoading}
          className="min-h-52 rounded-lg lg:col-span-3 lg:min-h-0"
        />
      </div>
    </div>
  );
}
