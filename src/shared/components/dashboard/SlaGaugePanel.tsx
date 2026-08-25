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

  return (
    <DashboardPanel title={title} desc={desc} className={className}>
      {isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <DashboardGauge
          percent={percent}
          valueText={sla ? `${percent}%` : "—"}
          caption="met"
          color={slaComplianceColor(sla?.compliancePercent)}
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
