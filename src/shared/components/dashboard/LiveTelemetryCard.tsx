import { cn } from "@/lib/utils";
import type {
  SensorStreamState,
  LiveStatsDto,
} from "@/shared/types/battery/sensor-stream.types";
import { ChargingStateEnum } from "@/shared/enums/battery/battery.enum";
import {
  toneDot,
  toneFill,
  toneVars,
  type StatusTone,
} from "@/shared/theme/statusColors";

// Display contract — nhận diện các metric hiển thị, KHÔNG ràng buộc DTO cụ thể.
// `LiveReadingDto` (SSE) và `BatteryAssetRealtimeDto` (REST snapshot) đều structurally
// assignable → page truyền thẳng `stream.reading ?? rt` không cần map. GH-116 truyền item summary.
export interface TelemetryDisplay {
  time?: string | null;
  voltage?: number | null;
  current?: number | null;
  temperature?: number | null;
  socPercent?: number | null;
  sohPercent?: number | null;
  cycleCount?: number | null;
  chargingState?: number | null;
}

// Viền màu quanh card Dòng điện theo trạng thái sạc/xả — đọc thẳng
// ChargingStateEnum từ BMS, KHÔNG suy đoán từ dấu dòng điện (khác với khối
// "Đỉnh" bên dưới vốn dùng maxCharge/maxDischarge tách sẵn từ BE).
const CHARGING_STATE_META: Record<number, { label: string; tone: StatusTone }> = {
  [ChargingStateEnum.IDLE]: { label: "Nghỉ", tone: "muted" },
  [ChargingStateEnum.CHARGING]: { label: "Đang sạc", tone: "ok" },
  [ChargingStateEnum.DISCHARGING]: { label: "Đang xả", tone: "info" },
  [ChargingStateEnum.FLOAT]: { label: "Float", tone: "muted" },
  [ChargingStateEnum.BYPASS]: { label: "Bypass", tone: "p3" },
};

const fmtNum = (v: number | null | undefined, dec = 1) =>
  v != null ? v.toFixed(dec) : "—";

// Chấm trạng thái kết nối SSE.
const DOT_CLS: Record<SensorStreamState["status"], string> = {
  live: `${toneDot("ok")} animate-pulse`,
  connecting: `${toneDot("p3")} animate-pulse`,
  "open-idle": "bg-muted-foreground/40",
  error: toneDot("p1"),
  closed: "bg-muted-foreground/40",
};

function StatTile({
  label,
  value,
  unit,
  className,
  style,
  title,
}: {
  label: string;
  value: string;
  unit: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <div
      className={cn("rounded-lg p-3 flex flex-col gap-1", className)}
      style={style}
      title={title}
    >
      <div className="flex items-baseline gap-1 leading-none">
        <span className="text-2xl font-bold tabular-nums tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-medium opacity-60">{unit}</span>}
      </div>
      <span className="text-[11px] opacity-60">{label}</span>
    </div>
  );
}

/**
 * Ngưỡng cảnh báo cho tô màu telemetry. Page truyền xuống từ ThresholdConfig của
 * BatteryType (BE: GET /api/thresholds/by-type/{id}); component KHÔNG import type từ
 * features/admin (giữ đúng chiều phụ thuộc shared→feature). Field nào thiếu → fallback
 * ngưỡng mặc định bên dưới.
 */
export interface TelemetryThresholds {
  socWarning?: number | null;
  socCritical?: number | null;
  temperatureMax?: number | null; // ≥ max: nguy; trong khoảng [max-10, max): cảnh báo
}

// Ngưỡng mặc định (khi BatteryType chưa cấu hình ThresholdConfig) — giữ nguyên giá trị cũ.
const DEFAULT_SOC_WARN = 50;
const DEFAULT_SOC_CRIT = 20;
const DEFAULT_TEMP_MAX = 50;

interface LiveTelemetryCardProps {
  data: TelemetryDisplay | null;
  status?: SensorStreamState["status"];
  /** Ngưỡng từ ThresholdConfig BE (theo BatteryType). Bỏ trống → dùng ngưỡng mặc định. */
  thresholds?: TelemetryThresholds;
  /**
   * Rolling min/max nạp/xả của 1 window (SSE event `stats`). Chưa có event →
   * khối "Đỉnh" vẫn hiện, chỉ thay số bằng "—" thay vì ẩn cả khối (tránh UI
   * biến mất trắng khi SSE chưa kịp push lần đầu hoặc pack đang idle).
   */
  stats?: LiveStatsDto | null;
}

/**
 * Card hiển thị 1 reading telemetry live (SSE) + chấm trạng thái kết nối.
 * Dùng cho admin asset detail (GH-114) và reuse cho summary item (GH-116).
 */
export function LiveTelemetryCard({
  data,
  status,
  thresholds,
  stats,
}: LiveTelemetryCardProps) {
  const socWarn = thresholds?.socWarning ?? DEFAULT_SOC_WARN;
  const socCrit = thresholds?.socCritical ?? DEFAULT_SOC_CRIT;
  const tempMax = thresholds?.temperatureMax ?? DEFAULT_TEMP_MAX;
  // Vùng "cảnh báo" nhiệt: 10°C trước ngưỡng nguy hiểm (giữ nguyên logic 2 mức cũ 40/50).
  const tempWarn = tempMax - 10;

  const socCls =
    data?.socPercent == null
      ? "bg-muted/60 text-foreground"
      : data.socPercent >= socWarn
        ? toneFill("info")
        : data.socPercent >= socCrit
          ? toneFill("p3")
          : toneFill("p1");

  const tempCls =
    data?.temperature == null
      ? "bg-muted/60 text-foreground"
      : data.temperature < tempWarn
        ? toneFill("info")
        : data.temperature < tempMax
          ? toneFill("p3")
          : toneFill("p1");

  // status undefined → mặc định emerald khi có data (dùng cho nơi không track status).
  const dotCls = status ? DOT_CLS[status] : data ? DOT_CLS.live : null;

  const chargingMeta =
    data?.chargingState != null
      ? CHARGING_STATE_META[data.chargingState]
      : undefined;

  return (
    <div className="px-4 py-4 flex-1">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Realtime
        </p>
        {dotCls && (
          <span className={cn("size-1.5 rounded-full shrink-0", dotCls)} />
        )}
      </div>

      {!data ? (
        <p className="text-xs text-muted-foreground">Chưa có dữ liệu sensor</p>
      ) : (
        <div className="space-y-2">
          {data.time && (
            <p className="text-[10.5px] text-muted-foreground -mt-1 mb-2">
              {new Date(data.time).toLocaleString("vi-VN")}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <StatTile
              label="Điện áp"
              value={fmtNum(data.voltage)}
              unit="V"
              className="bg-muted/50 text-foreground"
            />
            <StatTile
              label="Dòng điện"
              value={fmtNum(data.current)}
              unit="A"
              className={cn(
                "bg-muted/50 text-foreground",
                chargingMeta && "border-2",
              )}
              style={
                chargingMeta
                  ? { borderColor: toneVars(chargingMeta.tone).border }
                  : undefined
              }
              title={chargingMeta?.label}
            />
            <StatTile
              label="Nhiệt độ"
              value={fmtNum(data.temperature)}
              unit="°C"
              className={tempCls}
            />
            <StatTile
              label="SOC"
              value={fmtNum(data.socPercent, 0)}
              unit="%"
              className={socCls}
            />
            <StatTile
              label="Chu kỳ"
              value={data.cycleCount != null ? String(data.cycleCount) : "—"}
              unit=""
              className="bg-muted/50 text-foreground col-span-2"
            />
          </div>

          {/* Min/max nạp-xả trong window (SSE `stats`). Giá trị LUÔN dương cả 2
              chiều — chiều nằm trong tên field. null = window/chiều chưa có mẫu.
              Khối luôn hiện (không ẩn theo `stats`) để tránh biến mất trắng khi
              SSE chưa push lần đầu hoặc pack đang idle không sạc không xả. */}
          <div className="rounded-lg bg-muted/50 px-3 py-2 mt-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Đỉnh {stats?.window === "today" ? "hôm nay" : "1 giờ"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {stats
                  ? `${stats.chargeSampleCount + stats.dischargeSampleCount} mẫu`
                  : "chưa có dữ liệu"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-muted-foreground">Nạp</span>
              <span className="text-[10.5px] font-medium font-mono-num">
                {stats
                  ? `${fmtNum(stats.minChargeCurrent, 2)} – ${fmtNum(stats.maxChargeCurrent, 2)} A`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-muted-foreground">Xả</span>
              <span className="text-[10.5px] font-medium font-mono-num">
                {stats
                  ? `${fmtNum(stats.minDischargeCurrent, 2)} – ${fmtNum(stats.maxDischargeCurrent, 2)} A`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
