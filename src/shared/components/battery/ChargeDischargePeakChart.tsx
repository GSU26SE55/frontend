import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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
import { useReadingAggregateHourly } from "@/shared/hooks/battery/useReadingAggregateHourly";
import { useThresholdByType } from "@/shared/hooks/battery/useThresholds";
import type {
  SensorReadingInterval,
  SensorReadingAggregateDto,
} from "@/shared/types/battery/sensor-reading-history.types";

const CHARGE_COLOR = "var(--chart-1)";
const DISCHARGE_COLOR = "var(--destructive)";

// The BE always returns min/max as POSITIVE for both directions (the direction is in the
// field name) → shares a single positive Y axis, no sign handling needed.
const chartConfig = {
  maxChargeCurrent: { label: "Charge peak (A)", color: CHARGE_COLOR },
  minChargeCurrent: { label: "Charge min (A)", color: CHARGE_COLOR },
  maxDischargeCurrent: { label: "Discharge peak (A)", color: DISCHARGE_COLOR },
  minDischargeCurrent: { label: "Discharge min (A)", color: DISCHARGE_COLOR },
} satisfies ChartConfig;

// ≤ 7 days → /aggregate (flexible interval). Longer → /aggregate/hourly
// (continuous aggregate, fixed 1h bucket, doesn't materialize every row).
const RANGES = {
  "24h": {
    label: "24 hours",
    hours: 24,
    interval: "1h" as SensorReadingInterval,
  },
  "7d": {
    label: "7 days",
    hours: 24 * 7,
    interval: "1h" as SensorReadingInterval,
  },
  "30d": { label: "30 days", days: 30 },
  "90d": { label: "90 days", days: 90 },
} as const;
type RangeKey = keyof typeof RANGES;

const isHourlyRange = (r: RangeKey) => "days" in RANGES[r];

// Manual legend (not Recharts' <Legend>) so it can convey both solid/dashed
// strokes — the 4 series differ only in color + stroke style, color alone isn't enough.
const LEGEND = [
  { color: CHARGE_COLOR, dashed: false, label: "Charge peak" },
  { color: CHARGE_COLOR, dashed: true, label: "Charge min" },
  { color: DISCHARGE_COLOR, dashed: false, label: "Discharge peak" },
  { color: DISCHARGE_COLOR, dashed: true, label: "Discharge min" },
] as const;

function LegendItem({
  color,
  dashed,
  label,
}: {
  color: string;
  dashed: boolean;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <svg width="14" height="2" className="shrink-0 overflow-visible">
        <line
          x1="0"
          y1="1"
          x2="14"
          y2="1"
          stroke={color}
          strokeWidth={dashed ? 1 : 2}
          strokeDasharray={dashed ? "3 3" : undefined}
        />
      </svg>
      {label}
    </span>
  );
}

const RANGE_ITEMS = (Object.keys(RANGES) as RangeKey[]).map((k) => ({
  value: k,
  label: RANGES[k].label,
}));

// A bucket with no samples for a direction → drop that direction's point (null) instead of
// plotting 0, since 0 means "measured 0A" while no samples means "unknown".
function buildChartData(items: SensorReadingAggregateDto[] | undefined) {
  return (items ?? []).map((d) => ({
    label: new Date(d.time).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
    }),
    maxChargeCurrent: d.chargeSampleCount > 0 ? d.maxChargeCurrent : null,
    minChargeCurrent: d.chargeSampleCount > 0 ? d.minChargeCurrent : null,
    maxDischargeCurrent:
      d.dischargeSampleCount > 0 ? d.maxDischargeCurrent : null,
    minDischargeCurrent:
      d.dischargeSampleCount > 0 ? d.minDischargeCurrent : null,
  }));
}

export default function ChargeDischargePeakChart({
  assetId,
  batteryTypeId,
}: {
  assetId: string;
  batteryTypeId?: string;
}) {
  const [range, setRange] = useState<RangeKey>("24h");
  const hourly = isHourlyRange(range);
  const cfg = RANGES[range];

  // Hooks can't be called conditionally → disable by passing an empty assetId (enabled: !!assetId).
  const shortQuery = useReadingAggregate(hourly ? "" : assetId, {
    hours: "hours" in cfg ? cfg.hours : 24,
    interval: "interval" in cfg ? cfg.interval : "1h",
  });
  const hourlyQuery = useReadingAggregateHourly(hourly ? assetId : "", {
    days: "days" in cfg ? cfg.days : 30,
  });

  const { data, isLoading } = hourly ? hourlyQuery : shortQuery;
  const { data: threshold } = useThresholdByType(batteryTypeId ?? "");
  const chartData = buildChartData(data);

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Charge/discharge peak (A)</CardTitle>
        <Select
          value={range}
          onValueChange={(v) => setRange(v as RangeKey)}
          items={RANGE_ITEMS}
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_ITEMS.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mb-3">
          {LEGEND.map((l) => (
            <LegendItem key={l.label} {...l} />
          ))}
          {(threshold?.currentMaxCharge != null ||
            threshold?.currentMaxDischarge != null) && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <svg width="14" height="2" className="shrink-0 overflow-visible">
                <line
                  x1="0"
                  y1="1"
                  x2="14"
                  y2="1"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="1 2"
                />
              </svg>
              Alert threshold
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
            No data in this time range
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[260px] w-full aspect-auto"
            initialDimension={{ width: 480, height: 260 }}
          >
            <LineChart
              data={chartData}
              margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
            >
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
              />
              {/* Admin-configured alert threshold — NOT the actual measured min/max.
                  Dotted "1 3" stroke to distinguish it from the min line (dashed "3 3" in the same color). */}
              {threshold?.currentMaxCharge != null && (
                <ReferenceLine
                  y={threshold.currentMaxCharge}
                  stroke={CHARGE_COLOR}
                  strokeDasharray="1 3"
                  strokeOpacity={0.7}
                  label={{
                    value: "Charge threshold",
                    position: "insideTopLeft",
                    fontSize: 9,
                    fill: CHARGE_COLOR,
                  }}
                />
              )}
              {threshold?.currentMaxDischarge != null && (
                <ReferenceLine
                  y={threshold.currentMaxDischarge}
                  stroke={DISCHARGE_COLOR}
                  strokeDasharray="1 3"
                  strokeOpacity={0.7}
                  label={{
                    value: "Discharge threshold",
                    position: "insideTopLeft",
                    fontSize: 9,
                    fill: DISCHARGE_COLOR,
                  }}
                />
              )}
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="maxChargeCurrent"
                stroke={CHARGE_COLOR}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="minChargeCurrent"
                stroke={CHARGE_COLOR}
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="maxDischargeCurrent"
                stroke={DISCHARGE_COLOR}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="minDischargeCurrent"
                stroke={DISCHARGE_COLOR}
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
