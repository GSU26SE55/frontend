import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import {
  BatteryStatusEnum,
  type BatteryAssetDto,
} from "@/shared/types/battery/battery.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { toneClass } from "@/shared/theme/statusColors";

const STATUS_LABEL: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Không hoạt động",
  [BatteryStatusEnum.Decommissioned]: "Đã ngừng",
};

const STATUS_VARIANT: Record<
  BatteryStatusEnum,
  "default" | "secondary" | "destructive"
> = {
  [BatteryStatusEnum.Active]: "default",
  [BatteryStatusEnum.Inactive]: "secondary",
  [BatteryStatusEnum.Decommissioned]: "destructive",
};

// `status` là vòng đời nghiệp vụ (Active/Suspended/Decommissioned), admin tự tay
// đặt — KHÔNG tự đổi theo kết nối. Vì vậy pin "Active" vẫn có thể ngừng gửi dữ
// liệu (dây đứt, mất điện, hỏng cảm biến) mà cột status trong DB không hề biết.
// Badge "Hoạt động" mà đứng cạnh "Đọc cuối" đã cũ hàng ngày là tự mâu thuẫn ngay
// trên cùng 1 hàng — che badge đó bằng "Mất kết nối" khi rơi vào tình huống đó.
// Ngưỡng khớp mặc định `OfflineThresholdMinutes` phía BE (xem docs/api-battery.md,
// mục offlineAssets) — chỉ dùng để HIỂN THỊ, không phải nguồn cảnh báo thật.
const OFFLINE_THRESHOLD_MINUTES = 10;

function isReadingStale(lastSensorReadingAt: string | null | undefined) {
  if (!lastSensorReadingAt) return true; // chưa từng có reading nào → coi như mất kết nối
  const ageMs = Date.now() - new Date(lastSensorReadingAt).getTime();
  return ageMs > OFFLINE_THRESHOLD_MINUTES * 60_000;
}

interface SiteAssetsTableProps {
  data: BatteryAssetDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  /** Click 1 cục pin → mở chi tiết. Bỏ → hàng không click được. */
  onAssetClick?: (asset: BatteryAssetDto) => void;
}

export default function SiteAssetsTable({
  data,
  totalCount,
  pageNumber,
  pageSize,
  isLoading,
  onPageChange,
  onAssetClick,
}: SiteAssetsTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Chưa có pin nào.
      </p>
    );
  }

  const columns: ColumnDef<BatteryAssetDto>[] = [
    {
      id: "serialNumber",
      header: "Số seri",
      cell: (asset) => asset.serialNumber,
      cellClassName: "font-mono text-sm",
    },
    {
      id: "batteryTypeName",
      header: "Loại pin",
      cell: (asset) => asset.batteryTypeName,
    },
    {
      id: "status",
      header: TABLE_COLUMNS.status,
      cell: (asset) => {
        const offline =
          asset.status === BatteryStatusEnum.Active &&
          isReadingStale(asset.lastSensorReadingAt);
        return offline ? (
          <Badge
            variant="outline"
            className={toneClass("p3")}
            title="Status Active trong hồ sơ, nhưng không có sensor reading nào gần đây"
          >
            Mất kết nối
          </Badge>
        ) : (
          <Badge variant={STATUS_VARIANT[asset.status]}>
            {STATUS_LABEL[asset.status]}
          </Badge>
        );
      },
    },
    {
      id: "installDate",
      header: "Ngày lắp",
      cell: (asset) => format(new Date(asset.installDate), "dd/MM/yyyy"),
    },
    {
      id: "lastSensorReadingAt",
      header: "Đọc cuối",
      cell: (asset) =>
        asset.lastSensorReadingAt
          ? format(new Date(asset.lastSensorReadingAt), "dd/MM/yyyy HH:mm")
          : "—",
    },
  ];

  if (onAssetClick) {
    columns.push({
      id: "chevron",
      header: "",
      headClassName: "w-8",
      cellClassName: "text-muted-foreground",
      cell: () => <ChevronRight className="size-4" />,
    });
  }

  return (
    <div className="space-y-2">
      <DataTable
        data={data}
        columns={columns}
        rowKey={(asset) => asset.id}
        showIndex
        pageNumber={pageNumber}
        pageSize={pageSize}
        onRowClick={onAssetClick}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            {pageNumber} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageNumber + 1)}
            disabled={pageNumber >= totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
