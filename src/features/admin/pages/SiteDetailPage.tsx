import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import SiteDashboardCard from "@/shared/components/site/SiteDashboardCard";
import SiteAssetsTable from "@/shared/components/site/SiteAssetsTable";
import CascadeRiskSummary from "@/shared/components/dashboard/CascadeRiskSummary";
import SiteFormDialog from "@/features/admin/components/SiteFormDialog";
import { useSiteCascadeSummary } from "@/features/admin/hooks/useSiteCascadeSummary";
import {
  useSiteDetail,
  useSiteDashboard,
  useSiteAssets,
  useDeleteSite,
  useRestoreSite,
} from "@/features/admin/hooks/useSites";
import { SiteStatusEnum } from "@/shared/types/site.types";
import type { SiteAssetsFilterParams } from "@/shared/types/site.types";
import { BatteryStatusEnum } from "@/shared/enums/battery.enum";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

const ASSET_STATUS_ALL = "all";
const ASSET_STATUS_LABELS: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Tạm ngừng",
  [BatteryStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

type ConfirmState = { type: "none" } | { type: "delete" } | { type: "restore" };

export default function SiteDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({ type: "none" });
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
  const { data: cascade, isLoading: loadingCascade } =
    useSiteCascadeSummary(id);

  const { mutate: deleteSite } = useDeleteSite();
  const { mutate: restoreSite } = useRestoreSite();

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
          <span className="text-sm">Không tìm thấy site.</span>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-3.5" /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const isDecommissioned = site.status === SiteStatusEnum.Decommissioned;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      {/* Back + header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-3.5" /> Quay lại
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
            <RefreshButton queryKeys={[KEY.sites]} size="icon" />
            {isDecommissioned ? (
              <>
                <Badge variant="destructive">Da ngung</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm({ type: "restore" })}
                >
                  Khôi phục
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  Sửa
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirm({ type: "delete" })}
                >
                  Xóa
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard summary */}
      {dashboard && <SiteDashboardCard data={dashboard} />}

      {/* Cascade risk summary */}
      <CascadeRiskSummary summary={cascade} isLoading={loadingCascade} />

      {/* Assets table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Danh sách pin</h2>
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

      {/* Dialogs */}
      <SiteFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editData={site}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={confirm.type === "delete"}
        onOpenChange={(open) => !open && setConfirm({ type: "none" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa site?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa site <strong>{site.name}</strong>?
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
              Xóa
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
            <AlertDialogTitle>Khôi phục site?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn khôi phục site <strong>{site.name}</strong>?
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
              Khôi phục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
