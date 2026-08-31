import { cn } from "@/lib/utils";
import type { LiveStatsDto } from "@/shared/types/battery/sensor-stream.types";
import { ChargingStateEnum } from "@/shared/enums/battery/battery.enum";
import {
  toneFill,
  toneVars,
  type StatusTone,
} from "@/shared/theme/statusColors";
import {
  socLevel,
  temperatureLevel,
  voltageLevel,
  currentLevel,
  type ThresholdLevel,
} from "@/shared/lib/thresholdTone";

// Display contract — identifies the metrics to display, NOT tied to a specific DTO.
// `LiveReadingDto` (SSE) and `BatteryAssetRealtimeDto` (REST snapshot) are both structurally
// assignable → the page passes `stream.reading ?? rt` straight through with no mapping. GH-116 passes the item summary.
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

// Colored border around the Current card based on charge/discharge state — reads
// ChargingStateEnum directly from the BMS, does NOT infer it from the current's
// sign (unlike the "Peak" block below, which uses maxCharge/maxDischarge already split by the BE).
const CHARGING_STATE_META: Record<number, { label: string; tone: StatusTone }> =
  {
    [ChargingStateEnum.IDLE]: { label: "Idle", tone: "muted" },
    [ChargingStateEnum.CHARGING]: { label: "Charging", tone: "ok" },
    [ChargingStateEnum.DISCHARGING]: { label: "Discharging", tone: "info" },
    [ChargingStateEnum.FLOAT]: { label: "Float", tone: "muted" },
    [ChargingStateEnum.BYPASS]: { label: "Bypass", tone: "p3" },
  };

// 2 chữ số thập phân — đúng bằng độ chính xác thật của dữ liệu (`numeric(x,2)`) và đúng bằng
// độ chính xác mà `thresholdTone` dùng để chấm màu. Hiển thị và logic khớp nhau thì con số trên
// màn hình luôn giải thích được màu của chính nó: 26.94 hiện "26.94" và đỏ khi trần là 26.90.
const fmtNum = (v: number | null | undefined, dec = 2) =>
  v != null ? v.toFixed(dec) : "—";

function StatTile({
  label,
  value,
  unit,
  className,
  style,
  title,
  horizontal,
}: {
  label: string;
  value: string;
  unit: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <div
        className={cn(
          "rounded-lg p-3 flex items-center justify-between",
          className,
        )}
        style={style}
        title={title}
      >
        <span className="text-base font-bold opacity-60">{label}</span>
        <div className="flex items-baseline gap-1 leading-none">
          <span className="text-2xl font-bold tabular-nums tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium opacity-60">{unit}</span>
          )}
        </div>
      </div>
    );
  }

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
      <span className="text-2xs opacity-60">{label}</span>
    </div>
  );
}

/**
 * Alert thresholds used to color telemetry. The page passes these down from the
 * BatteryType's ThresholdConfig (BE: GET /api/thresholds/by-type/{id}); the component does
 * NOT import types from features/admin (keeps the shared→feature dependency direction
 * correct). Missing field → the metric stays neutral, never a guessed default.
 */
export interface TelemetryThresholds {
  socWarning?: number | null;
  socCritical?: number | null;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  voltageMin?: number | null;
  voltageMax?: number | null;
  currentMaxCharge?: number | null;
  currentMaxDischarge?: number | null;
}

// Mức vi phạm → tone của card. "ok" giữ màu info (xanh) như cũ; chưa cấu hình ngưỡng → trung tính,
// KHÔNG bịa ngưỡng mặc định — cùng quy ước với bảng lịch sử và với BE (`AttachAnomaliesAsync`).
const NEUTRAL_CLS = "bg-muted/60 text-foreground";
const levelCls = (level: ThresholdLevel) =>
  level == null
    ? NEUTRAL_CLS
    : toneFill(level === "critical" ? "p1" : level === "warning" ? "p3" : "info");

interface LiveTelemetryCardProps {
  data: TelemetryDisplay | null;
  /** Thresholds from the BE's ThresholdConfig (per BatteryType). Omit → telemetry stays uncolored. */
  thresholds?: TelemetryThresholds;
  /**
   * Rolling min/max charge/discharge for a window (SSE event `stats`). No event yet →
   * the "Peak" block still shows, just with numbers replaced by "—" instead of hiding
   * the whole block (avoids the UI going blank before SSE's first push or while the pack is idle).
   */
  stats?: LiveStatsDto | null;
}

/**
 * Card showing a single live telemetry reading (SSE).
 * Used for the admin asset detail page (GH-114) and reused for the summary item (GH-116).
 */
export function LiveTelemetryCard({
  data,
  thresholds,
  stats,
}: LiveTelemetryCardProps) {
  // Voltage và Current cũng có luật cảnh báo ở BE (Overvoltage/Undervoltage, AbnormalCharging/
  // RapidDischarge) — trước đây hai ô này luôn trung tính, nên dòng sạc vượt trần vẫn hiện như
  // bình thường trong khi engine đã xếp Critical.
  const voltageCls =
    data?.voltage == null
      ? NEUTRAL_CLS
      : levelCls(
          voltageLevel(
            data.voltage,
            thresholds?.voltageMin,
            thresholds?.voltageMax,
          ),
        );

  const currentCls =
    data?.current == null
      ? NEUTRAL_CLS
      : levelCls(
          currentLevel(
            data.current,
            thresholds?.currentMaxCharge,
            thresholds?.currentMaxDischarge,
          ),
        );

  const socCls =
    data?.socPercent == null
      ? NEUTRAL_CLS
      : levelCls(
          socLevel(
            data.socPercent,
            thresholds?.socWarning,
            thresholds?.socCritical,
          ),
        );

  const tempCls =
    data?.temperature == null
      ? NEUTRAL_CLS
      : levelCls(
          temperatureLevel(
            data.temperature,
            thresholds?.temperatureMin,
            thresholds?.temperatureMax,
          ),
        );

  const chargingMeta =
    data?.chargingState != null
      ? CHARGING_STATE_META[data.chargingState]
      : undefined;

  return (
    <div className="px-4 py-4 flex-1">
      {!data ? (
        <p className="text-xs text-muted-foreground">No sensor data yet</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatTile
              label="Voltage"
              value={fmtNum(data.voltage)}
              unit="V"
              className={voltageCls}
            />
            <StatTile
              label="Current"
              value={fmtNum(data.current)}
              unit="A"
              className={cn(currentCls, chargingMeta && "border-2")}
              style={
                chargingMeta
                  ? { borderColor: toneVars(chargingMeta.tone).border }
                  : undefined
              }
              title={chargingMeta?.label}
            />
            <StatTile
              label="Temperature"
              value={fmtNum(data.temperature)}
              unit="°C"
              className={tempCls}
            />
            <StatTile
              label="SOC"
              value={fmtNum(data.socPercent)}
              unit="%"
              className={socCls}
            />
            <StatTile
              label="Cycles"
              value={data.cycleCount != null ? String(data.cycleCount) : "—"}
              unit=""
              className="bg-muted/50 text-foreground col-span-2"
              horizontal
            />
          </div>

          {/* Min/max charge/discharge within the window (SSE `stats`). Values are ALWAYS
              positive in both directions — the direction is in the field name. null = no
              sample yet for that window/direction. The block always shows (not hidden based
              on `stats`) to avoid the UI going blank before SSE's first push or while the
              pack is idle (neither charging nor discharging). */}
          <div className="rounded-lg bg-muted/50 px-3 py-2 mt-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Peak {stats?.window === "today" ? "today" : "1 hour"}
              </span>
              <span className="text-xs text-muted-foreground">
                {stats
                  ? `${stats.chargeSampleCount + stats.dischargeSampleCount} samples`
                  : "no data yet"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Charge</span>
              <span className="text-xs font-medium font-mono-num">
                {stats
                  ? `${fmtNum(stats.minChargeCurrent)} – ${fmtNum(stats.maxChargeCurrent)} A`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Discharge</span>
              <span className="text-xs font-medium font-mono-num">
                {stats
                  ? `${fmtNum(stats.minDischargeCurrent)} – ${fmtNum(stats.maxDischargeCurrent)} A`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
