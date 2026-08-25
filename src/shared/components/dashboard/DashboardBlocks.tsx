import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Cell, Label, Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils";
import { toneVars, type StatusTone } from "@/shared/theme/statusColors";

/**
 * The wider dashboard blocks: an overview band, the small stat tiles that sit beside a
 * chart, the rings, and the recent-activity table.
 *
 * Shapes and rhythm follow the reference dashboard the team picked. Composition charts use
 * the categorical palette (`chartPalette.ts`) because a slice per person or per stage is
 * not a severity; the semantic status colours stay on the figures that flag a problem.
 */

// ── Overview band ─────────────────────────────────────────────────────────────
export function OverviewBand({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  /** Right-aligned control on the title line, e.g. the Sync button. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-cat-3/10 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {children}
      </div>
    </section>
  );
}

export function OverviewTile({
  label,
  value,
  note,
  tone,
  to,
}: {
  label: string;
  value: string | number;
  /** Secondary figure in brackets, e.g. "3 new". Omit when there is nothing to add. */
  note?: string;
  tone?: StatusTone;
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[28px] font-semibold leading-none tabular-nums"
          style={tone ? { color: toneVars(tone).fg } : undefined}
        >
          {value}
        </span>
        {note && (
          <span className="truncate text-xs text-muted-foreground">
            ({note})
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm text-muted-foreground group-hover:text-foreground">
        {label}
      </p>
    </>
  );

  const shell =
    "group min-w-0 rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm transition-colors";

  return to ? (
    <Link to={to} className={cn(shell, "block hover:border-primary/50")}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

// ── Small stat card (the 2x2 block beside a chart) ────────────────────────────
export function MiniStat({
  label,
  value,
  note,
  tone,
  to,
}: {
  label: string;
  value: string | number;
  /** One quiet line under the label. */
  note?: string;
  tone?: StatusTone;
  to?: string;
}) {
  return (
    <div className="relative flex min-w-0 flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <div>
        <span
          className="text-[26px] font-semibold leading-none tabular-nums"
          style={tone ? { color: toneVars(tone).fg } : undefined}
        >
          {value}
        </span>
        <p className="mt-1.5 text-sm font-medium">{label}</p>
      </div>
      <p className="mt-3 truncate pr-9 text-xs text-muted-foreground">{note}</p>
      {to && (
        <Link
          to={to}
          aria-label={`Open ${label.toLowerCase()}`}
          className="absolute bottom-3 right-3 grid size-7 place-items-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

// ── Figures printed under a chart ─────────────────────────────────────────────
export function ChartFooterStats({
  items,
}: {
  items: { label: string; value: number | string; color?: string }[];
}) {
  return (
    // Centred: the strip sits under a centred chart, and left-aligned figures under a
    // centred ring read as two separate blocks that happen to share a panel.
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-3">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2">
          {i.color && (
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full"
              style={{
                background: `color-mix(in oklab, ${i.color} 16%, transparent)`,
              }}
            >
              <ArrowUpRight className="size-3.5" style={{ color: i.color }} />
            </span>
          )}
          <span className="text-base font-semibold tabular-nums">
            {i.value}
          </span>
          <span className="text-xs text-muted-foreground">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Rings ─────────────────────────────────────────────────────────────────────
const ringConfig = { value: { label: "Count" } } satisfies ChartConfig;

export interface RingDatum {
  name: string;
  value: number;
  fill: string;
}

function RingLegend({ data, columns }: { data: RingDatum[]; columns: 1 | 2 }) {
  return (
    // Capped, not stretched: a full-width legend parks every number against the far edge
    // of the panel, leaving a label 300px from its own value. Capped, the pair stays
    // together and the ring + legend centre as one group.
    <ul
      className={cn(
        "min-w-0 gap-x-5 gap-y-3",
        columns === 2 ? "grid max-w-md grid-cols-2" : "flex max-w-56 flex-col",
      )}
    >
      {data.map((d) => (
        <li key={d.name} className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: d.fill }}
          />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {d.name}
          </span>
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {d.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Solid ring with a dot legend beside it. The plain composition chart. */
export function CategoryDonut({
  data,
  legendColumns = 2,
}: {
  data: RingDatum[];
  legendColumns?: 1 | 2;
}) {
  return (
    <div className="flex h-full items-center justify-center gap-6">
      <ChartContainer
        config={ringConfig}
        className="aspect-square h-full min-h-0 max-w-52 shrink-0"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="96%"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ChartContainer>
      <RingLegend data={data} columns={legendColumns} />
    </div>
  );
}

/**
 * A donut cut into separated segments. Same data a solid ring would carry, but the gaps
 * make each slice countable at a glance instead of only comparable by arc length.
 */
export function SegmentedRing({
  data,
  centerValue,
  centerLabel,
  legendColumns = 1,
  stacked,
}: {
  data: RingDatum[];
  centerValue: number | string;
  centerLabel: string;
  /** 2 when the legend has more than three entries and the panel is wide. */
  legendColumns?: 1 | 2;
  /** Legend under the ring instead of beside it, for a narrow column. */
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full justify-center gap-4",
        stacked ? "flex-col items-stretch" : "items-center gap-5",
      )}
    >
      <ChartContainer
        config={ringConfig}
        className={cn(
          "aspect-square min-h-0 shrink-0",
          stacked ? "mx-auto max-h-full max-w-40" : "h-full max-w-44",
        )}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="64%"
            outerRadius="94%"
            paddingAngle={3}
            cornerRadius={4}
            strokeWidth={0}
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
                        className="fill-foreground text-2xl font-semibold"
                      >
                        {centerValue}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 18}
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
      <RingLegend data={data} columns={legendColumns} />
    </div>
  );
}

// ── Composition as bars ───────────────────────────────────────────────────────
/**
 * Labelled bars with the count printed at the end. Reads at any n, which a donut does
 * not: two slices and a legend say less than two bars and two numbers, and it fills a
 * panel edge to edge instead of floating a circle in the middle of it.
 */
export function BarList({
  data,
  total,
}: {
  data: { name: string; value: number; fill: string }[];
  /** Denominator for the bar widths. Pass the sum unless a different scale is meant. */
  total?: number;
}) {
  const denominator = total ?? data.reduce((a, d) => a + d.value, 0);
  return (
    <ul className="flex h-full flex-col justify-center gap-1">
      {data.map((d) => (
        <li key={d.name} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">
            {d.name}
          </span>
          <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full"
              style={{
                width:
                  denominator > 0 ? `${(d.value / denominator) * 100}%` : 0,
                backgroundColor: d.fill,
              }}
            />
          </span>
          <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums">
            {d.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Recent activity table ─────────────────────────────────────────────────────
export function RecentTable({
  title,
  viewAllTo,
  columns,
  children,
  isLoading,
  empty,
  className,
  minWidthClass = "min-w-160",
}: {
  title: string;
  viewAllTo: string;
  columns: string[];
  children: React.ReactNode;
  isLoading?: boolean;
  empty?: React.ReactNode;
  /** Pass a height to make it a full-height panel; the rows then scroll inside. */
  className?: string;
  /**
   * Floor under the table width. The default suits a full-width table; a narrow column
   * needs `min-w-0`, otherwise the panel grows a horizontal scrollbar and clips the last
   * column instead of letting the cells share the space.
   */
  minWidthClass?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-3 px-5 py-3.5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <Link
          to={viewAllTo}
          className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          View all
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className={cn("w-full text-left text-sm", minWidthClass)}>
          <thead className="sticky top-0 z-10">
            <tr className="border-y border-border bg-muted text-xs text-muted-foreground">
              {columns.map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap px-5 py-2.5 font-medium"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-sm text-muted-foreground"
                >
                  Loading
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && empty}
    </section>
  );
}
