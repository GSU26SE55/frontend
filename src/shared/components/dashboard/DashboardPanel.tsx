import { Link } from "react-router-dom";
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
  to,
}: {
  label: string;
  value: string | number;
  sub?: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: string;
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </span>
        {icon ? (
          <span className="text-muted-foreground shrink-0">{icon}</span>
        ) : accent ? (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: accent }}
          />
        ) : null}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl lg:text-3xl font-bold tabular-nums leading-none text-foreground">
          {value}
        </span>
        {sub && (
          <span className="text-xs font-medium text-muted-foreground">{sub}</span>
        )}
      </div>
      {hint && (
        <span className="text-xs text-muted-foreground/80 truncate mt-1">
          {hint}
        </span>
      )}
    </>
  );

  const shell =
    "bg-card rounded-xl border border-border p-4 flex flex-col justify-between gap-1 min-w-0 shadow-sm transition-all";

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          shell,
          "hover:border-primary/60 hover:bg-muted/30 hover:shadow-md",
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
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
        "bg-card rounded-xl border border-border flex flex-col min-h-[260px] overflow-hidden shadow-sm",
        className,
      )}
    >
      <div className="px-4 pt-4 pb-2.5 shrink-0 flex items-start justify-between gap-3 border-b border-border/40">
        <div className="min-w-0">
          <h3 className="text-sm lg:text-base font-semibold text-foreground leading-tight truncate">
            {title}
          </h3>
          {desc && (
            <p className="text-xs text-muted-foreground leading-tight mt-1 truncate">
              {desc}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("flex-1 min-h-0 p-4", bodyClassName)}>
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
    <div className="flex items-center gap-5 h-full">
      <ChartContainer
        config={donutConfig}
        className="h-full aspect-square max-w-40 lg:max-w-44 min-h-0 shrink-0"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="66%"
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
                        className="text-xl lg:text-2xl font-bold fill-foreground"
                      >
                        {centerValue}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 16}
                        className="text-xs font-medium fill-muted-foreground"
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
      <ul className="flex-1 min-w-0 space-y-2.5">
        {data.map((b) => (
          <li key={b.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="size-3 rounded-full shrink-0 shadow-xs"
                style={{ background: b.fill }}
              />
              <span className="text-xs lg:text-sm font-medium text-muted-foreground truncate">
                {b.name}
              </span>
            </div>
            <span className="text-xs lg:text-sm font-bold tabular-nums text-foreground">
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
    <div className="flex flex-col h-full justify-between gap-2 min-h-0">
      <div className="relative flex-1 min-h-[100px] w-full flex items-center justify-center">
        <ChartContainer
          config={gaugeConfig}
          className="h-full aspect-square max-w-[150px] min-h-[100px] mx-auto"
        >
          <RadialBarChart
            data={[{ name: "v", value: percent, fill: color }]}
            startAngle={90}
            endAngle={-270}
            innerRadius="76%"
            outerRadius="96%"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span
            className="text-lg lg:text-xl font-bold tabular-nums leading-none tracking-tight"
            style={{ color }}
          >
            {valueText}
          </span>
          <span className="text-[10px] lg:text-[11px] font-medium text-muted-foreground leading-none mt-1">
            {caption}
          </span>
        </div>
      </div>
      {footer && <div className="shrink-0 pt-0.5">{footer}</div>}
    </div>
  );
}
