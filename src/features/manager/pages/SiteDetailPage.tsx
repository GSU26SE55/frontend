import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SiteDashboardCard from "@/shared/components/common/SiteDashboardCard";
import SiteAssetsTable from "@/shared/components/common/SiteAssetsTable";
import {
  useSiteDetail,
  useSiteDashboard,
  useSiteAssets,
} from "@/features/manager/hooks/useSites";
import type { SiteAssetsFilterParams } from "@/shared/types/site.types";
import { BatteryStatusEnum } from "@/shared/enums/battery.enum";

const ASSET_STATUS_ALL = "all";
const ASSET_STATUS_LABELS: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Tạm ngừng",
  [BatteryStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

export default function ManagerSiteDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assetsParams, setAssetsParams] = useState<SiteAssetsFilterParams>({
    pageNumber: 1,
    pageSize: 10,
  });

  const { data: site, isLoading: loadingSite } = useSiteDetail(id);
  const { data: dashboard } = useSiteDashboard(id);
  const { data: assetsPage, isLoading: loadingAssets } = useSiteAssets(
    id,
    assetsParams,
  );

  if (loadingSite) {
    return (
      <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-64" />
        <Card className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <MapPin className="size-8 opacity-30" />
          <span className="text-sm">Khong tim thay site.</span>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-3.5" /> Quay lai
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* Back + header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-3.5" /> Quay lai
          </Button>
          <RefreshButton queryKeys={[KEY.sites]} size="icon" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          {site.address && <span>{site.address}</span>}
          {site.customerName && <span>&middot; {site.customerName}</span>}
        </div>
      </div>

      {/* Dashboard summary */}
      {dashboard && <SiteDashboardCard data={dashboard} />}

      {/* Assets table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Danh sach pin</h2>
          <Select
            value={
              assetsParams.status != null
                ? String(assetsParams.status)
                : ASSET_STATUS_ALL
            }
            items={[
              { value: ASSET_STATUS_ALL, label: "Mọi trạng thái" },
              ...Object.entries(ASSET_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
            onValueChange={(v) =>
              setAssetsParams((p) => ({
                ...p,
                pageNumber: 1,
                status:
                  v === ASSET_STATUS_ALL
                    ? undefined
                    : (Number(v) as BatteryStatusEnum),
              }))
            }
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ASSET_STATUS_ALL}>Mọi trạng thái</SelectItem>
              {Object.entries(ASSET_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Card>
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
        </Card>
      </div>
    </div>
  );
}
