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
  className = "min-h-56",
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
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <ol className="space-y-1">
          {assets.map((a, i) => (
            <li key={a.batteryAssetId}>
              <button
                className="flex items-center gap-2.5 w-full text-left rounded-md px-1.5 py-1.5 group hover:bg-muted/40 transition-colors"
                onClick={() => onSelect(a)}
              >
                <span className="w-3.5 shrink-0 text-right text-[10px] font-semibold font-mono-num text-muted-foreground/60">
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 text-xs font-medium truncate group-hover:text-primary transition-colors">
                  {a.serialNumber}
                </span>
                {a.criticalCount > 0 && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold shrink-0"
                    style={{ background: "var(--p1-soft)", color: "var(--p1)" }}
                  >
                    {a.criticalCount} critical
                  </span>
                )}
                <span className="text-[11px] font-semibold font-mono-num tabular-nums w-5 text-right shrink-0">
                  {a.alertCount}
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </DashboardPanel>
  );
}
