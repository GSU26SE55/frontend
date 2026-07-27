import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPanel } from "@/shared/components/dashboard/DashboardPanel";

/**
 * Bảng xếp hạng pin có nhiều cảnh báo mở nhất — dùng chung Admin & Manager.
 * Hai role chỉ khác nhau ở ĐÍCH điều hướng, nên nhận `onSelect` thay vì tự
 * navigate. Caller vẫn tự quyết định có render hay không (ẩn khi rỗng).
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
      desc="Nhiều cảnh báo mở nhất"
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
