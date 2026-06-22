import {
  MapPin,
  BatteryCharging,
  BellRing,
  Ticket,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DashboardKpi,
  DashboardPanel,
  DashboardDonut,
  DashboardGauge,
} from "@/shared/components/common/DashboardPanel";
import { useSiteList } from "@/features/admin/hooks/useSites";
import { useAlertList } from "@/shared/hooks/useAlerts";
import { useAdminTickets } from "@/features/admin/hooks/useAdminTickets";
import { useBatteryAssets } from "@/features/admin/hooks/useBatteryAssets";
import { useIncidentList } from "@/shared/hooks/useEnvironmentalIncidents";
import { useAdminAuditLogs } from "@/features/admin/hooks/useAdminAuditLogs";
import { useAdminAccountList } from "@/features/admin/hooks/useAdminAccounts";
import { SiteStatusEnum } from "@/shared/types/site.types";
import { AlertSeverityEnum, AlertStatusEnum } from "@/shared/enums/alert.enum";
import { BatteryStatusEnum } from "@/shared/enums/battery.enum";
import { EnvironmentalIncidentStatusEnum } from "@/shared/enums/environmental.enum";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { TicketHealthCard } from "@/features/admin/components/TicketHealthCard";
import { KEY } from "@/shared/utils/queryKeys";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  siteHealth,
  healthColor,
  summarizeSla,
  isOpenTicket,
  groupAlertsByDay,
} from "@/shared/utils/dashboard.utils";

/**
 * Admin = Trung tâm điều khiển: bao quát TOÀN hệ thống ở mức oversight —
 * hạ tầng (sites/pin), an toàn (cảnh báo/sự cố), vận hành (ticket/SLA tổng quan),
 * bảo mật & người dùng (audit log, tài khoản theo vai trò).
 * Chi tiết vận hành ticket (pipeline/triage/tải nhân sự) thuộc dashboard Manager.
 */

const alertChartConfig = {
  critical: { label: "Critical", color: "var(--destructive)" },
  warning: { label: "Warning", color: "var(--p3)" },
  info: { label: "Info", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const ANOMALY_LABEL: Record<number, string> = {
  1: "Quá nhiệt",
  2: "Quá áp",
  3: "Sụt áp",
  4: "SOC thấp",
  5: "Xả nhanh",
  6: "Sạc bất thường",
  7: "Mất kết nối",
  8: "Suy giảm SOH",
  9: "Nhiệt độ cao",
  10: "Độ ẩm cao",
  11: "Nhiệt-ẩm cao",
  12: "Nội trở cao",
  13: "Lệch cell",
  14: "Sự cố MT",
  15: "Sai lệch sensor",
};

const ROLE_COLOR: Record<string, string> = {
  Admin: "var(--p1)",
  Manager: "var(--chart-1)",
  Staff: "var(--p3)",
  Customer: "var(--ok)",
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

// "LoginFailedWrongPassword" → "Login Failed Wrong Password"
const humanize = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

export default function AdminDashboardPage() {
  const { data: siteData, isLoading: sitesLoading } = useSiteList({
    pageNumber: 1,
    pageSize: 100,
  });
  const { data: alertData, isLoading: alertsLoading } = useAlertList({
    pageNumber: 1,
    pageSize: 200,
  });
  const { data: ticketData, isLoading: ticketsLoading } = useAdminTickets({
    pageNumber: 1,
    pageSize: 200,
  });
  const { data: batteryData, isLoading: batteryLoading } = useBatteryAssets({
    pageNumber: 1,
    pageSize: 200,
  });
  const { data: incidentData } = useIncidentList({
    pageNumber: 1,
    pageSize: 200,
  });
  const { data: accountData, isLoading: accountsLoading } = useAdminAccountList(
    {
      pageNumber: 1,
      pageSize: 200,
    },
  );
  const { data: auditData, isLoading: auditLoading } = useAdminAuditLogs({
    pageNumber: 1,
    pageSize: 10,
  });

  // ── Sites ──
  const sites = siteData?.items ?? [];
  const totalSites = siteData?.totalItems ?? 0;
  const activeSites = sites.filter(
    (s) => s.status === SiteStatusEnum.Active,
  ).length;
  const totalBatt = sites.reduce((s, x) => s + x.batteryAssetCount, 0);
  const activeBatt = sites.reduce((s, x) => s + x.activeBatteryAssetCount, 0);
  const sitesH = sites.map((s) => ({ ...s, health: siteHealth(s) }));
  const avgHealth = sitesH.length
    ? Math.round(sitesH.reduce((a, s) => a + s.health, 0) / sitesH.length)
    : 0;

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
  const alertSeries = groupAlertsByDay(alerts, 7);

  const anomalyAgg = new Map<number, { count: number; maxSev: number }>();
  for (const a of alerts) {
    const cur = anomalyAgg.get(a.anomalyType) ?? { count: 0, maxSev: 0 };
    cur.count += 1;
    cur.maxSev = Math.max(cur.maxSev, a.severity);
    anomalyAgg.set(a.anomalyType, cur);
  }
  const anomalyData = [...anomalyAgg.entries()]
    .map(([type, v]) => ({
      label: ANOMALY_LABEL[type] ?? `Loại ${type}`,
      value: v.count,
      color:
        v.maxSev >= AlertSeverityEnum.Critical
          ? "var(--p1)"
          : v.maxSev === AlertSeverityEnum.Warning
            ? "var(--p3)"
            : "var(--muted-foreground)",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const anomalyMax = Math.max(1, ...anomalyData.map((d) => d.value));

  // ── Tickets (oversight: SLA + counts) ──
  const tickets = ticketData?.items ?? [];
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(isOpenTicket).length;
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

  // ── Batteries ──
  const batteries = batteryData?.items ?? [];
  const battByStatus = [
    {
      name: "Hoạt động",
      value: batteries.filter((b) => b.status === BatteryStatusEnum.Active)
        .length,
      fill: "var(--ok)",
    },
    {
      name: "Ngưng",
      value: batteries.filter((b) => b.status === BatteryStatusEnum.Inactive)
        .length,
      fill: "var(--p3)",
    },
    {
      name: "Ngừng vận hành",
      value: batteries.filter(
        (b) => b.status === BatteryStatusEnum.Decommissioned,
      ).length,
      fill: "var(--p1)",
    },
  ].filter((d) => d.value > 0);

  // ── Incidents ──
  const incidents = incidentData?.items ?? [];
  const activeIncidents = incidents.filter(
    (i) =>
      i.status === EnvironmentalIncidentStatusEnum.Open ||
      i.status === EnvironmentalIncidentStatusEnum.Acknowledged,
  ).length;

  // ── Accounts (users by role) ──
  const accounts = accountData?.items ?? [];
  const totalAccounts = accountData?.totalItems ?? accounts.length;
  const roleCounts = accounts.reduce<Record<string, number>>((acc, a) => {
    const r = a.role || "Khác";
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});
  const usersByRole = Object.entries(roleCounts).map(([name, value]) => ({
    name,
    value,
    fill: ROLE_COLOR[name] ?? "var(--muted-foreground)",
  }));

  // ── Audit ──
  const audits = auditData?.items ?? [];

  return (
    <div className="flex flex-col gap-3 p-3 lg:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            Admin · Trung tâm điều khiển hệ thống
          </p>
          <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
            {sitesLoading
              ? "Dashboard"
              : `Hạ tầng · ${totalSites} site · ${totalBatt} pin`}
          </h1>
        </div>
        <RefreshButton
          queryKeys={[
            KEY.sites,
            KEY.alerts,
            KEY.admin.tickets,
            KEY.batteryAssets,
            KEY.environmentalIncidents,
            KEY.admin.accounts,
            KEY.admin.auditLogs,
          ]}
          label="Đồng bộ"
        />
      </div>

      {/* ── KPI strip (bao quát 5 domain) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <DashboardKpi
          label="Sites"
          value={sitesLoading ? "--" : totalSites}
          hint={`${activeSites} hoạt động`}
          icon={<MapPin className="size-3.5" />}
        />
        <DashboardKpi
          label="Pin hoạt động"
          value={sitesLoading ? "--" : activeBatt}
          sub={`/${totalBatt}`}
          icon={<BatteryCharging className="size-3.5" />}
        />
        <DashboardKpi
          label="Cảnh báo mở"
          value={alertsLoading ? "--" : openAlerts}
          hint={`${criticalOpen} critical`}
          icon={<BellRing className="size-3.5" />}
          accent={criticalOpen > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Tickets mở"
          value={ticketsLoading ? "--" : openTickets}
          sub={`/${totalTickets}`}
          hint={`${sla.breached} breach`}
          icon={<Ticket className="size-3.5" />}
          accent={sla.breached > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Sự cố môi trường"
          value={activeIncidents}
          hint="đang mở"
          icon={<ShieldAlert className="size-3.5" />}
          accent={activeIncidents > 0 ? "var(--p1)" : undefined}
        />
        <DashboardKpi
          label="Người dùng"
          value={accountsLoading ? "--" : totalAccounts}
          hint={`${usersByRole.length} vai trò`}
          icon={<Users className="size-3.5" />}
        />
      </div>

      {/* ── Ticket Service Health ── */}
      <TicketHealthCard />

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[1.1fr_1fr] gap-3 lg:flex-1 lg:min-h-0">
        {/* Alerts 7-day — stacked area */}
        <DashboardPanel
          title="Cảnh báo 7 ngày"
          desc="Theo mức độ nghiêm trọng"
          className="lg:col-span-5 min-h-[240px] lg:min-h-0"
        >
          {alertsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer
              config={alertChartConfig}
              className="h-full w-full aspect-auto min-h-0"
            >
              <AreaChart
                data={alertSeries}
                margin={{ left: 0, right: 6, top: 4 }}
              >
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
                <ChartLegend content={<ChartLegendContent />} />
                <defs>
                  {(["critical", "warning", "info"] as const).map((k) => (
                    <linearGradient
                      key={k}
                      id={`alertFill-${k}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`var(--color-${k})`}
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${k})`}
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <Area
                  dataKey="critical"
                  type="monotone"
                  stackId="a"
                  stroke="var(--color-critical)"
                  fill="url(#alertFill-critical)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="warning"
                  type="monotone"
                  stackId="a"
                  stroke="var(--color-warning)"
                  fill="url(#alertFill-warning)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="info"
                  type="monotone"
                  stackId="a"
                  stroke="var(--color-info)"
                  fill="url(#alertFill-info)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </DashboardPanel>

        {/* Anomaly type — ranked list (màu theo severity) */}
        <DashboardPanel
          title="Cảnh báo theo loại"
          desc="Top loại · màu theo mức độ"
          className="lg:col-span-4 min-h-[240px] lg:min-h-0"
        >
          {alertsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : anomalyData.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              Chưa có cảnh báo.
            </div>
          ) : (
            <ul className="flex flex-col h-full justify-center gap-3">
              {anomalyData.map((d, i) => {
                const pct = Math.round((d.value / anomalyMax) * 100);
                return (
                  <li key={d.label} className="flex items-center gap-2.5">
                    <span className="w-3.5 shrink-0 text-right text-[10px] font-semibold font-mono-num text-muted-foreground/60">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ background: d.color }}
                          />
                          <span className="text-[12px] font-medium truncate">
                            {d.label}
                          </span>
                        </span>
                        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground shrink-0">
                          {d.value}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardPanel>

        {/* System SLA — gauge (oversight) */}
        <DashboardPanel
          title="Tuân thủ SLA hệ thống"
          desc={`${openTickets}/${totalTickets} ticket mở`}
          className="lg:col-span-3 min-h-[240px] lg:min-h-0"
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

        {/* Battery status — donut */}
        <DashboardPanel
          title="Pin theo trạng thái"
          desc={`${batteries.length} pin`}
          className="lg:col-span-3 min-h-[220px] lg:min-h-0"
        >
          {batteryLoading ? (
            <Skeleton className="h-full w-full" />
          ) : battByStatus.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              Chưa có pin.
            </div>
          ) : (
            <DashboardDonut
              data={battByStatus}
              centerValue={batteries.length}
              centerLabel="pin"
            />
          )}
        </DashboardPanel>

        {/* Users by role — donut */}
        <DashboardPanel
          title="Người dùng theo vai trò"
          desc={`${totalAccounts} tài khoản`}
          className="lg:col-span-3 min-h-[220px] lg:min-h-0"
        >
          {accountsLoading ? (
            <Skeleton className="h-full w-full" />
          ) : usersByRole.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              Chưa có tài khoản.
            </div>
          ) : (
            <DashboardDonut
              data={usersByRole}
              centerValue={accounts.length}
              centerLabel="users"
            />
          )}
        </DashboardPanel>

        {/* Site health list */}
        <DashboardPanel
          title="Sức khỏe site"
          desc={`Trung bình ${avgHealth}%`}
          className="lg:col-span-3 min-h-[220px] lg:min-h-0"
          bodyClassName="overflow-y-auto"
        >
          {sitesLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : sitesH.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có site nào.</p>
          ) : (
            <div className="space-y-2.5">
              {sitesH.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{s.name}</p>
                    <p className="text-[10.5px] text-muted-foreground tabular-nums">
                      {s.activeBatteryAssetCount}/{s.batteryAssetCount} pin
                    </p>
                  </div>
                  <div className="w-16 h-1.5 rounded-full bg-border shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.health}%`,
                        background: healthColor(s.health),
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold font-mono-num w-7 text-right shrink-0"
                    style={{ color: healthColor(s.health) }}
                  >
                    {s.health}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>

        {/* Audit log feed (security) */}
        <DashboardPanel
          title="Nhật ký hệ thống"
          desc="Audit log gần đây"
          className="lg:col-span-3 min-h-[220px] lg:min-h-0"
          bodyClassName="overflow-y-auto"
        >
          {auditLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ) : audits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>
          ) : (
            <ol className="space-y-0.5">
              {audits.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
                >
                  <span
                    className="mt-1 size-2 rounded-full shrink-0"
                    style={{
                      background: item.isSuccess ? "var(--ok)" : "var(--p1)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium truncate">
                        {item.targetEmail ?? "—"}
                      </span>
                      <span className="font-mono-num text-[10px] text-muted-foreground shrink-0">
                        {fmtDateTime(item.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 min-w-0">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9.5px] font-medium shrink-0 ${
                          item.isSuccess
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                        }`}
                      >
                        {humanize(item.actionName)}
                      </span>
                      {item.reason && (
                        <span className="text-[10.5px] text-muted-foreground truncate">
                          {item.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
