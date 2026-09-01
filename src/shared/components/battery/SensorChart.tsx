import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReadingAggregate } from "@/shared/hooks/battery/useReadingAggregate";
import { useThresholdByType } from "@/shared/hooks/battery/useThresholds";
import { Button } from "@/components/ui/button";
import type { SensorReadingInterval } from "@/shared/types/battery/sensor-reading-history.types";
import type { ThresholdConfigDto } from "@/shared/types/battery/threshold.types";

// Each metric gets its own mini chart — the units (V/A/°C/%) differ too much to share
// a single Y axis: Voltage would look nearly flat while Current gets squashed.
// Splitting them lets each axis auto-scale to its own data.
const METRICS = [
  { key: "avgVoltage", label: "Voltage", unit: "V", color: "var(--chart-1)" },
  { key: "avgCurrent", label: "Current", unit: "A", color: "var(--chart-5)" },
  {
    key: "avgTemperature",
    label: "Temperature",
    unit: "°C",
    color: "var(--chart-2)",
  },
  { key: "avgSocPercent", label: "SOC", unit: "%", color: "var(--chart-3)" },
] as const;

const CHARGE_COLOR = "var(--chart-1)"; // positive current — charging
const DISCHARGE_COLOR = "var(--destructive)"; // negative current — discharging
const CRITICAL_ZONE_COLOR = "var(--destructive)"; // đã chạm mốc Critical
const WARNING_ZONE_COLOR = "var(--p3)"; // đã chạm mốc Warning, chưa tới Critical

const chartConfig = METRICS.reduce<ChartConfig>((acc, m) => {
  acc[m.key] = { label: `${m.label} (${m.unit})`, color: m.color };
  return acc;
}, {}) satisfies ChartConfig;

// Large ranges → use /aggregate (TimescaleDB time_bucket), not /history.
const RANGES = {
  "1h": {
    hours: 1,
    interval: "1m" as SensorReadingInterval,
    label: "1 hour",
  },
  "24h": {
    hours: 24,
    interval: "1h" as SensorReadingInterval,
    label: "24 hours",
  },
  "7d": {
    hours: 24 * 7,
    interval: "1h" as SensorReadingInterval,
    label: "7 days",
  },
  "30d": {
    hours: 24 * 30,
    interval: "1d" as SensorReadingInterval,
    label: "30 days",
  },
};
type RangeKey = keyof typeof RANGES;

interface SensorChartProps {
  assetId: string;
  batteryTypeId?: string;
  /** Explicit window (ISO) from a ticket link — overrides the preset range while set. */
  from?: string;
  to?: string;
  onClearRange?: () => void;
  fillHeight?: boolean;
}

const RANGE_SELECT_ITEMS = (Object.keys(RANGES) as RangeKey[]).map((k) => ({
  value: k,
  label: RANGES[k].label,
}));

function numericValues(
  chartData: ReturnType<typeof buildChartData>,
  key: (typeof METRICS)[number]["key"],
): number[] {
  return chartData
    .map((d) => d[key])
    .filter((v): v is number => typeof v === "number");
}

// The IoT sensor occasionally emits a noisy/abnormal spike (simulated or a read
// error). Computing the domain directly from raw min/max lets that one spike
// stretch the whole Y axis flat. Filter outliers with IQR (1.5x Tukey fence)
// before computing the domain — the noisy point is still plotted (clipped at
// the chart edge) but doesn't distort the scale for the rest of the points.
function dropOutliers(values: number[]): number[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
  const q1 = q(0.25);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  if (iqr === 0) return values;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  const filtered = values.filter((v) => v >= lo && v <= hi);
  return filtered.length > 0 ? filtered : values;
}

function computeAutoDomain(values: number[]): [number, number] {
  const cleaned = dropOutliers(values);
  if (cleaned.length === 0) return [0, 1];
  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);
  const pad = (max - min) * 0.1 || Math.abs(max) * 0.1 || 1;
  return [min - pad, max + pad];
}

// The domain is anchored to the safe zone with a FIXED expansion ratio (25% of the safe
// zone's width on each side) rather than shrinking to the raw data min/max — otherwise,
// when the data hovers near the threshold, the red zone can balloon to nearly half the
// chart and look very unbalanced. Only expand further when the (outlier-filtered) data
// genuinely goes well beyond this frame, so a meaningful breach isn't clipped off.
function computeSafeZoneDomain(
  values: number[],
  safeRange: { min: number; max: number },
): [number, number] {
  const span = safeRange.max - safeRange.min || 1;
  const pad = span * 0.25;
  let low = safeRange.min - pad;
  let high = safeRange.max + pad;
  const cleaned = dropOutliers(values);
  if (cleaned.length > 0) {
    const buffer = span * 0.05;
    low = Math.min(low, Math.min(...cleaned) - buffer);
    high = Math.max(high, Math.max(...cleaned) + buffer);
  }
  return [low, high];
}

function formatAxisNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  const decimals = Math.abs(value) < 10 ? 1 : 0;
  return Number(value.toFixed(decimals)).toLocaleString("vi-VN");
}

// Standard Recharts recipe for painting 2 different colors on a single Area at the
// y=0 crossing (positive/charge vs negative/discharge) — the offset is the % position
// (0-1) of the y=0 point within the RENDERED domain (low/high after the robust
// computeDomain), not the raw min/max — otherwise the color split would drift away
// from the real y=0 position on the axis.
function zeroCrossingOffset(low: number, high: number): number {
  if (high <= 0) return 0;
  if (low >= 0) return 1;
  return high / (high - low);
}

function MetricMiniChart({
  metric,
  chartData,
  dotProps,
  threshold,
}: {
  metric: (typeof METRICS)[number];
  chartData: ReturnType<typeof buildChartData>;
  dotProps: { r: number; strokeWidth: number } | false;
  threshold?: ThresholdConfigDto | null;
}) {
  const values = numericValues(chartData, metric.key);
  const isCurrent = metric.key === "avgCurrent";

  // Hai mốc Admin đặt, vẽ thành BA vùng: dưới Warning để trống (an toàn), Warning→Critical tô
  // vàng, từ Critical trở lên tô đỏ. Trước đây chart chỉ biết "dải an toàn" rồi tô đỏ cả hai phía
  // ngoài — nhưng min/max nay là Warning/Critical cùng một chiều, nên tô như cũ là bôi đỏ đúng
  // vùng mà engine cảnh báo chỉ coi là Warning.
  //
  // `warn`/`crit` là hai mốc theo chiều vi phạm; `descending` cho SOC (thấp mới là vi phạm).
  const bounds: { warn: number; crit: number; descending: boolean } | null =
    metric.key === "avgVoltage" && threshold
      ? {
          warn: threshold.voltageMin,
          crit: threshold.voltageMax,
          descending: false,
        }
      : metric.key === "avgTemperature" && threshold
        ? {
            warn: threshold.temperatureMin,
            crit: threshold.temperatureMax,
            descending: false,
          }
        : metric.key === "avgSocPercent" && threshold
          ? {
              warn: threshold.socWarningThreshold,
              crit: threshold.socCriticalThreshold,
              descending: true,
            }
          : null;

  // Dòng điện là ngoại lệ: chỉ có MỘT trần mỗi chiều nên không có nấc Warning — giữ nguyên kiểu
  // dải, ra ngoài là đỏ.
  const currentBand =
    metric.key === "avgCurrent" &&
    threshold &&
    threshold.currentMaxDischarge != null &&
    threshold.currentMaxCharge != null
      ? { min: -threshold.currentMaxDischarge, max: threshold.currentMaxCharge }
      : null;

  const safeRange =
    currentBand ??
    (bounds
      ? {
          min: Math.min(bounds.warn, bounds.crit),
          max: Math.max(bounds.warn, bounds.crit),
        }
      : null);

  const isSoc = metric.key === "avgSocPercent";
  const [low, high]: [number, number] = isSoc
    ? [0, 100]
    : safeRange
      ? computeSafeZoneDomain(values, safeRange)
      : computeAutoDomain(values);
  const axisDomain: [number, number] = [low, high];
  // Nhãn góc phải: nói rõ hai mốc thay vì "Safe: a–b", vì a–b nay KHÔNG phải vùng an toàn.
  const zoneLabel = currentBand
    ? `Safe: ${currentBand.min}–${currentBand.max}`
    : bounds
      ? `Warn ${bounds.warn} · Crit ${bounds.crit}`
      : null;

  const gradientId = `sensor-gradient-${metric.key}`;
  const splitStrokeId = `sensor-split-stroke-${metric.key}`;
  const splitFillId = `sensor-split-fill-${metric.key}`;
  const zeroOffset = isCurrent ? zeroCrossingOffset(low, high) : 0;

  return (
    <div className="flex flex-col rounded-lg border border-border/60 bg-card/40 p-3 min-h-0">
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        {isCurrent ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: CHARGE_COLOR }}
              />
              Charge
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: DISCHARGE_COLOR }}
              />
              Discharge (A)
            </span>
          </div>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: metric.color }}
            />
            {metric.label} ({metric.unit})
          </span>
        )}
        {zoneLabel && (
          <span className="text-3xs text-muted-foreground/70 shrink-0">
            {zoneLabel}
            {metric.unit}
          </span>
        )}
      </div>
      <ChartContainer
        config={chartConfig}
        className="flex-1 min-h-0 w-full aspect-auto"
        initialDimension={{ width: 320, height: 160 }}
      >
        <AreaChart
          data={chartData}
          margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={metric.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={metric.color} stopOpacity={0.02} />
            </linearGradient>
            {isCurrent && (
              <>
                <linearGradient id={splitStrokeId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset={zeroOffset}
                    stopColor={CHARGE_COLOR}
                    stopOpacity={1}
                  />
                  <stop
                    offset={zeroOffset}
                    stopColor={DISCHARGE_COLOR}
                    stopOpacity={1}
                  />
                </linearGradient>
                <linearGradient id={splitFillId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset={zeroOffset}
                    stopColor={CHARGE_COLOR}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset={zeroOffset}
                    stopColor={DISCHARGE_COLOR}
                    stopOpacity={0.3}
                  />
                </linearGradient>
              </>
            )}
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            minTickGap={40}
            fontSize={10}
          />
          <YAxis
            width={34}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            fontSize={10}
            domain={axisDomain}
            ticks={isSoc ? [0, 25, 50, 75, 100] : undefined}
            tickCount={5}
            tickFormatter={formatAxisNumber}
          />
          {currentBand && (
            <>
              <ReferenceArea
                y1={low}
                y2={currentBand.min}
                fill={CRITICAL_ZONE_COLOR}
                fillOpacity={0.1}
                strokeOpacity={0}
              />
              <ReferenceArea
                y1={currentBand.max}
                y2={high}
                fill={CRITICAL_ZONE_COLOR}
                fillOpacity={0.1}
                strokeOpacity={0}
              />
            </>
          )}
          {bounds && (
            <>
              <ReferenceArea
                y1={bounds.warn}
                y2={bounds.crit}
                fill={WARNING_ZONE_COLOR}
                fillOpacity={0.14}
                strokeOpacity={0}
              />
              <ReferenceArea
                y1={bounds.crit}
                y2={bounds.descending ? low : high}
                fill={CRITICAL_ZONE_COLOR}
                fillOpacity={0.12}
                strokeOpacity={0}
              />
            </>
          )}
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            type="monotone"
            dataKey={metric.key}
            stroke={isCurrent ? `url(#${splitStrokeId})` : metric.color}
            fill={isCurrent ? `url(#${splitFillId})` : `url(#${gradientId})`}
            strokeWidth={2}
            dot={dotProps}
            connectNulls
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function ChartBody({
  isLoading,
  chartData,
  containerClassName,
  threshold,
}: {
  isLoading: boolean;
  chartData: ReturnType<typeof buildChartData>;
  containerClassName: string;
  threshold?: ThresholdConfigDto | null;
}) {
  if (isLoading) {
    return (
      <div
        className={`${containerClassName} flex items-center justify-center text-sm text-muted-foreground`}
      >
        Loading...
      </div>
    );
  }
  if (chartData.length === 0) {
    return (
      <div
        className={`${containerClassName} flex items-center justify-center text-sm text-muted-foreground`}
      >
        No data in this time range
      </div>
    );
  }

  const isSparse = chartData.length <= 5;
  const dotProps = isSparse ? { r: 3, strokeWidth: 2 } : false;

  return (
    <div className={`${containerClassName} flex flex-col`}>
      {isSparse && (
        <p className="text-2xs text-muted-foreground text-center pb-1 shrink-0">
          Collecting data — showing the {chartData.length} most recent readings
        </p>
      )}
      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {METRICS.map((metric) => (
          <MetricMiniChart
            key={metric.key}
            metric={metric}
            chartData={chartData}
            dotProps={dotProps}
            threshold={threshold}
          />
        ))}
      </div>
    </div>
  );
}

function buildChartData(
  data: ReturnType<typeof useReadingAggregate>["data"],
  hours: number,
) {
  const items = data ?? [];
  return items.map((d, i) => {
    const date = new Date(d.time);
    let label: string;
    if (hours <= 1) {
      const prev = i > 0 ? new Date(items[i - 1].time) : null;
      const dayChanged = prev !== null && prev.getDate() !== date.getDate();
      label = dayChanged
        ? date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } else {
      label = date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return { ...d, label };
  });
}

export default function SensorChart({
  assetId,
  batteryTypeId,
  from,
  to,
  onClearRange,
  fillHeight,
}: SensorChartProps) {
  const [range, setRange] = useState<RangeKey>("1h");
  const pinned = !!from || !!to;
  const { hours, interval } = RANGES[range];

  // Span the axis is drawn over. A pinned window is measured from its own endpoints, not from
  // the preset — using `hours` there would stretch a ±2' window across a 1-hour axis and bunch
  // every point into one corner.
  const spanHours =
    pinned && from && to
      ? Math.max(
          (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000,
          1 / 60,
        )
      : hours;

  const { data, isLoading } = useReadingAggregate(assetId, {
    hours,
    // A few minutes of data needs minute buckets; the preset's coarser interval would flatten
    // the window into a single point.
    interval: pinned ? "1m" : interval,
    from,
    to,
  });
  const { data: threshold } = useThresholdByType(batteryTypeId ?? "");
  const chartData = buildChartData(data, spanHours);

  const rangeSelect = (
    <div className="flex items-center gap-2">
      {/* Disabled rather than hidden while pinned, so the control doesn't vanish and reappear
          as the reader clears the range. */}
      <Select
        value={range}
        items={RANGE_SELECT_ITEMS}
        onValueChange={(v) => setRange(v as RangeKey)}
        disabled={pinned}
      >
        <SelectTrigger size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGE_SELECT_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pinned && onClearRange ? (
        <Button variant="ghost" size="sm" onClick={onClearRange}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );

  if (fillHeight) {
    return (
      <div className="flex flex-col h-full px-5 py-4">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <span className="text-sm font-medium">Sensor chart</span>
          {rangeSelect}
        </div>
        <div className="flex-1 min-h-0">
          <ChartBody
            isLoading={isLoading}
            chartData={chartData}
            containerClassName="h-full w-full"
            threshold={threshold}
          />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Sensor chart</CardTitle>
        {rangeSelect}
      </CardHeader>
      <CardContent>
        <ChartBody
          isLoading={isLoading}
          chartData={chartData}
          containerClassName="h-[320px] w-full"
          threshold={threshold}
        />
      </CardContent>
    </Card>
  );
}
