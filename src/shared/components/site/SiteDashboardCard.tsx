import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SiteDashboardDto } from "@/shared/types/site/site.types";
import { toneText, healthScoreTone } from "@/shared/theme/statusColors";

function getHealthColor(score: number): string {
  return toneText(healthScoreTone(score));
}

function getHealthLabel(score: number): string {
  if (score >= 80) return "Tốt";
  if (score >= 50) return "Cần theo dõi";
  return "Nguy hiểm";
}

interface SiteDashboardCardProps {
  data: SiteDashboardDto;
}

export default function SiteDashboardCard({ data }: SiteDashboardCardProps) {
  const activeOnly = Math.max(0, data.activeAssets - data.assetsWithActiveAlerts);
  const alertsCount = data.assetsWithActiveAlerts;
  const inactiveCount = Math.max(0, data.totalAssets - data.activeAssets);

  const pieData = [
    { name: "Bình thường", value: activeOnly, color: "#10b981" },
    { name: "Có cảnh báo", value: alertsCount, color: "#f43f5e" },
    { name: "Ngừng HĐ", value: inactiveCount, color: "#6b7280" },
  ].filter((d) => d.value > 0);

  const chartData =
    pieData.length > 0
      ? pieData
      : [{ name: "Không có pin", value: 1, color: "#e5e7eb" }];

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tổng quan site</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Trạng thái sức khỏe</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-2xl font-bold ${getHealthColor(data.healthScore)}`}>
                  {data.healthScore}%
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  data.healthScore >= 80
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : data.healthScore >= 50
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}>
                  {getHealthLabel(data.healthScore)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px] font-medium">Tổng số pin</span>
                <strong className="text-base font-bold text-foreground">{data.totalAssets}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-medium">Đang hoạt động</span>
                <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {data.activeAssets}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] font-medium">Cảnh báo mở</span>
                <strong className={`text-base font-bold ${data.assetsWithActiveAlerts > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                  {data.assetsWithActiveAlerts}
                </strong>
              </div>
            </div>
          </div>

          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={44}
                  paddingAngle={3}
                  cornerRadius={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`site-pie-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} pin`, "Số lượng"]}
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
              <span className={`text-sm font-bold ${getHealthColor(data.healthScore)}`}>
                {data.healthScore}%
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">Sức khỏe</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
