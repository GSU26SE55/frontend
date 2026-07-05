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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  DashboardKpi,
  DashboardPanel,
  DashboardDonut,
  DashboardGauge,
} from "@/shared/components/common/DashboardPanel";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import {
  SlaTimerStatusEnum,
  TicketStatusEnum,
} from "@/shared/types/ticket.types";
import { NotificationStatusEnum } from "@/shared/enums/notification.enum";
import { useStaffTickets } from "@/features/staff/hooks/useStaffTickets";
import { useStaffNotifications } from "@/features/staff/hooks/useStaffNotifications";
import { TicketCard } from "@/features/staff/components/TicketCard";
import type { TicketDTO } from "@/shared/types/ticket.types";
import {
  isOpenTicket,
  summarizeSla,
  countTicketsByStatus,
  groupTicketsByDay,
} from "@/shared/utils/dashboard.utils";
import { isNearBreachPercent } from "@/shared/lib/sla";

function isNearBreach(ticket: TicketDTO) {
  const percent = ticket.slaTimer?.remainingPercent;
  return percent !== undefined && percent > 0 && isNearBreachPercent(percent);
}
function isBreached(ticket: TicketDTO) {
  return ticket.slaTimer?.status === SlaTimerStatusEnum.Breached;
}

const areaConfig = {
  count: { label: "Ticket", color: "var(--chart-1)" },
} satisfies ChartConfig;

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

  const tickets = data?.items ?? [];
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(isOpenTicket);
  const breached = openTickets.filter(isBreached);
  const near = openTickets.filter((t) => isNearBreach(t) && !isBreached(t));
  const healthyCount = openTickets.length - breached.length - near.length;
  const resolved = tickets.filter(
    (t) => t.status === TicketStatusEnum.Resolved,
  );

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

  const priorityTickets = [...openTickets].sort((a, b) => {
    const aPercent = a.slaTimer?.remainingPercent ?? 101;
    const bPercent = b.slaTimer?.remainingPercent ?? 101;
    return aPercent - bPercent;
  });

  const ticketTrend = groupTicketsByDay(tickets, 7);

  // ── Status donut ──
  const statusCounts = countTicketsByStatus(tickets);
  const statusBuckets = [
    {
      name: "Mới/Mở",
      value: (statusCounts.New ?? 0) + (statusCounts.Open ?? 0),
      fill: "var(--muted-foreground)",
    },
    {
      name: "Đang xử lý",
      value: (statusCounts.Assigned ?? 0) + (statusCounts.InProgress ?? 0),
      fill: "var(--chart-1)",
    },
    {
      name: "Đang chờ",
      value:
        (statusCounts.WaitingCustomer ?? 0) +
        (statusCounts.WaitingParts ?? 0) +
        (statusCounts.WaitingOnsiteSchedule ?? 0),
      fill: "var(--p3)",
    },
    {
      name: "Nâng cấp",
      value: statusCounts.Escalated ?? 0,
      fill: "var(--p1)",
    },
    {
      name: "Hoàn tất",
      value:
        (statusCounts.Resolved ?? 0) +
        (statusCounts.ClosedPendingRate ?? 0) +
        (statusCounts.Closed ?? 0),
      fill: "var(--ok)",
    },
  ].filter((b) => b.value > 0);

  // ── SLA risk donut ──
  const riskData = [
    { name: "An toàn", value: healthyCount, fill: "var(--ok)" },
    { name: "Sắp breach", value: near.length, fill: "var(--p3)" },
    { name: "Đã breach", value: breached.length, fill: "var(--p1)" },
  ].filter((d) => d.value > 0);

  // ── Notifications ──
  const notifications = notifData?.items ?? [];
  const unread = notifications.filter(
    (n) => n.status !== NotificationStatusEnum.Read,
  ).length;

  return (
    <div className="flex flex-col gap-3 p-3 lg:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            Staff · Bảng làm việc
          </p>
          <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
            Ticket được giao & rủi ro SLA
          </h1>
        </div>
        <RefreshButton
          queryKeys={[KEY.staffTickets, ["staff", "notifications"]]}
          label="Làm mới"
        />
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <DashboardKpi
          label="Đang phụ trách"
          value={isLoading ? "--" : openTickets.length}
          sub="tickets"
          icon={<FileText className="size-3.5" />}
        />
        <DashboardKpi
          label="Sắp breach"
          value={isLoading ? "--" : near.length}
          sub="≤ 25%"
          icon={<Clock className="size-3.5" />}
          accent={near.length > 0 ? "var(--p3)" : undefined}
        />
        <DashboardKpi
          label="Đã quá hạn"
          value={isLoading ? "--" : breached.length}
          sub="tickets"
          icon={<AlertTriangle className="size-3.5" />}
          accent={breached.length > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Đã xử lý"
          value={isLoading ? "--" : resolved.length}
          sub="tickets"
          icon={<CheckCircle className="size-3.5" />}
          accent="var(--ok)"
        />
        <DashboardKpi
          label="SLA met"
          value={isLoading ? "--" : slaText}
          hint={`${sla.breached} breach`}
          icon={<ShieldCheck className="size-3.5" />}
          accent={sla.breached > 0 ? "var(--p1)" : "var(--ok)"}
        />
        <DashboardKpi
          label="Thông báo mới"
          value={notifLoading ? "--" : unread}
          sub="chưa đọc"
          icon={<Bell className="size-3.5" />}
          accent={unread > 0 ? "var(--p3)" : undefined}
        />
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive shrink-0">
          Không thể tải dữ liệu Staff dashboard.
        </div>
      )}

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[1fr_1.25fr] gap-3 lg:flex-1 lg:min-h-0">
        {/* SLA gauge */}
        <DashboardPanel
          title="Tuân thủ SLA cá nhân"
          desc="met / (met + breach)"
          className="lg:col-span-3 min-h-55 lg:min-h-0"
        >
          {isLoading ? (
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

        {/* Ticket 7-day area */}
        <DashboardPanel
          title="Ticket · 7 ngày"
          desc="Ticket được giao theo ngày"
          className="lg:col-span-5 min-h-55 lg:min-h-0"
        >
          {isLoading ? (
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
                    id="fillStaffTickets"
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
                  fill="url(#fillStaffTickets)"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </DashboardPanel>

        {/* Status donut */}
        <DashboardPanel
          title="Trạng thái ticket"
          desc={`${totalTickets} ticket của tôi`}
          className="lg:col-span-4 min-h-55 lg:min-h-0"
        >
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : statusBuckets.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              Chưa có ticket nào.
            </div>
          ) : (
            <DashboardDonut
              data={statusBuckets}
              centerValue={totalTickets}
              centerLabel="tickets"
            />
          )}
        </DashboardPanel>

        {/* Priority tickets list */}
        <DashboardPanel
          title="Ưu tiên xử lý"
          desc="Sắp theo % SLA còn lại"
          className="lg:col-span-6 min-h-65 lg:min-h-0"
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
                <p className="mt-3 text-sm font-medium">
                  Không có ticket đang mở
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Các ticket được giao sẽ xuất hiện tại đây.
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

        {/* SLA risk donut */}
        <DashboardPanel
          title="Rủi ro SLA"
          desc="Trên ticket đang mở"
          className="lg:col-span-3 min-h-55 lg:min-h-0"
        >
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : riskData.length === 0 ? (
            <div className="h-full grid place-items-center text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="size-7 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Không có ticket mở
                </p>
              </div>
            </div>
          ) : (
            <DashboardDonut
              data={riskData}
              centerValue={openTickets.length}
              centerLabel="đang mở"
            />
          )}
        </DashboardPanel>

        {/* Notifications feed */}
        <DashboardPanel
          title="Thông báo gần đây"
          desc={`${unread} chưa đọc`}
          className="lg:col-span-3 min-h-55 lg:min-h-0"
          bodyClassName="overflow-y-auto"
        >
          {notifLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có thông báo.</p>
          ) : (
            <ol className="space-y-2">
              {notifications.map((n) => {
                const isUnread = n.status !== NotificationStatusEnum.Read;
                return (
                  <li key={n.id} className="flex gap-2 items-start">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background: isUnread
                          ? "var(--p3)"
                          : "var(--muted-foreground)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`text-xs truncate ${
                            isUnread ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="font-mono-num text-[10px] text-muted-foreground shrink-0">
                          {fmtDateTime(n.createdAt)}
                        </span>
                      </div>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground truncate">
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
      </div>
    </div>
  );
}
