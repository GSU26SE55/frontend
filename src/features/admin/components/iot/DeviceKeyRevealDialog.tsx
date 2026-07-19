import { toast } from "sonner";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { IotDeviceCreatedDto } from "@/shared/types/iot/iot.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: IotDeviceCreatedDto | null;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`Đã copy ${label}`);
  };
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} readOnly className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={copy}>
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// Hiển thị thông tin nhạy cảm — BE chỉ trả 1 lần (create + rotate-key). Đóng dialog = mất vĩnh viễn.
export default function DeviceKeyRevealDialog({
  open,
  onOpenChange,
  device,
}: Props) {
  if (!device) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thông tin bí mật của thiết bị</DialogTitle>
          <DialogDescription className="text-destructive">
            ⚠️ Các giá trị này chỉ hiển thị MỘT LẦN. Lưu lại trước khi đóng —
            không thể xem lại.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <CopyRow label="API Key" value={device.rawApiKey} />
          <CopyRow label="Provisioning QR" value={device.provisioningQrCode} />
          <CopyRow label="MQTT Username" value={device.mqttUsername} />
          <CopyRow label="MQTT Password" value={device.mqttPassword} />
          <CopyRow label="MQTT Broker Host" value={device.mqttBrokerHost} />
          <CopyRow
            label="MQTT Broker Port"
            value={String(device.mqttBrokerPort)}
          />
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tôi đã lưu lại</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
