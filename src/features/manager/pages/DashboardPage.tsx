import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useSiteList } from '@/features/manager/hooks/useSites';
import { SiteStatusEnum } from '@/shared/types/site.types';
import { RefreshCw, Download, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Clock } from 'lucide-react';

// ── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string; value: string | number; sub?: string;
  trend?: { dir: 'up' | 'down' | 'flat'; value: string; note: string };
  accent?: string;
}
function KpiCard({ label, value, sub, trend, accent }: KpiProps) {
  const trendColor = trend?.dir === 'up' ? 'var(--ok)' : trend?.dir === 'down' ? 'var(--p1)' : 'var(--muted-foreground)';
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        {accent && <span className="w-2 h-2 rounded-full" style={{ background: accent }} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {sub && <span className="text-xs text-muted-foreground font-mono-num">{sub}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: trendColor }}>
          {trend.dir === 'up' ? <TrendingUp size={11} /> : trend.dir === 'down' ? <TrendingDown size={11} /> : null}
          <span className="font-mono-num font-medium">{trend.value}</span>
          <span className="text-muted-foreground">· {trend.note}</span>
        </div>
      )}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-xl border border-border ${className}`} style={{ boxShadow: 'var(--shadow-sm)' }}>
      {children}
    </div>
  );
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, h = 48, color = 'var(--ok)' }: { data: number[]; h?: number; color?: string }) {
  const w = 300;
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / rng) * (h - 6) - 3).toFixed(1)}`);
  const d = `M${pts.join(' L')}`;
  const lastPt = pts[pts.length - 1].split(',');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity={0.08} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r={2.5} fill={color} />
    </svg>
  );
}

// ── Health color ──────────────────────────────────────────────────────────────
const hc = (h: number) => h >= 80 ? 'var(--ok)' : h >= 60 ? 'var(--p3)' : 'var(--p1)';

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSiteList({ pageNumber: 1, pageSize: 100 });

  const sites       = data?.items ?? [];
  const totalSites  = data?.totalItems ?? 0;
  const activeSites = sites.filter((s) => s.status === SiteStatusEnum.Active).length;
  const maintSites  = sites.filter((s) => s.status === SiteStatusEnum.UnderMaintenance).length;
  const decommSites = sites.filter((s) => s.status === SiteStatusEnum.Decommissioned).length;
  const totalBatt   = sites.reduce((s, x) => s + x.batteryAssetCount, 0);
  const activeBatt  = sites.reduce((s, x) => s + x.activeBatteryAssetCount, 0);

  const sitesH = sites.map((s) => ({
    ...s,
    health: s.batteryAssetCount > 0
      ? Math.round((s.activeBatteryAssetCount / s.batteryAssetCount) * 100)
      : 100,
  }));
  const atRisk = sitesH.filter((s) => s.health < 80);

  const statusPill = (status: number) => ({
    label: status === SiteStatusEnum.Active ? 'Hoạt động' : status === SiteStatusEnum.UnderMaintenance ? 'Bảo trì' : 'Ngừng',
    cls:   status === SiteStatusEnum.Active ? 'bg-emerald-100 text-emerald-700' : status === SiteStatusEnum.UnderMaintenance ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600',
  });

  const weeklyVol = [14, 18, 11, 22, 19, 25, 21];
  const weekDays  = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="p-6 space-y-6 max-w-[1440px]">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Manager · Tổng quan
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Điều phối vận hành</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan site, pin và tình trạng sức khỏe theo thời gian thực.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw size={14} /> Đồng bộ
          </button>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-3">
              <Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Sites theo dõi"   value={totalSites}  trend={{ dir: 'flat', value: `${activeSites}`, note: 'hoạt động' }} />
          <KpiCard label="Đang bảo trì"     value={maintSites}  accent={maintSites > 0 ? 'var(--p3)' : undefined}
            trend={{ dir: maintSites > 0 ? 'down' : 'flat', value: `${maintSites}`, note: 'sites' }} />
          <KpiCard label="SLA Compliance"   value="96.4%"  sub="30 ngày"     trend={{ dir: 'up',   value: '+1.2pp', note: 'tháng trước' }} accent="var(--ok)" />
          <KpiCard label="Avg Resolution"   value="16.4h"  sub="trung bình"  trend={{ dir: 'down', value: '−2.1h', note: 'tuần trước'  }} />
        </div>
      )}

      {/* ── Row 2: Status chart | Distribution ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0,1].map((i) => <div key={i} className="bg-card rounded-xl border border-border p-5"><Skeleton className="h-32 w-full" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Site status distribution */}
          <Card className="p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-sm font-semibold">Sites theo trạng thái</h3>
              <span className="text-xs text-muted-foreground">Tổng · {totalSites}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Hoạt động', value: activeSites, color: 'var(--ok)',  bg: 'bg-emerald-50' },
                { label: 'Bảo trì',   value: maintSites,  color: 'var(--p3)',  bg: 'bg-amber-50'   },
                { label: 'Ngừng',     value: decommSites, color: 'var(--p1)',  bg: 'bg-red-50'     },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
                  <div className="text-2xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Stacked bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-border gap-px">
              {[
                { v: activeSites, c: 'var(--ok)'  },
                { v: maintSites,  c: 'var(--p3)'  },
                { v: decommSites, c: 'var(--p1)'  },
              ].filter((x) => x.v > 0).map((s, i) => (
                <div key={i} style={{ flex: s.v, background: s.c }} />
              ))}
            </div>
          </Card>

          {/* Battery health summary */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Tổng hợp pin</h3>
            <div className="space-y-3">
              {[
                { icon: <CheckCircle size={15} />, label: 'Pin hoạt động',    value: activeBatt,           total: totalBatt,  color: 'var(--ok)' },
                { icon: <AlertCircle size={15} />, label: 'Pin không active', value: totalBatt - activeBatt, total: totalBatt, color: 'var(--p1)' },
                { icon: <Clock       size={15} />, label: 'Sites bảo trì',   value: maintSites,           total: totalSites, color: 'var(--p3)' },
              ].map((item) => {
                const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="shrink-0" style={{ color: item.color }}>{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[12.5px] mb-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="font-mono-num font-semibold" style={{ color: item.color }}>{item.value}/{item.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Row 3: At-risk table | Volume sparkline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* At-risk sites */}
        <div className="lg:col-span-3">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold">Sites cần chú ý</h3>
            <span className="text-xs text-muted-foreground">Sức khỏe &lt; 80% · {atRisk.length} site</span>
          </div>
          <Card>
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Site', 'Khách hàng', 'Pin', 'Sức khỏe', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {atRisk.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      <CheckCircle size={20} className="mx-auto mb-2 text-emerald-500" />
                      <span className="text-sm">Tất cả sites đang khỏe mạnh 🎉</span>
                    </td>
                  </tr>
                ) : (
                  atRisk.slice(0, 6).map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/manager/sites/${s.id}`)}
                    >
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.customerName}</td>
                      <td className="px-4 py-3 font-mono-num">{s.activeBatteryAssetCount}/{s.batteryAssetCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-border">
                            <div className="h-full rounded-full" style={{ width: `${s.health}%`, background: hc(s.health) }} />
                          </div>
                          <span className="font-mono-num font-semibold text-[11.5px]" style={{ color: hc(s.health) }}>{s.health}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors"
                          onClick={(e) => { e.stopPropagation(); navigate(`/manager/sites/${s.id}`); }}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Weekly sparkline */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Hoạt động 7 ngày</h3>
            <Card className="p-4">
              <Sparkline data={weeklyVol} h={52} color="var(--ok)" />
              <div className="flex justify-between mt-2 text-[10.5px] text-muted-foreground">
                {weekDays.map((d) => <span key={d}>{d}</span>)}
              </div>
            </Card>
          </div>

          {/* SLA metric */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">SLA · 30 ngày</div>
                <div className="text-2xl font-bold tracking-tight mt-1">96.4<span className="text-base text-muted-foreground font-normal">%</span></div>
              </div>
              <Sparkline data={[91, 93, 90, 95, 94, 96, 97, 96, 96.4]} h={40} color="var(--ok)" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-[12px]">
              <div><div className="text-muted-foreground">Avg resolution</div><div className="font-mono-num font-semibold mt-0.5">14h 32m</div></div>
              <div><div className="text-muted-foreground">CSAT</div><div className="font-mono-num font-semibold mt-0.5">4.71 / 5</div></div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Row 4: Sites grid ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Tất cả sites</h2>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors" onClick={() => navigate('/manager/sites')}>
            Xem tất cả →
          </button>
        </div>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-2">
                <Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /><Skeleton className="h-2 w-full mt-3" />
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
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                  onClick={() => navigate(`/manager/sites/${site.id}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-[13.5px]">{site.name}</p>
                      <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{site.customerName}</p>
                    </div>
                    <span className={`shrink-0 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${sp.cls}`}>{sp.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-3">
                    <span className="font-mono-num">{site.activeBatteryAssetCount}/{site.batteryAssetCount} pin</span>
                    {site.capacityKw != null && <span>· {site.capacityKw} kW</span>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10.5px] text-muted-foreground">Sức khỏe</span>
                      <span className="text-[11px] font-semibold font-mono-num" style={{ color: hc(site.health) }}>{site.health}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${site.health}%`, background: hc(site.health) }} />
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
