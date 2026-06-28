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
import ConfirmActionDialog from "@/features/admin/components/ConfirmActionDialog";
import { useDeleteIotDevice } from "@/features/admin/hooks/useIotDeviceMutations";
import { handleErrorApi } from "@/shared/lib/errors";
import type { IotDeviceDto } from "@/shared/types/iot.types";

interface Props {
  items: IotDeviceDto[];
  pageNumber: number;
  pageSize: number;
}

export default function IoTDeviceTable({ items, pageNumber, pageSize }: Props) {
  const navigate = useNavigate();
  const { mutate: deleteDevice } = useDeleteIotDevice();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">STT</TableHead>
            <TableHead>Device Code</TableHead>
            <TableHead>Tên hiển thị</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Firmware</TableHead>
            <TableHead>Heartbeat gần nhất</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
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
                  <DropdownMenuContent align="end" className="w-48">
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
            onSuccess: () => toast.success("Đã decommission thiết bị"),
            onError: (error) => handleErrorApi({ error }),
          });
          setConfirmId(null);
        }}
      />
    </>
  );
}
