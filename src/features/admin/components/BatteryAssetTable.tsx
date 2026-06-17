import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BatteryStatusEnum,
  type BatteryAssetDto,
} from "@/features/admin/types/battery-asset.types";
import { useDeleteBatteryAsset } from "@/features/admin/hooks/useDeleteBatteryAsset";
import { useRestoreBatteryAsset } from "@/features/admin/hooks/useRestoreBatteryAsset";
import { toast } from "sonner";

const statusLabel: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Không hoạt động",
  [BatteryStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

const statusVariant: Record<
  BatteryStatusEnum,
  "default" | "secondary" | "destructive"
> = {
  [BatteryStatusEnum.Active]: "default",
  [BatteryStatusEnum.Inactive]: "secondary",
  [BatteryStatusEnum.Decommissioned]: "destructive",
};

interface BatteryAssetTableProps {
  items: BatteryAssetDto[];
  pageNumber: number;
  pageSize: number;
  includeDeleted?: boolean;
  onEdit: (item: BatteryAssetDto) => void;
}

export default function BatteryAssetTable({
  items,
  pageNumber,
  pageSize,
  includeDeleted,
  onEdit,
}: BatteryAssetTableProps) {
  const navigate = useNavigate();
  const { mutate: deleteAsset } = useDeleteBatteryAsset();
  const { mutate: restoreAsset } = useRestoreBatteryAsset();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">STT</TableHead>
          <TableHead>Serial Number</TableHead>
          <TableHead>Loại pin</TableHead>
          <TableHead>Khách hàng</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày lắp</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow
            key={item.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/admin/battery-assets/${item.id}`)}
          >
            <TableCell className="text-center text-muted-foreground tabular-nums">
              {(pageNumber - 1) * pageSize + index + 1}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {item.serialNumber}
            </TableCell>
            <TableCell>{item.batteryTypeName}</TableCell>
            <TableCell>{item.customerName}</TableCell>
            <TableCell>{item.siteName ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[item.status]}>
                {statusLabel[item.status]}
              </Badge>
            </TableCell>
            <TableCell>{item.installDate.slice(0, 10)}</TableCell>
            <TableCell
              className="text-right"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-7" />
                  }
                >
                  <EllipsisVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {includeDeleted ? (
                    <DropdownMenuItem
                      onClick={() =>
                        restoreAsset(item.id, {
                          onSuccess: () => toast.success("Đã khôi phục"),
                        })
                      }
                    >
                      Khôi phục
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() =>
                          deleteAsset(item.id, {
                            onSuccess: () => toast.success("Đã xóa"),
                          })
                        }
                      >
                        Xóa
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-muted-foreground py-8"
            >
              Không có dữ liệu
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
