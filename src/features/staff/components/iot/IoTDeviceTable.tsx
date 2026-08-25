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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IoTDeviceStatusBadge from "@/shared/components/iot/IoTDeviceStatusBadge";
import DeviceKeyRevealDialog from "@/features/staff/components/iot/DeviceKeyRevealDialog";
import {
  fromCreatedDto,
  fromDetailDto,
  type DeviceSecrets,
} from "@/features/staff/components/iot/deviceSecrets";
import ConfirmActionDialog from "@/features/staff/components/common/ConfirmActionDialog";
import { staffIotDeviceService } from "@/features/staff/services/iot/iot-device.service";
import {
  useRotateIotDeviceKey,
  useRotateIotDeviceMqtt,
} from "@/features/staff/hooks/iot/useIotDeviceMutations";
import { handleErrorApi } from "@/shared/lib/errors";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";
import { formatRelativeTime } from "@/shared/utils/iotDeviceHealth";
import type { IotDeviceDto } from "@/shared/types/iot/iot.types";

interface Props {
  items: IotDeviceDto[];
}

/** Renders the three per-row quick actions (view details / rotate mqtt / rotate key) for one row. */
function DeviceActionsMenu({ device }: { device: IotDeviceDto }) {
  const { mutate: rotateKey } = useRotateIotDeviceKey(device.id);
  const { mutate: rotateMqtt } = useRotateIotDeviceMqtt(device.id);
  const [revealed, setRevealed] = useState<DeviceSecrets | null>(null);
  const [confirm, setConfirm] = useState<"rotate" | "rotate-mqtt" | null>(null);
  const isDecommissioned = device.status === IotDeviceStatusEnum.Decommissioned;

  const handleViewDetails = async () => {
    try {
      const res = await staffIotDeviceService.getById(device.id);
      if (res.data.data) setRevealed(fromDetailDto(res.data.data));
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-7" />}
        >
          <EllipsisVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => void handleViewDetails()}>
            View details
          </DropdownMenuItem>
          {!isDecommissioned && (
            <DropdownMenuItem onClick={() => setConfirm("rotate-mqtt")}>
              Rotate MQTT key
            </DropdownMenuItem>
          )}
          {!isDecommissioned && (
            <DropdownMenuItem onClick={() => setConfirm("rotate")}>
              Rotate key
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeviceKeyRevealDialog
        open={!!revealed}
        onOpenChange={(o) => !o && setRevealed(null)}
        device={revealed}
      />
      <ConfirmActionDialog
        open={confirm === "rotate-mqtt"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Rotate MQTT key?"
        description="Changes only the MQTT username/password. The API key STAYS THE SAME, so the device calls /provision itself to fetch the new password — NO site visit needed. While it waits, the device temporarily loses MQTT but keeps sending data over HTTPS."
        actionLabel="Rotate MQTT key"
        onConfirm={() => {
          setConfirm(null);
          rotateMqtt(undefined, {
            onSuccess: (res) => {
              if (res.data) setRevealed(fromCreatedDto(res.data));
              toast.success(
                "MQTT key rotated. The device will re-provision itself.",
              );
            },
            onError: (error) => handleErrorApi({ error }),
          });
        }}
      />
      <ConfirmActionDialog
        open={confirm === "rotate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Rotate API key?"
        description="Changes BOTH the API key AND the MQTT key. The device loses both channels and CANNOT recover on its own — someone must go on site with a cable and flash the new API key. Use this only when the API key is suspected leaked; to change just the MQTT key use Rotate MQTT key."
        actionLabel="Rotate"
        onConfirm={() => {
          setConfirm(null);
          rotateKey(undefined, {
            onSuccess: (res) => {
              if (res.data) setRevealed(fromCreatedDto(res.data));
              toast.success("API key rotated.");
            },
            onError: (error) => handleErrorApi({ error }),
          });
        }}
      />
    </>
  );
}

export default function IoTDeviceTable({ items }: Props) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Firmware</TableHead>
          <TableHead>Last seen</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((d) => {
          // Firmware đích khác bản đang chạy ⇒ đang chờ OTA. Không nói ra thì người trực
          // sẽ tưởng thiết bị đã lên bản mới vì admin "đã bấm cập nhật rồi".
          const otaPending =
            !!d.targetFirmwareVersion &&
            d.targetFirmwareVersion !== d.currentFirmwareVersion;
          return (
            <TableRow
              key={d.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/staff/iot-devices/${d.id}`)}
            >
              <TableCell className="font-mono text-xs">
                {d.deviceCode}
              </TableCell>
              <TableCell>{d.displayName}</TableCell>
              <TableCell className="text-muted-foreground">
                {d.siteName ?? "—"}
              </TableCell>
              <TableCell>
                <IoTDeviceStatusBadge status={d.status} />
              </TableCell>
              <TableCell className="text-xs">
                {d.currentFirmwareVersion ?? "—"}
                {otaPending && (
                  <span className="ml-1 text-amber-600">
                    → {d.targetFirmwareVersion}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatRelativeTime(d.lastSeenAt)}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <DeviceActionsMenu device={d} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
