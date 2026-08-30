import { cn } from "@/lib/utils";
import { toneText, toneDot, toneVars } from "@/shared/theme/statusColors";
import type { StatusTone } from "@/shared/theme/statusColors";

/**
 * Below this many items a proportion bar carries no information — a site with one
 * battery renders a single solid block whatever its status, which reads as a chart
 * but says nothing the numbers above it did not already say. So it is dropped.
 */
const MIN_ITEMS_FOR_BAR = 3;

export interface BreakdownSegment {
  /** Short label under the number — "Healthy", "High risk". */
  label: string;
  value: number;
  tone: StatusTone;
}

interface StatBreakdownProps {
  /** One entry per category. Order is kept for both the stat row and the bar. */
  segments: BreakdownSegment[];
  /** Denominator for the proportion bar. */
  total: number;
  className?: string;
}

/**
 * Replaces the donut+legend pair the site cards used to carry. A donut needed a legend
 * to be readable at all, so every category was printed twice (once as a slice, once as a
 * dotted row) and both cards ended up with the same block of dotted rows — visually
 * identical from arm's length despite showing unrelated measures.
 *
 * Here the number IS the label: a row of counts, then one thin proportion bar. Zero rows
 * stay in place (a missing "High risk" column is worse than one reading 0) but drop to
 * muted so the eye lands on the categories that are populated.
 *
 * Counts are NOT restated as percentages. The bar already carries the proportion, and on a
 * small site the percentages actively mislead — one battery of one renders as "1" and
 * "100%", two numbers of equal visual weight for a single data point.
 */
export default function StatBreakdown({
  segments,
  total,
  className,
}: StatBreakdownProps) {
  const showBar =
    total >= MIN_ITEMS_FOR_BAR && segments.some((s) => s.value > 0);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-stretch">
        {segments.map((seg) => {
          const isZero = seg.value === 0;
          return (
            <div
              key={seg.label}
              className="flex-1 min-w-0 border-l border-border first:border-l-0 pl-3 first:pl-0"
            >
              <div
                className={cn(
                  // A step below the headline figure each card closes with — these are the
                  // supporting counts, so they must not compete with the verdict.
                  "text-xl font-bold tabular-nums leading-none",
                  isZero ? "text-muted-foreground/50" : toneText(seg.tone),
                )}
              >
                {seg.value}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    isZero ? "bg-muted-foreground/30" : toneDot(seg.tone),
                  )}
                />
                <span className="text-2xs text-muted-foreground font-medium truncate">
                  {seg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showBar && (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
          {segments
            .filter((s) => s.value > 0)
            .map((seg) => (
              <div
                key={seg.label}
                style={{
                  width: `${(seg.value / total) * 100}%`,
                  backgroundColor: toneVars(seg.tone).fg,
                }}
                title={`${seg.label}: ${seg.value}`}
              />
            ))}
        </div>
      )}
    </div>
  );
}
