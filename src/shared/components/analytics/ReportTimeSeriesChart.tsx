import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  connectNulls?: boolean;
}

interface ReportTimeSeriesChartProps {
  data: unknown[] | undefined;
  series: ChartSeries[];
  xKey?: string; // defaults to "date"
  xFormat?: string; // date-fns pattern, defaults to "dd/MM"
  isLoading?: boolean;
  emptyText?: string;
}

const safeFormat = (value: unknown, pattern: string): string => {
  if (typeof value !== "string") return "";
  try {
    return format(parseISO(value), pattern);
  } catch {
    return value;
  }
};

// Line chart for time-series reports (alert-volume, ambient-trend). Series are configured dynamically.
export function ReportTimeSeriesChart({
  data,
  series,
  xKey = "date",
  xFormat = "dd/MM",
  isLoading,
  emptyText = "No data.",
}: ReportTimeSeriesChartProps) {
  if (isLoading) return <Skeleton className="h-75 w-full" />;

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-16 text-center">
        {emptyText}
      </p>
    );
  }

  const chartConfig = series.reduce<ChartConfig>((acc, s) => {
    acc[s.key] = { label: s.label, color: s.color };
    return acc;
  }, {});

  return (
    <ChartContainer config={chartConfig} className="h-75 w-full">
      <LineChart
        data={data as Record<string, unknown>[]}
        margin={{ left: 4, right: 12, top: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(v) => safeFormat(v, xFormat)}
        />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            connectNulls={s.connectNulls}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
