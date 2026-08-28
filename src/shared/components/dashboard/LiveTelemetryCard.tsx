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

const fmtNum = (v: number | null | undefined, dec = 1) =>
  v != null ? v.toFixed(dec) : "—";

// SSE connection status dot.
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
 * correct). Any missing field → falls back to the default thresholds below.
 */
export interface TelemetryThresholds {
  socWarning?: number | null;
  socCritical?: number | null;
  temperatureMax?: number | null; // ≥ max: danger; within [max-10, max): warning
}

// Default thresholds (when the BatteryType hasn't configured a ThresholdConfig) — keeps the old values.
const DEFAULT_SOC_WARN = 50;
const DEFAULT_SOC_CRIT = 20;
const DEFAULT_TEMP_MAX = 50;

interface LiveTelemetryCardProps {
  data: TelemetryDisplay | null;
  status?: SensorStreamState["status"];
  /** Thresholds from the BE's ThresholdConfig (per BatteryType). Omit → uses default thresholds. */
  thresholds?: TelemetryThresholds;
  /**
   * Rolling min/max charge/discharge for a window (SSE event `stats`). No event yet →
   * the "Peak" block still shows, just with numbers replaced by "—" instead of hiding
   * the whole block (avoids the UI going blank before SSE's first push or while the pack is idle).
   */
  stats?: LiveStatsDto | null;
}

/**
 * Card showing a single live telemetry reading (SSE) + connection status dot.
 * Used for the admin asset detail page (GH-114) and reused for the summary item (GH-116).
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
  // Temperature "warning" zone: 10°C before the danger threshold (keeps the old 40/50 two-tier logic).
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

  // status undefined → defaults to emerald when there's data (used where status isn't tracked).
  const dotCls = status ? DOT_CLS[status] : data ? DOT_CLS.live : null;

  const chargingMeta =
    data?.chargingState != null
      ? CHARGING_STATE_META[data.chargingState]
      : undefined;

  return (
    <div className="px-4 py-4 flex-1">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider">
          Realtime
        </p>
        {dotCls && (
          <span className={cn("size-1.5 rounded-full shrink-0", dotCls)} />
        )}
      </div>

      {!data ? (
        <p className="text-xs text-muted-foreground">No sensor data yet</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatTile
              label="Voltage"
              value={fmtNum(data.voltage)}
              unit="V"
              className="bg-muted/50 text-foreground"
            />
            <StatTile
              label="Current"
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
              label="Temperature"
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
              <span className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider">
                Peak {stats?.window === "today" ? "today" : "1 hour"}
              </span>
              <span className="text-3xs text-muted-foreground">
                {stats
                  ? `${stats.chargeSampleCount + stats.dischargeSampleCount} samples`
                  : "no data yet"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xs text-muted-foreground">Charge</span>
              <span className="text-3xs font-medium font-mono-num">
                {stats
                  ? `${fmtNum(stats.minChargeCurrent, 2)} – ${fmtNum(stats.maxChargeCurrent, 2)} A`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xs text-muted-foreground">Discharge</span>
              <span className="text-3xs font-medium font-mono-num">
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
