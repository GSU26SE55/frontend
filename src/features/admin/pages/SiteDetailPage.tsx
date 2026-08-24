import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Battery, Thermometer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
import SiteFormDialog from "@/features/admin/components/site/SiteFormDialog";
import BatteryAssetForm from "@/features/admin/components/battery/BatteryAssetForm";
import { useSiteCascadeSummary } from "@/features/admin/hooks/battery/useSiteCascadeSummary";
import {
  useSiteDetail,
  useSiteDashboard,
  useSiteAssets,
  useDeleteSite,
  useRestoreSite,
} from "@/features/admin/hooks/site/useSites";
import { SiteStatusEnum } from "@/shared/types/site/site.types";
import type { SiteAssetsFilterParams } from "@/shared/types/site/site.types";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

const ASSET_STATUS_ALL = "all";
const ASSET_STATUS_LABELS: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Active",
  [BatteryStatusEnum.Inactive]: "Suspended",
  [BatteryStatusEnum.Decommissioned]: "Decommissioned",
};

type ConfirmState = { type: "none" } | { type: "delete" } | { type: "restore" };

export default function SiteDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({ type: "none" });
  const [assetsParams, setAssetsParams] = useState<SiteAssetsFilterParams>({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const { data: site, isLoading: loadingSite } = useSiteDetail(id);
  const { data: dashboard } = useSiteDashboard(id);
  const { data: assetsPage, isLoading: loadingAssets } = useSiteAssets(
    id,
    assetsParams,
  );
  const { data: cascade, isLoading: loadingCascade } =
    useSiteCascadeSummary(id);

  const { mutate: deleteSite } = useDeleteSite();
  const { mutate: restoreSite } = useRestoreSite();

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

  const isDecommissioned = site.status === SiteStatusEnum.Decommissioned;

  return (
    <PageContainer>
      {/* Back + header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-3.5" /> Back
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {site.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {site.address && <span>{site.address}</span>}
              {site.customerName && <span>&middot; {site.customerName}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RefreshButton queryKeys={[KEY.sites]} />
            {isDecommissioned ? (
              <>
                <Badge variant="destructive">Decommissioned</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm({ type: "restore" })}
                >
                  Restore
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirm({ type: "delete" })}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Summary Grid (Side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {dashboard && <SiteDashboardCard data={dashboard} />}
        <CascadeRiskSummary summary={cascade} isLoading={loadingCascade} />
      </div>

      {/* Battery + Environment */}
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
          <div className="flex items-center justify-end gap-2">
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
            <Button size="sm" onClick={() => setAssetFormOpen(true)}>
              <Plus className="size-3.5" /> Add battery
            </Button>
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
                navigate(`/admin/battery-assets/${asset.id}`)
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="ambient" className="mt-4">
          <AmbientSitePanel siteId={id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SiteFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editData={site}
      />

      {/* Add a battery to the currently open site — siteId is pre-filled and cannot be changed. */}
      <BatteryAssetForm
        open={assetFormOpen}
        onOpenChange={setAssetFormOpen}
        lockedSiteId={id}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={confirm.type === "delete"}
        onOpenChange={(open) => !open && setConfirm({ type: "none" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete site?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete site <strong>{site.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm({ type: "none" })} />
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                deleteSite(site.id, {
                  onSuccess: () => navigate("/admin/sites"),
                });
                setConfirm({ type: "none" });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore confirm */}
      <AlertDialog
        open={confirm.type === "restore"}
        onOpenChange={(open) => !open && setConfirm({ type: "none" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore site?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore site <strong>{site.name}</strong>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm({ type: "none" })} />
            <AlertDialogAction
              onClick={() => {
                restoreSite(site.id);
                setConfirm({ type: "none" });
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
