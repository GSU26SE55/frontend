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
  fillHeight?: boolean;
}

const RANGE_SELECT_ITEMS = (Object.keys(RANGES) as RangeKey[]).map((k) => ({
  value: k,
  label: RANGES[k].label,
}));

function ChartBody({
  isLoading,
  chartData,
  containerClassName,
  chartHeight,
}: {
  isLoading: boolean;
  chartData: ReturnType<typeof buildChartData>;
  containerClassName: string;
  chartHeight: number;
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
  const dotProps = isSparse ? { r: 4, strokeWidth: 2 } : false;

  return (
    <div className={`${containerClassName} flex flex-col`}>
      {isSparse && (
        <p className="text-[11px] text-muted-foreground text-center pb-1 shrink-0">
          Đang thu thập dữ liệu — hiển thị {chartData.length} điểm đo gần nhất
        </p>
      )}
      <ChartContainer
        config={chartConfig}
        className="flex-1 min-h-0 w-full aspect-auto"
        initialDimension={{ width: 640, height: chartHeight }}
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
          <YAxis width={36} tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            dataKey="avgVoltage"
            stroke="var(--color-avgVoltage)"
            dot={dotProps}
            strokeWidth={2}
            connectNulls
          />
          <Line
            dataKey="avgTemperature"
            stroke="var(--color-avgTemperature)"
            dot={dotProps}
            strokeWidth={2}
            connectNulls
          />
          <Line
            dataKey="avgSocPercent"
            stroke="var(--color-avgSocPercent)"
            dot={dotProps}
            strokeWidth={2}
            connectNulls
          />
          <Line
            dataKey="avgSohPercent"
            stroke="var(--color-avgSohPercent)"
            dot={dotProps}
            strokeWidth={2}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
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

export default function SensorChart({ assetId, fillHeight }: SensorChartProps) {
  const [range, setRange] = useState<RangeKey>("1h");
  const { hours, interval } = RANGES[range];
  const { data, isLoading } = useReadingAggregate(assetId, { hours, interval });
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
            chartHeight={400}
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
          containerClassName="h-60 w-full"
          chartHeight={240}
        />
      </CardContent>
    </Card>
  );
}
