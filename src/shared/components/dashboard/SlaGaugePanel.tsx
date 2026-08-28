import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardPanel,
  DashboardGauge,
  GaugeFooter,
} from "@/shared/components/dashboard/DashboardPanel";
import { slaComplianceColor } from "@/shared/lib/sla";

/**
 * SLA compliance gauge plus the three figures behind it: met, running, breached.
 *
 * This block used to be copy-pasted verbatim across ALL THREE dashboards
 * (admin/manager/staff) — including the color scale — so changing a threshold in
 * one place caused the other two to drift. Consolidated here.
 */

export interface SlaSummary {
  compliancePercent: number;
  met: number;
  running: number;
  breached: number;
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
  const percent = sla?.compliancePercent ?? 0;
  // met + breached = the timers that actually finished. The BE returns compliancePercent = 100
  // when that denominator is 0 (nothing has closed yet), so an untouched system rendered a full
  // green 100% ring — "no record yet" drawn as a perfect score. Zero finished timers means there
  // is nothing to be compliant with: show no data, the way the "SLA met" stat tile already does.
  const settled = sla ? sla.met + sla.breached : 0;
  const hasRecord = settled > 0;

  return (
    <DashboardPanel title={title} desc={desc} className={className}>
      {isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <DashboardGauge
          percent={hasRecord ? percent : 0}
          valueText={hasRecord ? `${percent}%` : "0"}
          caption="met"
          // No record → the fn's own null branch gives the muted grey, so the ring reads
          // as "nothing measured" rather than a green pass.
          color={slaComplianceColor(
            hasRecord ? sla?.compliancePercent : undefined,
          )}
          footer={
            <GaugeFooter
              cells={[
                { value: sla?.met ?? 0, label: "Met", tone: "ok" },
                { value: sla?.running ?? 0, label: "Running" },
                {
                  value: sla?.breached ?? 0,
                  label: "Breached",
                  tone: (sla?.breached ?? 0) > 0 ? "p1" : undefined,
                },
              ]}
            />
          }
        />
      )}
    </DashboardPanel>
  );
}
