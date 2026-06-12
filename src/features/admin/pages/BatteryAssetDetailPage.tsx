import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Battery } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatteryAsset } from "@/features/admin/hooks/useBatteryAsset";
import { useDeleteBatteryAsset } from "@/features/admin/hooks/useDeleteBatteryAsset";
import BatteryRealtimeCard from "@/features/admin/components/BatteryRealtimeCard";
import BatteryAssetForm from "@/features/admin/components/BatteryAssetForm";
import TransferOwnerDialog from "@/features/admin/components/TransferOwnerDialog";
import SensorChart from "@/features/admin/components/SensorChart";
import SensorHistoryTable from "@/features/admin/components/SensorHistoryTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { BatteryStatusEnum } from "@/features/admin/types/battery-asset.types";

const statusLabel: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoat dong",
  [BatteryStatusEnum.Inactive]: "Khong hoat dong",
  [BatteryStatusEnum.Decommissioned]: "Ngung su dung",
};

const statusVariant: Record<
  BatteryStatusEnum,
  "default" | "secondary" | "destructive"
> = {
  [BatteryStatusEnum.Active]: "default",
  [BatteryStatusEnum.Inactive]: "secondary",
  [BatteryStatusEnum.Decommissioned]: "destructive",
};

export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: asset, isLoading } = useBatteryAsset(id);
  const { mutate: deleteAsset } = useDeleteBatteryAsset();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <Card>
          <CardContent className="space-y-3 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <Battery className="size-8 opacity-30" />
          <span className="text-sm">Khong tim thay battery asset.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/battery-assets")}
          >
            <ArrowLeft className="size-3.5" /> Quay lai
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteAsset(id, {
      onSuccess: () => {
        toast.success("Da xoa");
        navigate("/admin/battery-assets");
      },
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back + header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-3.5" /> Quay lai
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {asset.serialNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {asset.batteryTypeName}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              Sua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(true)}
            >
              Transfer
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Xoa
            </Button>
          </div>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thong tin</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trang thai</span>
            <Badge variant={statusVariant[asset.status]}>
              {statusLabel[asset.status]}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Khach hang</span>
            <span className="font-medium">{asset.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Site</span>
            <span className="font-medium">{asset.siteName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ngay lap dat</span>
            <span className="font-medium tabular-nums">
              {asset.installDate.slice(0, 10)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Het bao hanh</span>
            <span className="font-medium tabular-nums">
              {asset.warrantyEndDate?.slice(0, 10) ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vi tri</span>
            <span className="font-medium">{asset.location ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Doc lan cuoi</span>
            <span className="font-medium tabular-nums">
              {asset.lastSensorReadingAt
                ? new Date(asset.lastSensorReadingAt).toLocaleString("vi-VN")
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <BatteryRealtimeCard assetId={id} />

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Bieu do</TabsTrigger>
          <TabsTrigger value="history">Lich su cam bien</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="mt-4">
          <SensorChart assetId={id} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <SensorHistoryTable assetId={id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BatteryAssetForm
        open={editOpen}
        onOpenChange={setEditOpen}
        editData={asset}
      />
      <TransferOwnerDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        assetId={id}
        currentCustomerId={asset.customerId}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoa battery asset?</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac muon xoa <strong>{asset.serialNumber}</strong>? Hanh
              dong nay khong the hoan tac.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Xoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
