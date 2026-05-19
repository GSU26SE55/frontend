import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SiteDashboardCard from '@/shared/components/common/SiteDashboardCard';
import SiteAssetsTable from '@/shared/components/common/SiteAssetsTable';
import SiteFormDialog from '@/features/admin/components/SiteFormDialog';
import {
  useSiteDetail,
  useSiteDashboard,
  useSiteAssets,
  useDeleteSite,
  useRestoreSite,
} from '@/features/admin/hooks/useSites';
import { SiteStatusEnum } from '@/shared/types/site.types';
import type { SiteAssetsFilterParams } from '@/shared/types/site.types';

export default function SiteDetailPage() {
  const { id = '' }    = useParams<{ id: string }>();
  const navigate        = useNavigate();
  const [editOpen, setEditOpen]   = useState(false);
  const [assetsParams, setAssetsParams] = useState<SiteAssetsFilterParams>({
    pageNumber: 1,
    pageSize:   10,
  });

  const { data: site, isLoading: loadingSite } = useSiteDetail(id);
  const { data: dashboard }                    = useSiteDashboard(id);
  const { data: assetsPage, isLoading: loadingAssets } = useSiteAssets(id, assetsParams);

  const { mutate: deleteSite }  = useDeleteSite();
  const { mutate: restoreSite } = useRestoreSite();

  if (loadingSite) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Không tìm thấy site.</p>
        <Button variant="outline" className="mt-2" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  const isDecommissioned = site.status === SiteStatusEnum.Decommissioned;

  const handleDelete = () => {
    if (confirm(`Xoá site "${site.name}"?`)) {
      deleteSite(site.id, { onSuccess: () => navigate('/admin/sites') });
    }
  };

  const handleRestore = () => {
    if (confirm(`Khôi phục site "${site.name}"?`)) {
      restoreSite(site.id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
            ← Quay lại
          </Button>
          <h1 className="text-2xl font-bold">{site.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {site.address && <span>{site.address}</span>}
            {site.customerName && <span>· {site.customerName}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDecommissioned ? (
            <>
              <Badge variant="destructive">Đã ngừng</Badge>
              <Button variant="outline" size="sm" onClick={handleRestore}>Khôi phục</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Sửa</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>Xoá</Button>
            </>
          )}
        </div>
      </div>

      {dashboard && <SiteDashboardCard data={dashboard} />}

      <div>
        <h2 className="text-lg font-semibold mb-3">Danh sách pin</h2>
        <SiteAssetsTable
          data={assetsPage?.items ?? []}
          totalCount={assetsPage?.totalItems ?? 0}
          pageNumber={assetsParams.pageNumber ?? 1}
          pageSize={assetsParams.pageSize ?? 10}
          isLoading={loadingAssets}
          onPageChange={(page) =>
            setAssetsParams((p) => ({ ...p, pageNumber: page }))
          }
        />
      </div>

      <SiteFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editData={site}
      />
    </div>
  );
}
