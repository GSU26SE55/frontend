import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

/**
 * Compact building blocks cho dashboard "1 khung" (full-height bento, no scroll).
 * Dùng chung bởi Admin / Manager / Staff dashboard.
 */

// ── Compact KPI ───────────────────────────────────────────────────────────────
export function DashboardKpi({
  label,
  value,
  sub,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="bg-card rounded-lg border border-border px-3.5 py-2 flex flex-col gap-0.5 min-w-0"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground truncate">
          {label}
        </span>
        {icon ? (
          <span className="text-muted-foreground shrink-0">{icon}</span>
        ) : accent ? (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: accent }}
          />
        ) : null}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold tabular-nums leading-none">
          {value}
        </span>
        {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
      </div>
      {hint && (
        <span className="text-[10.5px] text-muted-foreground truncate">
          {hint}
        </span>
      )}
    </div>
  );
}

// ── Panel shell (flex-col card: header + flexible body) ───────────────────────
export function DashboardPanel({
  title,
  desc,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border flex flex-col min-h-0 overflow-hidden",
        className,
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="px-3.5 pt-2.5 pb-1.5 shrink-0 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[12.5px] font-semibold leading-tight truncate">
            {title}
          </h3>
          {desc && (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
              {desc}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("flex-1 min-h-0 px-3.5 pb-3", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}

// ── Donut (chart + legend) ────────────────────────────────────────────────────
const donutConfig = { value: { label: "Số lượng" } } satisfies ChartConfig;

export interface DonutDatum {
  name: string;
  value: number;
  fill: string;
}

export function DashboardDonut({
  data,
  centerValue,
  centerLabel,
}: {
  data: DonutDatum[];
  centerValue: number;
  centerLabel: string;
}) {
  return (
    <div className="flex items-center gap-4 h-full">
      <ChartContainer
        config={donutConfig}
        className="h-full aspect-square max-w-[150px] min-h-0 shrink-0"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            strokeWidth={2}
            stroke="var(--background)"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="text-xl font-bold fill-foreground"
                      >
                        {centerValue}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 16}
                        className="text-[10px] fill-muted-foreground"
                      >
                        {centerLabel}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ChartContainer>
      <ul className="flex-1 min-w-0 space-y-2">
        {data.map((b) => (
          <li key={b.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ background: b.fill }}
              />
              <span className="text-[12.5px] text-muted-foreground truncate">
                {b.name}
              </span>
            </div>
            <span className="text-[12.5px] font-semibold tabular-nums">
              {b.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Radial gauge (single value 0–100) ─────────────────────────────────────────
const gaugeConfig = { value: { label: "Gauge" } } satisfies ChartConfig;

export function DashboardGauge({
  percent,
  valueText,
  caption,
  color,
  footer,
}: {
  percent: number;
  valueText: string;
  caption: string;
  color: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-0 grid place-items-center">
        <ChartContainer
          config={gaugeConfig}
          className="h-full aspect-square max-w-[170px] min-h-0"
        >
          <RadialBarChart
            data={[{ name: "v", value: percent, fill: color }]}
            startAngle={90}
            endAngle={-270}
            innerRadius="72%"
            outerRadius="100%"
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
          </RadialBarChart>
        </ChartContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-2xl font-bold tabular-nums leading-none"
            style={{ color }}
          >
            {valueText}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {caption}
          </span>
        </div>
      </div>
      {footer && <div className="shrink-0">{footer}</div>}
    </div>
  );
}
