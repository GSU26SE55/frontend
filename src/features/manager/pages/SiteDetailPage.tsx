import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Battery, Thermometer, Power } from "lucide-react";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { PageContainer } from "@/shared/components/layout/PageContainer";
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
import BmsSwitchControlCard from "@/shared/components/battery/BmsSwitchControlCard";
import SiteBmsSwitchDialog from "@/shared/components/battery/SiteBmsSwitchDialog";
import { useSiteSwitchableAssets } from "@/shared/hooks/battery/useSiteSwitchableAssets";
import { useSiteCascadeSummary } from "@/features/manager/hooks/battery/useSiteCascadeSummary";
import {
  useSiteDetail,
  useSiteDashboard,
  useSiteAssets,
} from "@/features/manager/hooks/site/useSites";
import type { SiteAssetsFilterParams } from "@/shared/types/site/site.types";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

const ASSET_STATUS_ALL = "all";
const ASSET_STATUS_LABELS: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Active",
  [BatteryStatusEnum.Inactive]: "Inactive",
  [BatteryStatusEnum.Decommissioned]: "Decommissioned",
};

export default function ManagerSiteDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Tab + evidence window live in the URL, not in local state. A ticket links straight to
  // "?tab=ambient&from=…&to=…" to land the reader on the Environment tab already filtered to
  // the incident window; with an uncontrolled <Tabs defaultValue>, that link opened the
  // Battery list every time and the from/to pair had nothing reading it.
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "ambient" ? "ambient" : "assets";
  const ambientFrom = searchParams.get("from") ?? undefined;
  const ambientTo = searchParams.get("to") ?? undefined;

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  // Dropping the window keeps the reader on the Environment tab and restores the full log.
  const clearAmbientWindow = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("from");
    next.delete("to");
    // No longer emitted, but still cleared: a bookmarked link from before may carry it.
    next.delete("windowLabel");
    setSearchParams(next, { replace: true });
  };

  const [assetsParams, setAssetsParams] = useState<SiteAssetsFilterParams>({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [siteBmsOpen, setSiteBmsOpen] = useState(false);
  // Only fetched once the dialog opens — see useSiteSwitchableAssets.
  const { data: siteAssets, isLoading: loadingSiteAssets } =
    useSiteSwitchableAssets(id, siteBmsOpen);

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
      <PageContainer>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-64" />
        <Card className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (!site) {
    return (
      <PageContainer>
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <MapPin className="size-8 opacity-30" />
          <span className="text-sm">Site not found.</span>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-3.5" /> Back
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
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
          <div className="flex items-center gap-2">
            {/* Cut charge/discharge across the site's batteries — the dialog lists them and the
                operator picks which ones. Reaching this through each battery's own screen is too
                many steps when a cabinet-level fault is the call being made. */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSiteBmsOpen(true)}
            >
              <Power className="size-3.5 text-destructive" />
              BMS
            </Button>
            {/* Covers both tabs: KEY.sites carries the site data, KEY.ambient the
               Environment strip and history table. */}
            <RefreshButton queryKeys={[KEY.sites, KEY.ambient]} />
          </div>
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
      <Tabs value={tab} onValueChange={setTab}>
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
              pageSize={assetsParams.pageSize ?? DEFAULT_PAGE_SIZE}
              isLoading={loadingAssets}
              onPageChange={(page) =>
                setAssetsParams((p) => ({ ...p, pageNumber: page }))
              }
              onPageSizeChange={(size) =>
                setAssetsParams((p) => ({
                  ...p,
                  pageNumber: 1,
                  pageSize: size,
                }))
              }
              onAssetClick={(asset) =>
                navigate(`/manager/battery-assets/${asset.id}`)
              }
              showDetailChevron={false}
              // Manager has no CRUD on battery assets (Edit/Transfer/Delete are Admin-only) —
              // the only quick action available is the BMS charge/discharge switch, same scope
              // as the header control on the detail page.
              renderActions={(asset) => (
                <BmsSwitchControlCard assetId={asset.id} />
              )}
            />
          </Card>
        </TabsContent>

        <TabsContent value="ambient" className="mt-4">
          <AmbientSitePanel
            siteId={id}
            from={ambientFrom}
            to={ambientTo}
            onClearWindow={
              ambientFrom || ambientTo ? clearAmbientWindow : undefined
            }
          />
        </TabsContent>
      </Tabs>

      <SiteBmsSwitchDialog
        assets={siteAssets?.assets ?? []}
        truncated={siteAssets?.truncated}
        isLoading={loadingSiteAssets}
        open={siteBmsOpen}
        onOpenChange={setSiteBmsOpen}
      />
    </PageContainer>
  );
}
