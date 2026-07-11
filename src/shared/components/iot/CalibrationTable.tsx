import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useDeleteCalibration } from "@/shared/hooks/useIotCalibrationMutations";
import { handleErrorApi } from "@/shared/lib/errors";
import type { IotDeviceCalibrationDto } from "@/shared/types/iot.types";
import { ACTIONS } from "@/shared/constants/actions";

interface Props {
  deviceId: string;
  items: IotDeviceCalibrationDto[];
  canDelete?: boolean;
}

export default function CalibrationTable({
  deviceId,
  items,
  canDelete = true,
}: Props) {
  const { mutate: deleteCalibration } = useDeleteCalibration(deviceId);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead>Scale</TableHead>
            <TableHead>Offset</TableHead>
            <TableHead>Đơn vị</TableHead>
            <TableHead>Calibrated</TableHead>
            <TableHead>Hết hạn</TableHead>
            {canDelete && <TableHead className="text-right">Xóa</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.channel}</TableCell>
              <TableCell className="tabular-nums">{item.scale}</TableCell>
              <TableCell className="tabular-nums">{item.offset}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell className="text-sm">
                {item.calibratedAt.slice(0, 10)}
              </TableCell>
              <TableCell className="text-sm">
                {item.expiresAt ? item.expiresAt.slice(0, 10) : "—"}
              </TableCell>
              {canDelete && (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => setConfirmId(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={canDelete ? 7 : 6}
                className="text-center text-muted-foreground py-8"
              >
                Chưa có calibration
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa calibration?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ACTIONS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!confirmId) return;
                deleteCalibration(confirmId, {
                  onSuccess: () => toast.success("Đã xóa calibration"),
                  onError: (error) => handleErrorApi({ error }),
                });
                setConfirmId(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
