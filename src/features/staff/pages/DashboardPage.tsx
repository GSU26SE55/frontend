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
import { NotificationStatusEnum } from "@/shared/enums/notification/notification.enum";
import { useStaffTickets } from "@/features/staff/hooks/ticket/useStaffTickets";
import { useStaffTicketDashboardStats } from "@/shared/hooks/dashboard/useDashboardStats";
import { useStaffNotifications } from "@/features/staff/hooks/notification/useStaffNotifications";
import { useUnreadCount } from "@/shared/hooks/notifications/useNotifications";
import { TicketCard } from "@/features/staff/components/ticket/TicketCard";
import { isOpenTicket } from "@/shared/utils/ticket.utils";
import { OVERVIEW_PANELS } from "@/shared/constants/overviewPanels";

/**
 * Staff = BÀN LÀM VIỆC CÁ NHÂN: ticket được giao, rủi ro SLA, thông báo.
 *
 * KHÔNG hiển thị xu hướng 7 ngày / thống kê toàn hệ thống — Staff hành động
 * trên từng ticket, biểu đồ xu hướng là công cụ quản trị của Manager/Admin.
 *
 * Layout: 1 KHUNG CỐ ĐỊNH, trang không cuộn. Lưới 3 cột × 2 hàng; danh sách
 * ticket và thông báo tự cuộn BÊN TRONG panel.
 *
 * Mỗi panel một dạng khác nhau (danh sách thẻ / gauge / donut / bar ngang /
 * dòng thời gian) để phân biệt loại thông tin ngay từ hình dạng.
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

  // Màu + gauge do SlaGaugePanel lo (dùng chung với Manager), ở đây chỉ cần
  // chuỗi % cho ô KPI.
  const sla = staffStats?.sla;
  const slaText = sla ? `${sla.compliancePercent}%` : "—";

  // ── Trạng thái ticket — bar ngang (donut đã dùng cho rủi ro SLA, tránh 2 donut) ──
  const statusCounts = staffStats?.countByStatus ?? {};
  const totalTickets = Object.values(statusCounts).reduce((a, b) => a + b, 0);
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
    { name: "Nâng cấp", value: statusCounts.Escalated ?? 0, fill: "var(--p1)" },
    {
      name: "Hoàn tất",
      value:
        (statusCounts.Resolved ?? 0) +
        (statusCounts.ClosedPendingRate ?? 0) +
        (statusCounts.Closed ?? 0),
      fill: "var(--ok)",
    },
  ]
    .filter((b) => b.value > 0)
    .reverse(); // Recharts layout=vertical vẽ phần tử đầu ở DƯỚI cùng

  // ── SLA risk donut (B.slaRisk) ──
  const riskData = [
    {
      name: "An toàn",
      value: staffStats?.slaRisk.healthy ?? 0,
      fill: "var(--ok)",
    },
    {
      name: "Sắp breach",
      value: staffStats?.slaRisk.near ?? 0,
      fill: "var(--p3)",
    },
    {
      name: "Đã breach",
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
    <div className="h-full min-h-0 flex flex-col gap-3 p-3 lg:p-4 overflow-hidden">
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
          queryKeys={[
            KEY.staffTickets,
            KEY.staffTicketDashboard,
            KEY.notifications,
            ["staff", "notifications"],
          ]}
          label="Làm mới"
        />
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <DashboardKpi
          label="Đang phụ trách"
          value={statsLoading ? "--" : openCount}
          sub="tickets"
          icon={<FileText className="size-3.5" />}
        />
        <DashboardKpi
          label="Sắp breach"
          value={statsLoading ? "--" : nearBreach}
          sub="≤ 25%"
          icon={<Clock className="size-3.5" />}
          accent={nearBreach > 0 ? "var(--p3)" : undefined}
        />
        <DashboardKpi
          label="Đã quá hạn"
          value={statsLoading ? "--" : breachedCount}
          sub="tickets"
          icon={<AlertTriangle className="size-3.5" />}
          accent={breachedCount > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Đã xử lý"
          value={statsLoading ? "--" : resolvedCount}
          sub="tickets"
          icon={<CheckCircle className="size-3.5" />}
          accent="var(--ok)"
        />
        <DashboardKpi
          label="SLA met"
          value={statsLoading ? "--" : slaText}
          hint={`${sla?.breached ?? 0} breach`}
          icon={<ShieldCheck className="size-3.5" />}
          accent={(sla?.breached ?? 0) > 0 ? "var(--p1)" : "var(--ok)"}
        />
        <DashboardKpi
          label="Thông báo mới"
          value={unreadLoading ? "--" : unread}
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

      {/* ── Bento cố định 3×2, KHÔNG cuộn trang ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-3 overflow-hidden">
        {/* [Danh sách thẻ] bề mặt làm việc chính */}
        <DashboardPanel
          title={OVERVIEW_PANELS.staff.priority}
          desc="Sắp theo % SLA còn lại"
          className="lg:col-span-2 min-h-0"
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

        {/* [Gauge] tỉ lệ tuân thủ SLA cá nhân */}
        <SlaGaugePanel
          title={OVERVIEW_PANELS.staff.personalSla}
          desc="met / (met + breach)"
          sla={sla}
          isLoading={statsLoading}
          className="min-h-0"
        />

        {/* [Donut] cơ cấu rủi ro trên ticket đang mở */}
        {showRisk && (
          <DashboardPanel
            title={OVERVIEW_PANELS.staff.slaRisk}
            desc="Trên ticket đang mở"
            className="min-h-0"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DashboardDonut
                data={riskData}
                centerValue={openCount}
                centerLabel="đang mở"
              />
            )}
          </DashboardPanel>
        )}

        {/* [Bar ngang] so sánh số lượng theo trạng thái */}
        {showStatus && (
          <DashboardPanel
            title={OVERVIEW_PANELS.staff.ticketStatus}
            desc={`${totalTickets} ticket của tôi`}
            className="min-h-0"
          >
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ChartContainer
                config={statusBarConfig}
                className="h-full w-full aspect-auto min-h-0"
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
                    width={78}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10.5 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" radius={4} maxBarSize={16}>
                    {statusBuckets.map((b) => (
                      <Cell key={b.name} fill={b.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </DashboardPanel>
        )}

        {/* [Dòng thời gian] thông báo gần đây */}
        {showNotifs && (
          <DashboardPanel
            title={OVERVIEW_PANELS.staff.recentNotifications}
            desc={`${unread} chưa đọc`}
            className="min-h-0"
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
        )}
      </div>
    </div>
  );
}
