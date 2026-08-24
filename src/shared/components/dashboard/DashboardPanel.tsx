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
import { toneVars, type StatusTone } from "@/shared/theme/statusColors";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";

/**
 * Building blocks for the three role dashboards (admin, manager, staff), plus the
 * analytics page.
 *
 * The headline numbers sit in their own cards. Every card is the same plain surface —
 * the hierarchy is carried by the number's colour alone, so a row of tiles stays quiet
 * and the one that needs attention is the one that is coloured. Each links to the page
 * where you act on it.
 */

// ── Page heading ──────────────────────────────────────────────────────────────
export function DashboardHeading({
  title,
  status,
  refreshKeys,
}: {
  title: string;
  /** One plain sentence describing the current situation, built from the data. */
  status: string;
  refreshKeys: (string | readonly string[])[];
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{status}</p>
      </div>
      <RefreshButton queryKeys={refreshKeys} label="Sync" />
    </header>
  );
}

// ── Headline numbers ──────────────────────────────────────────────────────────
export function StatRail({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone,
  to,
}: {
  label: string;
  value: string | number;
  /** Colours the number. Leave unset while the figure is nothing to act on. */
  tone?: StatusTone;
  to?: string;
}) {
  const body = (
    <>
      <span
        className="text-[32px] font-semibold leading-none tabular-nums"
        style={tone ? { color: toneVars(tone).fg } : undefined}
      >
        {value}
      </span>
      <span className="mt-2 block text-sm text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
    </>
  );

  // Every card is the same plain surface. Tinting the ones with a tone turned the row
  // into a block of colour and drowned out the number, which is the part that matters.
  const shell = cn(
    "group min-w-0 rounded-lg border border-border bg-card p-4",
    "transition-[border-color,box-shadow] duration-(--motion-state) ease-strong",
    to && "hover:border-border-strong hover:shadow-sm",
  );

  return to ? (
    <Link to={to} className={cn(shell, "block")}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

// ── Panel shell ───────────────────────────────────────────────────────────────
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
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {/* Title and meta share one baseline: a panel caption, not a stacked header block
          with its own divider under it. */}
      <div className="flex shrink-0 items-baseline gap-3 px-4 pb-2 pt-3.5">
        <h2 className="truncate text-sm font-medium text-foreground">
          {title}
        </h2>
        {desc && (
          <p className="ml-auto truncate text-xs text-muted-foreground">
            {desc}
          </p>
        )}
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </div>
      <div className={cn("min-h-0 flex-1 px-4 pb-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

// ── Donut (chart + legend) ────────────────────────────────────────────────────
const donutConfig = { value: { label: "Count" } } satisfies ChartConfig;

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
    <div className="flex h-full items-center gap-5">
      <ChartContainer
        config={donutConfig}
        className="aspect-square h-full min-h-0 max-w-40 shrink-0"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="92%"
            strokeWidth={2}
            stroke="var(--card)"
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
                        className="fill-foreground text-xl font-semibold"
                      >
                        {centerValue}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 16}
                        className="fill-muted-foreground text-xs"
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
      {/* Legend rows read as a small table: swatch, name, number, hairline between. */}
      <ul className="min-w-0 flex-1 divide-y divide-border/60">
        {data.map((b) => (
          <li
            key={b.name}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ background: b.fill }}
              />
              <span className="truncate text-sm text-muted-foreground">
                {b.name}
              </span>
            </div>
            <span className="text-sm font-medium tabular-nums">{b.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Radial gauge (single value 0-100) ─────────────────────────────────────────
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
    <div className="flex h-full min-h-0 flex-col justify-between gap-2">
      <div className="relative flex min-h-25 w-full flex-1 items-center justify-center">
        <ChartContainer
          config={gaugeConfig}
          className="mx-auto aspect-square h-full min-h-25 max-w-38"
        >
          <RadialBarChart
            data={[{ name: "v", value: percent, fill: color }]}
            startAngle={90}
            endAngle={-270}
            innerRadius="78%"
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-2xl font-semibold leading-none tracking-tight tabular-nums"
            style={{ color }}
          >
            {valueText}
          </span>
          <span className="mt-1.5 text-xs leading-none text-muted-foreground">
            {caption}
          </span>
        </div>
      </div>
      {footer && <div className="shrink-0">{footer}</div>}
    </div>
  );
}

/**
 * Row of figures under a gauge. Hairlines instead of tinted boxes, so the gauge stays the
 * loudest thing in the panel.
 */
export function GaugeFooter({
  cells,
}: {
  cells: { value: number; label: string; tone?: StatusTone }[];
}) {
  return (
    <div className="flex border-t border-border pt-3">
      {cells.map((c) => (
        <div
          key={c.label}
          className="flex-1 border-l border-border px-2 text-center first:border-l-0"
        >
          <p
            className="text-base font-semibold tabular-nums"
            style={c.tone ? { color: toneVars(c.tone).fg } : undefined}
          >
            {c.value}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
