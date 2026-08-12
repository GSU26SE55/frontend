import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPanel } from "@/shared/components/dashboard/DashboardPanel";

/**
 * Ranking table of batteries with the most open alerts — shared between Admin & Manager.
 * The two roles only differ in the navigation TARGET, so it accepts `onSelect`
 * instead of navigating itself. The caller still decides whether to render it (hidden when empty).
 */

export interface TopAlertingAsset {
  batteryAssetId: string;
  serialNumber: string;
  alertCount: number;
  criticalCount: number;
}

export function TopAlertingPanel({
  title,
  assets,
  isLoading,
  onSelect,
  className = "min-h-[260px]",
}: {
  title: string;
  assets: TopAlertingAsset[];
  isLoading: boolean;
  onSelect: (asset: TopAlertingAsset) => void;
  className?: string;
}) {
  return (
    <DashboardPanel
      title={title}
      desc="Most open alerts"
      className={className}
      bodyClassName="overflow-y-auto"
    >
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <ol className="space-y-1.5">
          {assets.map((a, i) => (
            <li key={a.batteryAssetId}>
              <button
                className="flex items-center gap-3 w-full text-left rounded-lg px-2 py-2 group hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                onClick={() => onSelect(a)}
              >
                <span className="w-4 shrink-0 text-right text-xs font-bold font-mono-num text-muted-foreground/70">
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 text-xs lg:text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {a.serialNumber}
                </span>
                {a.criticalCount > 0 && (
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-semibold shrink-0"
                    style={{ background: "var(--p1-soft)", color: "var(--p1)" }}
                  >
                    {a.criticalCount} critical
                  </span>
                )}
                <span className="text-xs lg:text-sm font-bold font-mono-num tabular-nums w-6 text-right shrink-0">
                  {a.alertCount}
                </span>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </DashboardPanel>
  );
}
