import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  SiteCascadeRiskSummaryDto,
  CascadeRiskLevelName,
} from "@/shared/types/cascade.types";

// Heat map cascade risk theo site (presentational — data từ hook của từng feature).
// Docs: docs/api-battery.md §Nhóm 12 (cascade-risk-summary).

const LEVEL_STYLE: Record<CascadeRiskLevelName, string> = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-600 border-red-200",
};

const LEVEL_LABEL: Record<CascadeRiskLevelName, string> = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
};

interface CascadeRiskSummaryProps {
  summary: SiteCascadeRiskSummaryDto | undefined;
  isLoading?: boolean;
}

function StatBox({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${className ?? "border-border"}`}>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function CascadeRiskSummary({
  summary,
  isLoading,
}: CascadeRiskSummaryProps) {
  if (isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="p-6 flex flex-col items-center gap-2 text-muted-foreground">
        <ShieldAlert size={28} className="opacity-30" />
        <span className="text-sm">Chưa có dữ liệu cascade risk.</span>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            Rủi ro lan truyền (Cascade Risk)
          </h3>
          <p className="text-xs text-muted-foreground">
            Tổng hợp theo site · điểm cao nhất{" "}
            <span className="font-medium tabular-nums">
              {summary.maxScore.toFixed(2)}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Tổng số pin" value={summary.totalAssets} />
        <StatBox
          label="Rủi ro cao"
          value={summary.highRiskCount}
          className="border-red-200 bg-red-50/40"
        />
        <StatBox
          label="Trung bình"
          value={summary.mediumRiskCount}
          className="border-amber-200 bg-amber-50/40"
        />
        <StatBox
          label="Thấp"
          value={summary.lowRiskCount}
          className="border-emerald-200 bg-emerald-50/40"
        />
      </div>

      {summary.highRiskAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pin rủi ro cao
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {summary.highRiskAssets.map((a) => (
              <li
                key={a.batteryAssetId}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="text-sm font-medium truncate">
                  {a.serialNumber ?? a.batteryAssetId}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold tabular-nums">
                    {a.cascadeRiskScore.toFixed(2)}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10.5px] ${LEVEL_STYLE[a.level]}`}
                  >
                    {LEVEL_LABEL[a.level]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
