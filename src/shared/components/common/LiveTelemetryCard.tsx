import { cn } from "@/lib/utils";
import type { SensorStreamState } from "@/shared/types/sensor-stream.types";

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

// Charging state labels (display-only, value 1..5) — định nghĩa nội bộ để shared
// component KHÔNG import enum từ features/admin (giữ đúng chiều phụ thuộc).
const CHARGING_LABELS: Record<number, string> = {
  1: "Nghỉ",
  2: "Đang nạp",
  3: "Đang xả",
  4: "Float",
  5: "Bypass",
};

const fmtNum = (v: number | null | undefined, dec = 1) =>
  v != null ? v.toFixed(dec) : "—";

// Chấm trạng thái kết nối SSE.
const DOT_CLS: Record<SensorStreamState["status"], string> = {
  live: "bg-emerald-500 animate-pulse",
  connecting: "bg-amber-500 animate-pulse",
  "open-idle": "bg-muted-foreground/40",
  error: "bg-red-500",
  closed: "bg-muted-foreground/40",
};

function StatTile({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: string;
  unit: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg p-3 flex flex-col gap-1", className)}>
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
}

/**
 * Card hiển thị 1 reading telemetry live (SSE) + chấm trạng thái kết nối.
 * Dùng cho admin asset detail (GH-114) và reuse cho summary item (GH-116).
 */
export function LiveTelemetryCard({
  data,
  status,
  thresholds,
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
        ? "bg-blue-50 text-blue-800"
        : data.socPercent >= socCrit
          ? "bg-amber-50 text-amber-800"
          : "bg-red-50 text-red-700";

  const tempCls =
    data?.temperature == null
      ? "bg-muted/60 text-foreground"
      : data.temperature < tempWarn
        ? "bg-sky-50 text-sky-800"
        : data.temperature < tempMax
          ? "bg-amber-50 text-amber-800"
          : "bg-red-50 text-red-700";

  // status undefined → mặc định emerald khi có data (dùng cho nơi không track status).
  const dotCls = status ? DOT_CLS[status] : data ? DOT_CLS.live : null;

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
              className="bg-muted/50 text-foreground"
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

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 mt-1">
            <span className="text-[10.5px] text-muted-foreground">
              Nạp / Xả
            </span>
            <span className="text-[10.5px] font-medium">
              {data.chargingState != null
                ? (CHARGING_LABELS[data.chargingState] ??
                  `#${data.chargingState}`)
                : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
