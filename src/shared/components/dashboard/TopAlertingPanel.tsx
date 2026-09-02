import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPanel } from "@/shared/components/dashboard/DashboardPanel";
import { toneVars } from "@/shared/theme/statusColors";

/**
 * Ranking of the batteries raising the most open alerts, shared between Admin and Manager.
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
  className,
}: {
  title: string;
  assets: TopAlertingAsset[];
  isLoading: boolean;
  onSelect: (asset: TopAlertingAsset) => void;
  className?: string;
}) {
  const worst = assets[0]?.alertCount ?? 0;

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
        <ol className="divide-y divide-border/60">
          {assets.map((a) => {
            // Bar length is relative to the worst offender, so the ranking is readable
            // without printing a scale nobody would use.
            const width = worst > 0 ? (a.alertCount / worst) * 100 : 0;
            return (
              <li key={a.batteryAssetId}>
                <button
                  type="button"
                  className="group w-full py-2 text-left"
                  onClick={() => onSelect(a)}
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className="min-w-0 flex-1 truncate text-sm group-hover:text-primary"
                      title={a.serialNumber}
                    >
                      {a.serialNumber}
                    </span>
                    {a.criticalCount > 0 && (
                      <span
                        className="shrink-0 text-xs tabular-nums"
                        style={{ color: toneVars("p1").fg }}
                      >
                        {a.criticalCount} critical
                      </span>
                    )}
                    <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums">
                      {a.alertCount}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="mt-1.5 h-0.5 rounded-full transition-[width]"
                    style={{
                      width: `${width}%`,
                      background:
                        a.criticalCount > 0
                          ? toneVars("p1").fg
                          : toneVars("p3").fg,
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </DashboardPanel>
  );
}
