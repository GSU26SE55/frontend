import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardPanel,
  DashboardGauge,
} from "@/shared/components/dashboard/DashboardPanel";
import { slaComplianceColor } from "@/shared/lib/sla";

/**
 * SLA compliance gauge + 3 cells: Met / Running / Breach.
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

function FooterCell({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 py-2 px-1">
      <p
        className="text-base lg:text-lg font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function SlaGaugePanel({
  title,
  desc,
  sla,
  isLoading,
  className = "min-h-[260px]",
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
          caption="SLA met"
          color={slaComplianceColor(sla?.compliancePercent)}
          footer={
            <div className="grid grid-cols-3 gap-2 text-center">
              <FooterCell value={sla?.met ?? 0} label="Met" color="var(--ok)" />
              <FooterCell value={sla?.running ?? 0} label="Running" />
              <FooterCell
                value={sla?.breached ?? 0}
                label="Breach"
                color="var(--p1)"
              />
            </div>
          }
        />
      )}
    </DashboardPanel>
  );
}
