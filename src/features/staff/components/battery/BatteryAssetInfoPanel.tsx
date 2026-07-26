import { Link } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BatteryFull, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStaffBatteryAsset } from "@/features/staff/hooks/battery/useBatteryAsset";
import {
  BatteryStatusEnum,
  WarrantyStatusEnum,
} from "@/features/staff/types/battery/battery-asset.types";
import BatteryUsageHistoryPanel from "@/features/staff/components/battery/BatteryUsageHistoryPanel";
import BatteryWarningEvidencePanel from "@/shared/components/battery/BatteryWarningEvidencePanel";

const STATUS_LABEL: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Không hoạt động",
  [BatteryStatusEnum.Decommissioned]: "Đã ngừng",
};

const WARRANTY_LABEL: Record<WarrantyStatusEnum, string> = {
  [WarrantyStatusEnum.ACTIVE]: "Còn bảo hành",
  [WarrantyStatusEnum.EXPIRED]: "Hết bảo hành",
  [WarrantyStatusEnum.VOID]: "Vô hiệu",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

interface Props {
  batteryAssetId?: string | null;
  /** Thời điểm phát hiện sự cố (ticket.detectedAt) — để hiện log bằng chứng warning. */
  detectedAt?: string | null;
}

export default function BatteryAssetInfoPanel({
  batteryAssetId,
  detectedAt,
}: Props) {
  const {
    data: asset,
    isLoading,
    isError,
  } = useStaffBatteryAsset(batteryAssetId);

  if (!batteryAssetId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Ticket này không gắn với thiết bị pin nào.
      </p>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (isError || !asset) {
    return (
      <p className="text-sm text-destructive text-center py-6">
        Không tải được thông tin thiết bị pin.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BatteryFull className="size-4 text-muted-foreground" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Thông tin thiết bị pin
        </p>
        <Badge variant="outline" className="ml-auto text-[11px] font-normal">
          {STATUS_LABEL[asset.status] ?? asset.status}
        </Badge>
      </div>

      {/* Mở trang chi tiết real-time (live telemetry + chart + AI) cho đúng pin gắn ticket. */}
      <Link
        to={`/staff/battery-assets/${batteryAssetId}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full mb-3",
        )}
      >
        <Activity className="size-3.5" />
        Xem chi tiết real-time
      </Link>
      <div className="divide-y divide-border/50">
        <InfoRow label="Số seri" value={asset.serialNumber} />
        <InfoRow label="Loại pin" value={asset.batteryTypeName} />
        <InfoRow label="Site" value={asset.siteName} />
        <InfoRow label="Khách hàng" value={asset.customerName} />
        <InfoRow
          label="Ngày lắp đặt"
          value={format(new Date(asset.installDate), "dd/MM/yyyy", {
            locale: vi,
          })}
        />
        <InfoRow
          label="Bảo hành"
          value={
            <>
              {WARRANTY_LABEL[asset.warrantyStatus] ?? asset.warrantyStatus}
              {asset.warrantyEndDate &&
                ` (đến ${format(new Date(asset.warrantyEndDate), "dd/MM/yyyy")})`}
            </>
          }
        />
      </div>

      <div className="mt-5">
        <BatteryWarningEvidencePanel
          batteryAssetId={batteryAssetId}
          detectedAt={detectedAt}
        />
      </div>

      <div className="mt-5">
        <BatteryUsageHistoryPanel batteryAssetId={batteryAssetId} />
      </div>
    </div>
  );
}
