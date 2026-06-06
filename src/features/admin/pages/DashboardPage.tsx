import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteList } from "@/features/admin/hooks/useSites";
import { SiteStatusEnum } from "@/shared/types/site.types";
import {
  RefreshCw,
  Plus,
  Users,
  Battery,
  MapPin,
  Settings,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";

// ── KPI Card ────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { dir: "up" | "down" | "flat"; value: string; note: string };
  accent?: string;
}
function KpiCard({ label, value, sub, trend, accent }: KpiProps) {
  const trendColor =
    trend?.dir === "up"
      ? "var(--ok)"
      : trend?.dir === "down"
        ? "var(--p1)"
        : "var(--muted-foreground)";
  return (
    <div
      className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {accent && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: accent }}
          />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </span>
        {sub && (
          <span className="text-xs text-muted-foreground font-mono-num">
            {sub}
          </span>
        )}
      </div>
      {trend && (
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: trendColor }}
        >
          {trend.dir === "up" ? (
            <TrendingUp size={11} />
          ) : trend.dir === "down" ? (
            <TrendingDown size={11} />
          ) : null}
          <span className="font-mono-num font-medium">{trend.value}</span>
          <span className="text-muted-foreground">· {trend.note}</span>
        </div>
      )}
    </div>
  );
}

// ── Card shell ───────────────────────────────────────────────────────────────
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card rounded-xl border border-border ${className}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {children}
    </div>
  );
}

// ── Alert bar chart (5 weeks × 3 types) ─────────────────────────────────────
const WEEKS = ["T17", "T18", "T19", "T20", "T21"];
const ALERT_DATA = [
  { crit: 12, warn: 24, info: 18 },
  { crit: 8, warn: 21, info: 22 },
  { crit: 15, warn: 19, info: 16 },
  { crit: 6, warn: 14, info: 19 },
  { crit: 9, warn: 17, info: 21 },
];
function AlertsChart() {
  const W = 560,
    H = 160,
    maxV = 28;
  const bw = 22,
    gap = 3,
    grpGap = 20;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Cảnh báo theo tuần</h3>
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          {[
            { c: "var(--p1)", l: "Critical" },
            { c: "var(--p3)", l: "Warning" },
            { c: "var(--border-strong)", l: "Info" },
          ].map((x) => (
            <span key={x.l} className="flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-sm"
                style={{ background: x.c }}
              />
              {x.l}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        {[0.33, 0.67, 1].map((g, i) => (
          <line
            key={i}
            x1={0}
            x2={W}
            y1={H - 14 - g * (H - 26)}
            y2={H - 14 - g * (H - 26)}
            stroke="var(--border)"
            strokeDasharray="2 3"
          />
        ))}
        {ALERT_DATA.map((d, i) => {
          const bars = [
            { v: d.crit, c: "var(--p1)" },
            { v: d.warn, c: "var(--p3)" },
            { v: d.info, c: "var(--border-strong)" },
          ];
          const grpW = bw * 3 + gap * 2;
          const x = 10 + i * (grpW + grpGap);
          return (
            <g key={i}>
              {bars.map((b, j) => {
                const bh = (b.v / maxV) * (H - 26);
                return (
                  <rect
                    key={j}
                    x={x + j * (bw + gap)}
                    y={H - 14 - bh}
                    width={bw}
                    height={bh}
                    fill={b.c}
                    rx={2}
                    opacity={j === 2 ? 0.45 : 0.85}
                  />
                );
              })}
              <text
                x={x + grpW / 2}
                y={H - 1}
                textAnchor="middle"
                fontSize="9.5"
                fill="var(--muted-foreground)"
                fontFamily="ui-monospace, monospace"
              >
                {WEEKS[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Health color helper ──────────────────────────────────────────────────────
const hc = (h: number) =>
  h >= 80 ? "var(--ok)" : h >= 60 ? "var(--p3)" : "var(--p1)";

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSiteList({ pageNumber: 1, pageSize: 100 });

  const sites = data?.items ?? [];
  const totalSites = data?.totalItems ?? 0;
  const activeSites = sites.filter(
    (s) => s.status === SiteStatusEnum.Active,
  ).length;
  const totalBatt = sites.reduce((s, x) => s + x.batteryAssetCount, 0);
  const activeBatt = sites.reduce((s, x) => s + x.activeBatteryAssetCount, 0);

  const sitesH = sites.map((s) => ({
    ...s,
    health:
      s.batteryAssetCount > 0
        ? Math.round((s.activeBatteryAssetCount / s.batteryAssetCount) * 100)
        : 100,
  }));

  const statusPill = (status: number) => ({
    label:
      status === SiteStatusEnum.Active
        ? "Hoạt động"
        : status === SiteStatusEnum.UnderMaintenance
          ? "Bảo trì"
          : "Ngừng",
    cls:
      status === SiteStatusEnum.Active
        ? "bg-emerald-100 text-emerald-700"
        : status === SiteStatusEnum.UnderMaintenance
          ? "bg-amber-100 text-amber-700"
          : "bg-red-100 text-red-600",
  });

  return (
    <div className="p-6 space-y-6 max-w-[1440px]">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Admin · Tổng quan hệ thống
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isLoading ? "Dashboard" : `Solar System · ${totalSites} site`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan hạ tầng pin, người dùng và sức khỏe vận hành.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw size={14} /> Đồng bộ
          </button>
          <button
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            onClick={() => navigate("/admin/battery-assets")}
          >
            <Plus size={14} /> Tạo asset
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-5 space-y-3"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="Total Sites"
            value={totalSites}
            sub="sites"
            trend={{
              dir: "up",
              value: `${activeSites}`,
              note: "đang hoạt động",
            }}
          />
          <KpiCard
            label="Active Batteries"
            value={activeBatt}
            sub={`/${totalBatt}`}
            trend={{ dir: "up", value: `+${activeBatt}`, note: "online" }}
            accent="var(--ok)"
          />
          <KpiCard
            label="Cần theo dõi"
            value={totalBatt - activeBatt}
            sub="pin"
            trend={{
              dir: totalBatt - activeBatt > 0 ? "down" : "flat",
              value: `${totalBatt - activeBatt}`,
              note: "inactive",
            }}
            accent={totalBatt - activeBatt > 0 ? "var(--p1)" : undefined}
          />
          <KpiCard
            label="SLA Compliance"
            value="96.4%"
            sub="30 ngày"
            trend={{ dir: "up", value: "+1.2pp", note: "tháng trước" }}
            accent="var(--ok)"
          />
        </div>
      )}

      {/* ── Row 2: Alerts chart | Site health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-5">
          <AlertsChart />
        </Card>
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold mb-4">Sức khỏe site</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : sitesH.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có site nào.</p>
          ) : (
            <div className="space-y-3">
              {sitesH.map((s) => (
                <button
                  key={s.id}
                  className="flex items-center gap-3 w-full text-left group"
                  onClick={() => navigate(`/admin/sites/${s.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium truncate group-hover:text-emerald-600 transition-colors">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.batteryAssetCount} pin
                      {s.capacityKw != null ? ` · ${s.capacityKw} kW` : ""}
                    </p>
                  </div>
                  <div className="w-24 h-1.5 rounded-full bg-border shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.health}%`,
                        background: hc(s.health),
                      }}
                    />
                  </div>
                  <span
                    className="text-[11.5px] font-semibold font-mono-num w-8 text-right shrink-0"
                    style={{ color: hc(s.health) }}
                  >
                    {s.health}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 3: Recent activity | Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audit timeline */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Hoạt động gần đây</h3>
          <ol className="space-y-4">
            {[
              {
                action: "BATTERY.ASSIGN",
                target: "SN-B0042",
                actor: "Phan Quốc Hùng",
                note: "Gán pin cho site ST-003",
                ok: true,
                dt: "21/05 · 14:32",
              },
              {
                action: "SITE.UPDATE",
                target: "ST-001",
                actor: "Phan Quốc Hùng",
                note: "Cập nhật capacity → 450 kW",
                ok: true,
                dt: "21/05 · 11:10",
              },
              {
                action: "THRESHOLD.SET",
                target: "BT-LFP-01",
                actor: "Admin",
                note: "Nhiệt độ max 47°C",
                ok: true,
                dt: "20/05 · 09:48",
              },
              {
                action: "USER.CREATE",
                target: "U-412",
                actor: "Admin",
                note: "Mời Staff mới — Nguyễn Văn B",
                ok: true,
                dt: "19/05 · 16:00",
              },
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="mt-[3px] w-2 h-2 rounded-full shrink-0"
                  style={{ background: item.ok ? "var(--ok)" : "var(--p1)" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm">
                      <span className="font-mono-num text-[11px] text-muted-foreground">
                        {item.action}
                      </span>
                      {" · "}
                      <span className="font-medium">{item.target}</span>
                    </span>
                    <span className="font-mono-num text-[11px] text-muted-foreground shrink-0">
                      {item.dt}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">
                    {item.note}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                    {item.actor}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Quick actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <Users size={16} />,
                title: "Tạo user mới",
                sub: "Email + role + invite",
                path: "/admin/accounts",
              },
              {
                icon: <Battery size={16} />,
                title: "Đăng ký battery",
                sub: "Asset + serial + site",
                path: "/admin/battery-assets",
              },
              {
                icon: <MapPin size={16} />,
                title: "Tạo site",
                sub: "Vị trí, công suất",
                path: "/admin/sites",
              },
              {
                icon: <Settings size={16} />,
                title: "Cấu hình ngưỡng",
                sub: "Per battery type",
                path: "/admin/battery-assets",
              },
            ].map((x, i) => (
              <button
                key={i}
                onClick={() => navigate(x.path)}
                className="flex flex-col gap-2 p-4 rounded-lg border border-border text-left hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
              >
                <span className="text-muted-foreground group-hover:text-emerald-600 transition-colors">
                  {x.icon}
                </span>
                <div>
                  <div className="text-[13px] font-semibold">{x.title}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {x.sub}
                  </div>
                </div>
                <ExternalLink
                  size={12}
                  className="self-end text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors"
                />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 4: Sites grid ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Tất cả sites</h2>
          <button
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            onClick={() => navigate("/admin/sites")}
          >
            Xem tất cả →
          </button>
        </div>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-4 space-y-2"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full mt-3" />
              </div>
            ))}
          </div>
        ) : sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có site nào.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sitesH.slice(0, 9).map((site) => {
              const sp = statusPill(site.status);
              return (
                <button
                  key={site.id}
                  className="bg-card rounded-xl border border-border text-left p-4 hover:border-emerald-300 hover:shadow-md transition-all"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                  onClick={() => navigate(`/admin/sites/${site.id}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-[13.5px]">
                        {site.name}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                        {site.customerName}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${sp.cls}`}
                    >
                      {sp.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-3">
                    <span className="font-mono-num">
                      {site.activeBatteryAssetCount}/{site.batteryAssetCount}{" "}
                      pin
                    </span>
                    {site.capacityKw != null && (
                      <span>· {site.capacityKw} kW</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10.5px] text-muted-foreground">
                        Sức khỏe
                      </span>
                      <span
                        className="text-[11px] font-semibold font-mono-num"
                        style={{ color: hc(site.health) }}
                      >
                        {site.health}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${site.health}%`,
                          background: hc(site.health),
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
