import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SiteDashboardDto } from "@/shared/types/site.types";

function getHealthColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-500";
  return "text-red-600";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng quan site</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Trạng thái sức khỏe</p>
          <p
            className={`text-2xl font-bold ${getHealthColor(data.healthScore)}`}
          >
            {data.healthScore}%
          </p>
          <p
            className={`text-sm font-medium ${getHealthColor(data.healthScore)}`}
          >
            {getHealthLabel(data.healthScore)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tổng pin</p>
          <p className="text-2xl font-bold">{data.totalAssets}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Đang hoạt động</p>
          <p className="text-2xl font-bold text-green-600">
            {data.activeAssets}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Cảnh báo đang mở</p>
          <p
            className={`text-2xl font-bold ${data.assetsWithActiveAlerts > 0 ? "text-red-600" : ""}`}
          >
            {data.assetsWithActiveAlerts}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
