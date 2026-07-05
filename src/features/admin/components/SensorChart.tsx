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
import { useReadingAggregate } from "@/features/admin/hooks/useReadingAggregate";
import { useThresholdByType } from "@/features/admin/hooks/useThresholds";
import type { SensorReadingInterval } from "@/features/admin/types/sensor-reading.types";
import type { ThresholdConfigDto } from "@/features/admin/types/threshold.types";

// Mỗi metric 1 mini chart riêng — đơn vị (V/A/°C/%) khác nhau quá xa nếu
// gộp chung 1 trục Y sẽ làm đường Điện áp gần như phẳng đáy, Dòng điện bị nén.
// Tách riêng để mỗi trục tự scale theo data của chính nó.
const METRICS = [
  { key: "avgVoltage", label: "Điện áp", unit: "V", color: "var(--chart-1)" },
  { key: "avgCurrent", label: "Dòng điện", unit: "A", color: "var(--chart-5)" },
  { key: "avgTemperature", label: "Nhiệt độ", unit: "°C", color: "var(--chart-2)" },
  { key: "avgSocPercent", label: "SOC", unit: "%", color: "var(--chart-3)" },
] as const;

const CHARGE_COLOR = "var(--chart-1)"; // dòng điện dương — đang sạc
const DISCHARGE_COLOR = "var(--destructive)"; // dòng điện âm — đang xả
const DANGER_ZONE_COLOR = "var(--destructive)"; // vùng ngoài ngưỡng an toàn

const chartConfig = METRICS.reduce<ChartConfig>((acc, m) => {
  acc[m.key] = { label: `${m.label} (${m.unit})`, color: m.color };
  return acc;
}, {}) satisfies ChartConfig;

// Range lớn → dùng /aggregate (TimescaleDB time_bucket), không dùng /history.
const RANGES = {
  "1h": {
    hours: 1,
    interval: "1m" as SensorReadingInterval,
    label: "1 giờ",
  },
  "24h": {
    hours: 24,
    interval: "1h" as SensorReadingInterval,
    label: "24 giờ",
  },
  "7d": {
    hours: 24 * 7,
    interval: "1h" as SensorReadingInterval,
    label: "7 ngày",
  },
  "30d": {
    hours: 24 * 30,
    interval: "1d" as SensorReadingInterval,
    label: "30 ngày",
  },
};
type RangeKey = keyof typeof RANGES;

interface SensorChartProps {
  assetId: string;
  batteryTypeId?: string;
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

// Cảm biến IoT thỉnh thoảng bắn 1 điểm nhiễu/spike bất thường (giả lập hoặc lỗi
// đọc). Nếu tính domain trực tiếp từ min/max thô, 1 điểm nhiễu đó kéo giãn cả
// trục Y làm toàn bộ chart bẹp dí. Lọc outlier bằng IQR (Tukey fence 1.5x)
// trước khi tính domain — điểm nhiễu vẫn được vẽ (bị cắt ở mép chart) nhưng
// không phá scale của các điểm còn lại.
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

// Domain neo theo vùng an toàn với tỉ lệ giãn CỐ ĐỊNH (25% độ rộng vùng an
// toàn mỗi bên) thay vì co theo min/max dữ liệu thô — nếu không, khi dữ liệu
// dao động sát ngưỡng, vùng đỏ có thể phình to chiếm gần nửa chart trông rất
// mất cân đối. Chỉ giãn thêm khi dữ liệu (đã lọc outlier) thực sự vượt xa
// khung này, để không cắt mất phần vượt ngưỡng đáng kể.
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

// Recipe chuẩn của Recharts để tô 2 màu khác nhau trên cùng 1 Area tại điểm
// cắt y=0 (dương/sạc vs âm/xả) — offset là vị trí % (0-1) của điểm y=0 trong
// domain ĐÃ RENDER (low/high sau khi tính robust ở computeDomain), không phải
// min/max thô — nếu không điểm cắt màu sẽ lệch khỏi vị trí y=0 thật trên trục.
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
  threshold?: ThresholdConfigDto;
}) {
  const values = numericValues(chartData, metric.key);
  const isCurrent = metric.key === "avgCurrent";

  const safeRange =
    metric.key === "avgVoltage" && threshold
      ? { min: threshold.voltageMin, max: threshold.voltageMax }
      : metric.key === "avgTemperature" && threshold
        ? { min: threshold.temperatureMin, max: threshold.temperatureMax }
        : metric.key === "avgCurrent" &&
            threshold &&
            threshold.currentMaxDischarge != null &&
            threshold.currentMaxCharge != null
          ? {
              min: -threshold.currentMaxDischarge,
              max: threshold.currentMaxCharge,
            }
          : null;

  const isSoc = metric.key === "avgSocPercent";
  const [low, high]: [number, number] = isSoc
    ? [0, 100]
    : safeRange
      ? computeSafeZoneDomain(values, safeRange)
      : computeAutoDomain(values);
  const axisDomain: [number, number] = [low, high];
  const dangerZone = safeRange
    ? { low, high, min: safeRange.min, max: safeRange.max }
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
              Sạc
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: DISCHARGE_COLOR }}
              />
              Xả (A)
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
        {dangerZone && (
          <span className="text-[10px] text-muted-foreground/70 shrink-0">
            An toàn: {dangerZone.min}–{dangerZone.max}
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
                  <stop offset={zeroOffset} stopColor={CHARGE_COLOR} stopOpacity={1} />
                  <stop offset={zeroOffset} stopColor={DISCHARGE_COLOR} stopOpacity={1} />
                </linearGradient>
                <linearGradient id={splitFillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset={zeroOffset} stopColor={CHARGE_COLOR} stopOpacity={0.3} />
                  <stop offset={zeroOffset} stopColor={DISCHARGE_COLOR} stopOpacity={0.3} />
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
          {dangerZone && (
            <>
              <ReferenceArea
                y1={dangerZone.low}
                y2={dangerZone.min}
                fill={DANGER_ZONE_COLOR}
                fillOpacity={0.1}
                strokeOpacity={0}
              />
              <ReferenceArea
                y1={dangerZone.max}
                y2={dangerZone.high}
                fill={DANGER_ZONE_COLOR}
                fillOpacity={0.1}
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
  threshold?: ThresholdConfigDto;
}) {
  if (isLoading) {
    return (
      <div
        className={`${containerClassName} flex items-center justify-center text-sm text-muted-foreground`}
      >
        Đang tải...
      </div>
    );
  }
  if (chartData.length === 0) {
    return (
      <div
        className={`${containerClassName} flex items-center justify-center text-sm text-muted-foreground`}
      >
        Chưa có dữ liệu trong khoảng thời gian này
      </div>
    );
  }

  const isSparse = chartData.length <= 5;
  const dotProps = isSparse ? { r: 3, strokeWidth: 2 } : false;

  return (
    <div className={`${containerClassName} flex flex-col`}>
      {isSparse && (
        <p className="text-[11px] text-muted-foreground text-center pb-1 shrink-0">
          Đang thu thập dữ liệu — hiển thị {chartData.length} điểm đo gần nhất
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
        ? date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
        : date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } else {
      label = date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    }
    return { ...d, label };
  });
}

export default function SensorChart({
  assetId,
  batteryTypeId,
  fillHeight,
}: SensorChartProps) {
  const [range, setRange] = useState<RangeKey>("1h");
  const { hours, interval } = RANGES[range];
  const { data, isLoading } = useReadingAggregate(assetId, { hours, interval });
  const { data: threshold } = useThresholdByType(batteryTypeId ?? "");
  const chartData = buildChartData(data, hours);

  const rangeSelect = (
    <Select
      value={range}
      items={RANGE_SELECT_ITEMS}
      onValueChange={(v) => setRange(v as RangeKey)}
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
  );

  if (fillHeight) {
    return (
      <div className="flex flex-col h-full px-5 py-4">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <span className="text-sm font-medium">Biểu đồ cảm biến</span>
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
        <CardTitle className="text-base">Biểu đồ cảm biến</CardTitle>
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
