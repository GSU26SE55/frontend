import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardPanel,
  DashboardStackedBar,
} from "@/shared/components/dashboard/DashboardPanel";
import { slaComplianceColor } from "@/shared/lib/sla";

/**
 * SLA compliance: how many timers finished on time, and how many are still running.
 *
 * This block used to be copy-pasted verbatim across ALL THREE dashboards
 * (admin/manager/staff) — including the color scale — so changing a threshold in
 * one place caused the other two to drift. Consolidated here.
 *
 * Why this is NOT a donut any more. The ring could only ever draw
 * onTime / (onTime + breached), but the three figures under it listed Running too — so
 * the numbers on screen did not add up to the shape above them, and people read the ring
 * as "6 + 7 + 5 out of something". The stacked bar draws ALL THREE states to scale, so
 * the chart and the figures finally agree. Running is drawn faded and repeated under the
 * rule, because it is the one state the percentage deliberately excludes: its timer has
 * not stopped, so it is neither on time nor breached yet.
 */

export interface SlaSummary {
  compliancePercent: number;
  met: number;
  running: number;
  breached: number;
}

function Figure({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="min-w-0">
      <div
        className="text-xl font-semibold leading-none tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function SlaGaugePanel({
  title,
  desc,
  sla,
  isLoading,
  className,
}: {
  title: string;
  desc: string;
  sla: SlaSummary | null | undefined;
  isLoading: boolean;
  className?: string;
}) {
  const onTime = sla?.met ?? 0;
  const breached = sla?.breached ?? 0;
  const running = sla?.running ?? 0;

  // onTime + breached = the timers that actually finished. The BE returns
  // compliancePercent = 100 when that denominator is 0 (nothing has closed yet), so an
  // untouched system rendered a full green 100% ring — "no record yet" drawn as a
  // perfect score. Zero finished timers means there is nothing to be compliant with.
  const settled = onTime + breached;
  const hasRecord = settled > 0;
  const percent = hasRecord ? (sla?.compliancePercent ?? 0) : 0;

  // The headline keeps the ≥90 / ≥70 / below scale — a low compliance rate SHOULD read
  // as a problem. Only the number is tinted; the "on time" caption next to it stays
  // muted, because colouring the words made "on time" itself look like the bad thing.
  const headlineColor = slaComplianceColor(hasRecord ? percent : undefined);

  return (
    <DashboardPanel title={title} desc={desc} className={className}>
      {isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <div className="flex h-full flex-col justify-center gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-semibold leading-none tabular-nums"
                style={{ color: headlineColor }}
              >
                {hasRecord ? `${percent}%` : "—"}
              </span>
              <span className="text-sm text-muted-foreground">on time</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {hasRecord
                ? `${onTime} of ${settled} finished timers`
                : "No timer has finished yet"}
            </p>
          </div>

          {/* All three timer states, sized by share, with a tooltip per segment.
              Running is drawn faded because it is on the chart for context only — it is
              excluded from the headline percentage above. */}
          <DashboardStackedBar
            segments={[
              {
                key: "onTime",
                label: "On time",
                value: onTime,
                fill: "var(--ok)",
              },
              {
                key: "breached",
                label: "Breached",
                value: breached,
                fill: "var(--p1)",
              },
              {
                key: "running",
                label: "Still running",
                value: running,
                fill: "var(--muted-foreground)",
                muted: true,
              },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Figure value={onTime} label="On time" color="var(--ok)" />
            <Figure
              value={breached}
              label="Breached"
              color={breached > 0 ? "var(--p1)" : undefined}
            />
          </div>

          {/* Running is deliberately BELOW the rule and outside the grid above: its
              timer has not stopped, so it is neither on time nor breached yet and takes
              no part in the percentage. Saying so beats letting people work out why
              6 + 7 + 5 does not match the bar. */}
          <div className="flex items-baseline justify-between border-t border-border pt-3 text-xs">
            <span className="text-muted-foreground">
              Still running
              <span className="ml-1.5 text-muted-foreground/70">
                not counted yet
              </span>
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {running}
            </span>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
