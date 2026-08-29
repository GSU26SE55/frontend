import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SiteCascadeRiskSummaryDto } from "@/shared/types/battery/cascade.types";
import { plural } from "@/shared/utils/plural";
import { displayNameOrShortId } from "@/shared/utils/displayId";

interface CascadeRiskSummaryProps {
  summary: SiteCascadeRiskSummaryDto | undefined;
  isLoading?: boolean;
}

export default function CascadeRiskSummary({
  summary,
  isLoading,
}: CascadeRiskSummaryProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const hasHighRisk = summary.highRiskCount > 0;

  const pieData = [
    { name: "High risk", value: summary.highRiskCount, color: "#f43f5e" },
    { name: "Medium", value: summary.mediumRiskCount, color: "#f59e0b" },
    { name: "Low", value: summary.lowRiskCount, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const chartData =
    pieData.length > 0
      ? pieData
      : [{ name: "Low", value: 1, color: "#10b981" }];

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <ShieldAlert
            className={`size-4 ${
              hasHighRisk
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-500"
            }`}
          />
          <CardTitle className="text-base">Cascade risk</CardTitle>
        </div>
        <Badge
          variant={hasHighRisk ? "destructive" : "outline"}
          className={`font-mono text-xs font-semibold px-2 py-0.5 ${
            hasHighRisk ? "bg-rose-600 text-white" : ""
          }`}
        >
          Max: {summary.maxScore.toFixed(2)}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Risk level distribution
            </p>

            <div className="space-y-1.5 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-muted-foreground min-w-20">
                  High risk:
                </span>
                <strong
                  className={`font-bold ${summary.highRiskCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                >
                  {plural(summary.highRiskCount, "battery", "batteries")}{" "}
                  {summary.totalAssets > 0
                    ? `(${((summary.highRiskCount / summary.totalAssets) * 100).toFixed(0)}%)`
                    : ""}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-muted-foreground min-w-20">Medium:</span>
                <strong
                  className={`font-bold ${summary.mediumRiskCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                >
                  {plural(summary.mediumRiskCount, "battery", "batteries")}{" "}
                  {summary.totalAssets > 0
                    ? `(${((summary.mediumRiskCount / summary.totalAssets) * 100).toFixed(0)}%)`
                    : ""}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground min-w-20">Low:</span>
                <strong
                  className={`font-bold ${summary.lowRiskCount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                >
                  {plural(summary.lowRiskCount, "battery", "batteries")}{" "}
                  {summary.totalAssets > 0
                    ? `(${((summary.lowRiskCount / summary.totalAssets) * 100).toFixed(0)}%)`
                    : ""}
                </strong>
              </div>
            </div>
          </div>

          <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={chartData.length > 1 ? 3 : 0}
                  cornerRadius={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`risk-pie-${index}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [
                    plural(Number(value), "battery", "batteries"),
                    "Count",
                  ]}
                  contentStyle={{
                    fontSize: "12px",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span
                className={`text-2xl font-bold font-mono ${
                  hasHighRisk
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600"
                }`}
              >
                {summary.maxScore.toFixed(2)}
              </span>
              <span className="text-2xs text-muted-foreground font-medium">
                Risk
              </span>
            </div>
          </div>
        </div>

        {summary.highRiskAssets.length > 0 && (
          <div className="pt-2 border-t border-border flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-2xs text-muted-foreground font-medium">
              Batteries to watch:
            </span>
            {summary.highRiskAssets.slice(0, 4).map((a) => (
              <Badge
                key={a.batteryAssetId}
                variant="outline"
                className="text-3xs font-mono px-2 py-0.5 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 font-semibold"
              >
                {displayNameOrShortId(a.serialNumber, a.batteryAssetId)} (
                {a.cascadeRiskScore.toFixed(2)})
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
