import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BatteryStatusEnum,
  type BatteryAssetDto,
} from "@/shared/types/battery.types";

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

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">STT</TableHead>
            <TableHead>Số seri</TableHead>
            <TableHead>Loại pin</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày lắp</TableHead>
            <TableHead>Đọc cuối</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((asset, index) => (
            <TableRow key={asset.id}>
              <TableCell className="text-center text-muted-foreground tabular-nums">
                {(pageNumber - 1) * pageSize + index + 1}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {asset.serialNumber}
              </TableCell>
              <TableCell>{asset.batteryTypeName}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[asset.status]}>
                  {STATUS_LABEL[asset.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(asset.installDate), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>
                {asset.lastSensorReadingAt
                  ? format(
                      new Date(asset.lastSensorReadingAt),
                      "dd/MM/yyyy HH:mm",
                    )
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
