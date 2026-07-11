import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import {
  BatteryStatusEnum,
  type BatteryAssetDto,
} from "@/shared/types/battery.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

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

interface SiteAssetsTableProps {
  data: BatteryAssetDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export default function SiteAssetsTable({
  data,
  totalCount,
  pageNumber,
  pageSize,
  isLoading,
  onPageChange,
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
      cell: (asset) => (
        <Badge variant={STATUS_VARIANT[asset.status]}>
          {STATUS_LABEL[asset.status]}
        </Badge>
      ),
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

  return (
    <div className="space-y-2">
      <DataTable
        data={data}
        columns={columns}
        rowKey={(asset) => asset.id}
        showIndex
        pageNumber={pageNumber}
        pageSize={pageSize}
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
