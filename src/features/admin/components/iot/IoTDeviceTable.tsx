import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EllipsisVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IoTDeviceStatusBadge from "@/shared/components/iot/IoTDeviceStatusBadge";
import ConfirmActionDialog from "@/features/admin/components/common/ConfirmActionDialog";
import { useDeleteIotDevice } from "@/features/admin/hooks/iot/useIotDeviceMutations";
import { handleErrorApi } from "@/shared/lib/errors";
import type { IotDeviceDto } from "@/shared/types/iot/iot.types";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

interface Props {
  items: IotDeviceDto[];
  pageNumber: number;
  pageSize: number;
  /** Sort server-side — state từ useUrlSort. */
  sort: ServerSortState;
}

export default function IoTDeviceTable({
  items,
  pageNumber,
  pageSize,
  sort,
}: Props) {
  const navigate = useNavigate();
  const { mutate: deleteDevice } = useDeleteIotDevice();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // BE đã sort toàn dataset (SortBy/SortDir) → render items nguyên trạng.
  const sortKey = sort.sortBy;
  const sortDirection = sort.sortDir;
  const toggleSort = sort.toggleSort;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">
              {TABLE_COLUMNS.index}
            </TableHead>
            <SortableTableHead
              sortKey="deviceCode"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Device Code
            </SortableTableHead>
            <SortableTableHead
              sortKey="displayName"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Tên hiển thị
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
              sortKey="currentFirmwareVersion"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Firmware
            </SortableTableHead>
            <SortableTableHead
              sortKey="lastSeenAt"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Heartbeat gần nhất
            </SortableTableHead>
            <TableHead className="text-right">
              {TABLE_COLUMNS.actions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/admin/iot-devices/${item.id}`)}
            >
              <TableCell className="text-center text-muted-foreground tabular-nums">
                {(pageNumber - 1) * pageSize + index + 1}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {item.deviceCode}
              </TableCell>
              <TableCell>{item.displayName}</TableCell>
              <TableCell>{item.siteName ?? "—"}</TableCell>
              <TableCell>
                <IoTDeviceStatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-sm">
                {item.currentFirmwareVersion ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.lastSeenAt
                  ? new Date(item.lastSeenAt).toLocaleString("vi-VN")
                  : "Chưa từng"}
              </TableCell>
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
                    <DropdownMenuItem
                      onClick={() => navigate(`/admin/iot-devices/${item.id}`)}
                    >
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/admin/iot-devices/${item.id}/edit`)
                      }
                    >
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setConfirmId(item.id)}
                    >
                      Decommission
                    </DropdownMenuItem>
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
                Không có thiết bị
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ConfirmActionDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="Decommission thiết bị?"
        description="Thiết bị sẽ bị soft-delete, revoke key và chuyển sang Decommissioned. Calibration cascade soft-delete."
        actionLabel="Decommission"
        destructive
        onConfirm={() => {
          if (!confirmId) return;
          deleteDevice(confirmId, {
            onSuccess: () =>
              toast.success(ADMIN_MESSAGES.iot.deviceDecommissioned),
            onError: (error) => handleErrorApi({ error }),
          });
          setConfirmId(null);
        }}
      />
    </>
  );
}
