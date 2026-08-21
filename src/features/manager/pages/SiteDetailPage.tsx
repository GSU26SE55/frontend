import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Battery, Thermometer } from "lucide-react";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SiteDashboardCard from "@/shared/components/site/SiteDashboardCard";
import SiteAssetsTable from "@/shared/components/site/SiteAssetsTable";
import { AmbientSitePanel } from "@/shared/components/ambient/AmbientConfigView";
import CascadeRiskSummary from "@/shared/components/dashboard/CascadeRiskSummary";
import { useSiteCascadeSummary } from "@/features/manager/hooks/battery/useSiteCascadeSummary";
import {
  useSiteDetail,
  useSiteDashboard,
  useSiteAssets,
} from "@/features/manager/hooks/site/useSites";
import type { SiteAssetsFilterParams } from "@/shared/types/site/site.types";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";

const ASSET_STATUS_ALL = "all";
const ASSET_STATUS_LABELS: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Active",
  [BatteryStatusEnum.Inactive]: "Inactive",
  [BatteryStatusEnum.Decommissioned]: "Decommissioned",
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
  const { data: cascade, isLoading: loadingCascade } =
    useSiteCascadeSummary(id);
  const { data: assetsPage, isLoading: loadingAssets } = useSiteAssets(
    id,
    assetsParams,
  );

  if (loadingSite) {
    return (
      <div className="p-6 space-y-6 max-w-360 mx-auto">
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
      <div className="p-6 max-w-360 mx-auto">
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <MapPin className="size-8 opacity-30" />
          <span className="text-sm">Site not found.</span>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-3.5" /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      {/* Back + header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-3.5" /> Back
          </Button>
          <RefreshButton queryKeys={[KEY.sites]} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          {site.address && <span>{site.address}</span>}
          {site.customerName && <span>&middot; {site.customerName}</span>}
        </div>
      </div>

      {/* Top Summary Grid (Side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {dashboard && <SiteDashboardCard data={dashboard} />}
        <CascadeRiskSummary summary={cascade} isLoading={loadingCascade} />
      </div>

      {/* Batteries + Environment */}
      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">
            <Battery className="size-3.5" /> Battery list
          </TabsTrigger>
          <TabsTrigger value="ambient">
            <Thermometer className="size-3.5" /> Environment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4 space-y-3">
          <div className="flex items-center justify-end">
            <Select
              value={
                assetsParams.status != null
                  ? String(assetsParams.status)
                  : ASSET_STATUS_ALL
              }
              items={[
                { value: ASSET_STATUS_ALL, label: "All statuses" },
                ...Object.entries(ASSET_STATUS_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  }),
                ),
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ASSET_STATUS_ALL}>All statuses</SelectItem>
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
              siteId={id}
              data={assetsPage?.items ?? []}
              totalCount={assetsPage?.totalItems ?? 0}
              pageNumber={assetsParams.pageNumber ?? 1}
              pageSize={assetsParams.pageSize ?? 10}
              isLoading={loadingAssets}
              onPageChange={(page) =>
                setAssetsParams((p) => ({ ...p, pageNumber: page }))
              }
              onAssetClick={(asset) =>
                navigate(`/manager/battery-assets/${asset.id}`)
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="ambient" className="mt-4">
          <AmbientSitePanel siteId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
