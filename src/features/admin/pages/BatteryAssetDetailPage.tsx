import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBatteryAsset } from "@/features/admin/hooks/useBatteryAsset";
import { useDeleteBatteryAsset } from "@/features/admin/hooks/useDeleteBatteryAsset";
import BatteryRealtimeCard from "@/features/admin/components/BatteryRealtimeCard";
import BatteryAssetForm from "@/features/admin/components/BatteryAssetForm";
import TransferOwnerDialog from "@/features/admin/components/TransferOwnerDialog";
import { BatteryStatusEnum } from "@/features/admin/types/battery-asset.types";
import { toast } from "sonner";

const statusLabel: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Không hoạt động",
  [BatteryStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const { data: asset, isLoading } = useBatteryAsset(id);
  const { mutate: deleteAsset } = useDeleteBatteryAsset();

  if (isLoading)
    return <div className="p-6 text-muted-foreground">Đang tải...</div>;
  if (!asset)
    return <div className="p-6 text-muted-foreground">Không tìm thấy</div>;

  const handleDelete = () => {
    deleteAsset(id, {
      onSuccess: () => {
        toast.success("Đã xóa");
        navigate("/admin/battery-assets");
      },
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">{asset.serialNumber}</h1>
          <p className="text-muted-foreground">{asset.batteryTypeName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Sửa
          </Button>
          <Button variant="outline" onClick={() => setTransferOpen(true)}>
            Transfer
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Xóa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thông tin</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trạng thái</span>
            <Badge>{statusLabel[asset.status]}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Khách hàng</span>
            <span className="font-medium">{asset.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Site</span>
            <span className="font-medium">{asset.siteName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nhóm</span>
            <span className="font-medium">{asset.batteryGroupName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ngày lắp đặt</span>
            <span className="font-medium">
              {asset.installDate.slice(0, 10)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hết bảo hành</span>
            <span className="font-medium">
              {asset.warrantyEndDate?.slice(0, 10) ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vị trí</span>
            <span className="font-medium">{asset.location ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Đọc lần cuối</span>
            <span className="font-medium">
              {asset.lastSensorReadingAt
                ? new Date(asset.lastSensorReadingAt).toLocaleString("vi-VN")
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <BatteryRealtimeCard assetId={id} />

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
    </div>
  );
}
