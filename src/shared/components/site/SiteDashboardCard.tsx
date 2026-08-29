import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SiteDashboardDto } from "@/shared/types/site/site.types";
import { toneText, healthScoreTone } from "@/shared/theme/statusColors";
import { plural } from "@/shared/utils/plural";

function getHealthColor(score: number): string {
  return toneText(healthScoreTone(score));
}

function getHealthLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 50) return "Needs monitoring";
  return "Critical";
}

interface SiteDashboardCardProps {
  data: SiteDashboardDto;
}

export default function SiteDashboardCard({ data }: SiteDashboardCardProps) {
  const activeOnly = Math.max(
    0,
    data.activeAssets - data.assetsWithActiveAlerts,
  );
  const alertsCount = data.assetsWithActiveAlerts;
  const inactiveCount = Math.max(0, data.totalAssets - data.activeAssets);

  const pieData = [
    { name: "Healthy", value: activeOnly, color: "#10b981" },
    { name: "Open alerts", value: alertsCount, color: "#f43f5e" },
    // Everything not Active — Suspended and Decommissioned both land here, so this keeps
    // the umbrella term rather than borrowing either status name from the table below.
    { name: "Inactive", value: inactiveCount, color: "#6b7280" },
  ].filter((d) => d.value > 0);

  const chartData =
    pieData.length > 0
      ? pieData
      : [{ name: "No batteries", value: 1, color: "#e5e7eb" }];

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Site overview</CardTitle>
        <Badge
          variant="outline"
          className="font-mono text-xs font-semibold px-2 py-0.5"
        >
          Total: {data.totalAssets}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Mirrors "Risk level distribution" on the Cascade risk card beside this one:
                a caption, then one dotted row per donut slice. The dots carry the same
                colours as the donut, which previously had three segments and no legend at
                all — the reader could see the proportions but not what any meant. */}
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground font-medium">
                Battery breakdown
              </p>
              <span
                className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                  data.healthScore >= 80
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : data.healthScore >= 50
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {getHealthLabel(data.healthScore)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground min-w-20">Healthy:</span>
                <strong
                  className={`font-bold ${activeOnly > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                >
                  {plural(activeOnly, "battery", "batteries")}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-muted-foreground min-w-20">
                  Open alerts:
                </span>
                <strong
                  className={`font-bold ${alertsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                >
                  {plural(alertsCount, "battery", "batteries")}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-500 shrink-0" />
                <span className="text-muted-foreground min-w-20">
                  Inactive:
                </span>
                <strong
                  className={`font-bold ${inactiveCount > 0 ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {plural(inactiveCount, "battery", "batteries")}
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
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  cornerRadius={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`site-pie-${index}`}
                      fill={entry.color}
                      stroke="none"
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
                className={`text-2xl font-bold ${getHealthColor(data.healthScore)}`}
              >
                {data.healthScore}%
              </span>
              <span className="text-2xs text-muted-foreground font-medium">
                Health
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
