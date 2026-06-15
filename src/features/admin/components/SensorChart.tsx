import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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
import type { SensorReadingInterval } from "@/features/admin/types/sensor-reading.types";

const chartConfig = {
  avgVoltage: { label: "Điện áp (V)", color: "var(--chart-1)" },
  avgTemperature: { label: "Nhiệt độ (°C)", color: "var(--chart-2)" },
  avgSocPercent: { label: "SOC (%)", color: "var(--chart-3)" },
  avgSohPercent: { label: "SOH (%)", color: "var(--chart-4)" },
} satisfies ChartConfig;

// Range lớn → dùng /aggregate (TimescaleDB time_bucket), không dùng /history.
const RANGES = {
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
}

export default function SensorChart({ assetId }: SensorChartProps) {
  const [range, setRange] = useState<RangeKey>("24h");
  const { hours, interval } = RANGES[range];

  const { data, isLoading } = useReadingAggregate(assetId, { hours, interval });

  const chartData = (data ?? []).map((d) => ({
    ...d,
    label: new Date(d.time).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Biểu đồ cảm biến</CardTitle>
        <Select
          value={range}
          items={(Object.keys(RANGES) as RangeKey[]).map((k) => ({
            value: k,
            label: RANGES[k].label,
          }))}
          onValueChange={(v) => setRange(v as RangeKey)}
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGES) as RangeKey[]).map((k) => (
              <SelectItem key={k} value={k}>
                {RANGES[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
            Chưa có dữ liệu trong khoảng thời gian này
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[240px] w-full aspect-auto"
            initialDimension={{ width: 640, height: 240 }}
          >
            <LineChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                width={36}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="avgVoltage"
                stroke="var(--color-avgVoltage)"
                dot={false}
                strokeWidth={2}
              />
              <Line
                dataKey="avgTemperature"
                stroke="var(--color-avgTemperature)"
                dot={false}
                strokeWidth={2}
              />
              <Line
                dataKey="avgSocPercent"
                stroke="var(--color-avgSocPercent)"
                dot={false}
                strokeWidth={2}
              />
              <Line
                dataKey="avgSohPercent"
                stroke="var(--color-avgSohPercent)"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
