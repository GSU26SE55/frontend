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
import { toneClass, BATTERY_STATUS_TONE } from "@/shared/theme/statusColors";
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
} from "@/features/admin/types/battery/battery-asset.types";
import { useDeleteBatteryAsset } from "@/features/admin/hooks/battery/useDeleteBatteryAsset";
import { useRestoreBatteryAsset } from "@/features/admin/hooks/battery/useRestoreBatteryAsset";
import { toast } from "sonner";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

const statusLabel: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Không hoạt động",
  [BatteryStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

interface BatteryAssetTableProps {
  items: BatteryAssetDto[];
  pageNumber: number;
  pageSize: number;
  includeDeleted?: boolean;
  onEdit: (item: BatteryAssetDto) => void;
  /** Sort server-side — state từ useUrlSort. */
  sort: ServerSortState;
}

export default function BatteryAssetTable({
  items,
  pageNumber,
  pageSize,
  includeDeleted,
  onEdit,
  sort,
}: BatteryAssetTableProps) {
  const navigate = useNavigate();
  const { mutate: deleteAsset } = useDeleteBatteryAsset();
  const { mutate: restoreAsset } = useRestoreBatteryAsset();
  // BE đã sort toàn dataset (SortBy/SortDir) → render items nguyên trạng.
  const sortKey = sort.sortBy;
  const sortDirection = sort.sortDir;
  const toggleSort = sort.toggleSort;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">
            {TABLE_COLUMNS.index}
          </TableHead>
          <SortableTableHead
            sortKey="serialNumber"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Serial Number
          </SortableTableHead>
          <SortableTableHead
            sortKey="batteryTypeName"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Loại pin
          </SortableTableHead>
          <SortableTableHead
            sortKey="customerName"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Khách hàng
          </SortableTableHead>
          <SortableTableHead
            sortKey="siteName"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Site
          </SortableTableHead>
          <SortableTableHead
            sortKey="status"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Trạng thái
          </SortableTableHead>
          <SortableTableHead
            sortKey="installDate"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Ngày lắp
          </SortableTableHead>
          <TableHead className="text-right">{TABLE_COLUMNS.actions}</TableHead>
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
              <Badge
                variant="outline"
                className={toneClass(
                  BATTERY_STATUS_TONE[item.status] ?? "muted",
                )}
              >
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
                <DropdownMenuContent align="end" className="w-36">
                  {includeDeleted ? (
                    <DropdownMenuItem
                      onClick={() =>
                        restoreAsset(item.id, {
                          onSuccess: () =>
                            toast.success(ADMIN_MESSAGES.common.restored),
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
                            onSuccess: () =>
                              toast.success(ADMIN_MESSAGES.common.deleted),
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
