import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSiteList } from '@/features/manager/hooks/useSites';
import { SiteStatusEnum } from '@/shared/types/site.types';

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSiteList({ pageNumber: 1, pageSize: 100 });

  const sites       = data?.items ?? [];
  const totalSites  = data?.totalItems ?? 0;
  const activeSites = sites.filter((s) => s.status === SiteStatusEnum.Active).length;
  const totalBatt   = sites.reduce((sum, s) => sum + s.batteryAssetCount, 0);
  const activeBatt  = sites.reduce((sum, s) => sum + s.activeBatteryAssetCount, 0);

  const statCards = [
    { label: 'Tổng site',      value: totalSites,  color: '' },
    { label: 'Site hoạt động', value: activeSites, color: 'text-green-600' },
    { label: 'Tổng pin',       value: totalBatt,   color: '' },
    { label: 'Pin hoạt động',  value: activeBatt,  color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Tổng quan hệ thống</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((c) =>
          isLoading ? (
            <Card key={c.label}><CardContent className="pt-6"><Skeleton className="h-10 w-full" /></CardContent></Card>
          ) : (
            <Card key={c.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Danh sách site</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/manager/sites')}>
          Xem tất cả
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : sites.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Chưa có site nào.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sites.slice(0, 9).map((site) => (
            <Card
              key={site.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/manager/sites/${site.id}`)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{site.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{site.customerName}</p>
                  </div>
                  <Badge
                    variant={
                      site.status === SiteStatusEnum.Active ? 'default'
                      : site.status === SiteStatusEnum.UnderMaintenance ? 'secondary'
                      : 'destructive'
                    }
                    className="shrink-0"
                  >
                    {site.status === SiteStatusEnum.Active ? 'Hoạt động'
                    : site.status === SiteStatusEnum.UnderMaintenance ? 'Bảo trì'
                    : 'Đã ngừng'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{site.activeBatteryAssetCount} / {site.batteryAssetCount} pin</span>
                  {site.capacityKw != null && <span>· {site.capacityKw} kW</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
