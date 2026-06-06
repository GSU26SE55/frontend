import {
  BookOpen,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Award,
  FileText,
  Zap,
} from "lucide-react";

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span
          style={{ color: accent ?? "var(--muted-foreground)", opacity: 0.7 }}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-3xl font-bold tracking-tight"
          style={{ color: accent ?? "inherit" }}
        >
          {value}
        </span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

// ── Empty ticket card ─────────────────────────────────────────────────────────
function EmptyTickets() {
  return (
    <div
      className="bg-card rounded-xl border border-border p-10 flex flex-col items-center gap-3 text-center"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <CheckCircle size={32} className="text-emerald-500" />
      <div className="text-sm font-semibold text-foreground">
        Không có ticket đang mở
      </div>
      <div className="text-[12px] text-muted-foreground">
        Tất cả đã được xử lý — nghỉ ngơi một chút.
      </div>
    </div>
  );
}

// ── Schedule item ─────────────────────────────────────────────────────────────
const SCHEDULE = [
  {
    title: "Họp giao ban miền Nam",
    detail: "Phòng 4B · Tòa nhà Sunaria",
    time: "09:30",
    color: "var(--info)",
  },
  {
    title: "Đi site ST-002 · BMS check",
    detail: "Xe công ty 51A-882.21",
    time: "11:00",
    color: "var(--p2)",
  },
  {
    title: "Đo SOH Cụm A · ST-001",
    detail: "Theo TK-2026-0422",
    time: "14:00",
    color: "var(--muted-foreground)",
  },
  {
    title: "Tổng kết log + báo cáo",
    detail: "Văn phòng",
    time: "16:30",
    color: "var(--muted-foreground)",
  },
];

// ── Sparkline SVG ──────────────────────────────────────────────────────────────
function Sparkline({
  data,
  h = 44,
  color = "var(--ok)",
}: {
  data: number[];
  h?: number;
  color?: string;
}) {
  const w = 280;
  if (data.length < 2) return null;
  const min = Math.min(...data),
    max = Math.max(...data),
    rng = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map(
    (v, i) =>
      `${(i * step).toFixed(1)},${(h - ((v - min) / rng) * (h - 6) - 3).toFixed(1)}`,
  );
  const d = `M${pts.join(" L")}`;
  const lastPt = pts[pts.length - 1].split(",");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity={0.08} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPt[0]} cy={lastPt[1]} r={2.5} fill={color} />
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StaffDashboardPage() {
  const today = new Date();

  // Stats — will come from ticket API when available
  const myTickets = 0;
  const nearBreach = 0;
  const overdue = 0;
  const resolved = 6;

  return (
    <div className="p-6 space-y-6 max-w-[1440px]">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Staff · Bảng làm việc
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Phiên làm việc hôm nay
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sắp xếp theo SLA còn lại — ticket cần xử lý sớm nhất ở trên cùng.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            <BookOpen size={14} /> Knowledge Base
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Đang phụ trách"
          value={myTickets}
          sub="tickets"
          icon={<FileText size={16} />}
        />
        <KpiCard
          label="Sắp breach SLA"
          value={nearBreach}
          sub="≥ 67% used"
          accent={nearBreach > 0 ? "var(--p3)" : undefined}
          icon={<Clock size={16} />}
        />
        <KpiCard
          label="Đã quá hạn"
          value={overdue}
          sub="ưu tiên xử lý"
          accent={overdue > 0 ? "var(--p1)" : undefined}
          icon={<AlertTriangle size={16} />}
        />
        <KpiCard
          label="Hoàn thành tuần này"
          value={resolved}
          sub="tickets"
          accent="var(--ok)"
          icon={<CheckCircle size={16} />}
        />
      </div>

      {/* ── Main content row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Ticket queue */}
        <div className="lg:col-span-3">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">Hàng đợi của tôi</h2>
            <span className="text-xs text-muted-foreground">
              {myTickets} ticket · cập nhật mỗi giây
            </span>
          </div>
          {myTickets === 0 ? (
            <EmptyTickets />
          ) : (
            <div className="space-y-2">
              {/* Ticket cards would be rendered here when ticket data is available */}
            </div>
          )}

          {/* Coming soon banner */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Zap size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-blue-800">
                Ticket management đang được triển khai
              </div>
              <div className="text-[12px] text-blue-600 mt-0.5">
                Danh sách ticket của bạn sẽ hiển thị ở đây với SLA countdown
                realtime sau khi TicketService được kết nối.
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Today's schedule */}
          <div>
            <h2 className="text-base font-semibold mb-3">Lịch hôm nay</h2>
            <div
              className="bg-card rounded-xl border border-border overflow-hidden"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                <div>
                  <div className="text-[11px] text-muted-foreground capitalize">
                    {today.toLocaleDateString("vi-VN", { weekday: "long" })}
                  </div>
                  <div className="text-xl font-bold tracking-tight">
                    {today.getDate()} ·{" "}
                    {String(today.getMonth() + 1).padStart(2, "0")} ·{" "}
                    {today.getFullYear()}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono-num">
                  Tuần {Math.ceil(today.getDate() / 7)}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {SCHEDULE.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="relative shrink-0 flex flex-col items-center">
                      <span
                        className="w-2.5 h-2.5 rounded-full border-2 mt-[3px]"
                        style={{ borderColor: item.color, background: "white" }}
                      />
                      {i < SCHEDULE.length - 1 && (
                        <span
                          className="w-px flex-1 mt-1"
                          style={{ background: "var(--border)", minHeight: 16 }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12.5px] font-medium">
                          {item.title}
                        </span>
                        <span className="text-[11px] font-mono-num text-muted-foreground shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance card */}
          <div>
            <h2 className="text-base font-semibold mb-3">Hiệu suất tháng</h2>
            <div
              className="bg-card rounded-xl border border-border p-4"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    SLA Compliance · 30 ngày
                  </div>
                  <div className="text-2xl font-bold tracking-tight mt-1">
                    96.4
                    <span className="text-base font-normal text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <Sparkline
                  data={[
                    91, 93, 90, 95, 94, 96, 97, 95, 96, 98, 96, 97, 96, 96.4,
                  ]}
                  h={44}
                  color="var(--ok)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-[12px]">
                <div>
                  <div className="text-muted-foreground">Avg resolution</div>
                  <div className="font-mono-num font-semibold mt-0.5">
                    14h 32m
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">CSAT</div>
                  <div className="font-mono-num font-semibold mt-0.5">
                    4.8 / 5.0
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Wiki đóng góp</div>
                  <div className="font-mono-num font-semibold mt-0.5">
                    11 bài
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Escalations</div>
                  <div className="font-mono-num font-semibold mt-0.5">
                    2 lần
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div>
        <h2 className="text-base font-semibold mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <Clock size={18} />,
              label: "SLA Monitor",
              sub: "Đồng hồ realtime",
              path: "/staff/sla",
              color:
                "text-amber-600  bg-amber-50  border-amber-200 hover:bg-amber-100",
            },
            {
              icon: <BookOpen size={18} />,
              label: "Knowledge Base",
              sub: "Quy trình kỹ thuật",
              path: "/staff/wiki",
              color:
                "text-blue-600   bg-blue-50   border-blue-200  hover:bg-blue-100",
            },
            {
              icon: <Award size={18} />,
              label: "Hiệu suất",
              sub: "SLA & CSAT cá nhân",
              path: "/staff/dashboard",
              color:
                "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100",
            },
            {
              icon: <AlertTriangle size={18} />,
              label: "Alerts",
              sub: "Cảnh báo hệ thống",
              path: "/staff/alerts",
              color:
                "text-red-600    bg-red-50    border-red-200   hover:bg-red-100",
            },
          ].map((x, i) => (
            <button
              key={i}
              className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-colors ${x.color}`}
            >
              {x.icon}
              <div>
                <div className="text-[13px] font-semibold">{x.label}</div>
                <div className="text-[11.5px] opacity-70">{x.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
