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
          {device.mqttUsername && (
            <CopyRow label="MQTT Username" value={device.mqttUsername} />
          )}
          {device.mqttPassword && (
            <CopyRow label="MQTT Password" value={device.mqttPassword} />
          )}

          {/* BE trả CẢ SÁU trường MQTT cùng rỗng khi bridge chưa bật
              (`MqttBrokerEndpointProvider` → `MqttBrokerEndpoint.Disabled`), nên xử lý khối này
              như MỘT đơn vị: hoặc đủ để cấu hình, hoặc nói thẳng là chưa có.

              Trước đây host/port render vô điều kiện: ô "Broker Host" trống (React còn cảnh báo
              `value` prop is null) và ô "Broker Port" hiện đúng chữ "null" do `String(null)` —
              người vận hành copy nguyên chuỗi đó vào firmware. Đo được trực tiếp trên stack dev. */}
          {device.mqttBrokerHost ? (
            <>
              <CopyRow label="MQTT Broker Host" value={device.mqttBrokerHost} />
              <CopyRow
                label="MQTT Broker Port"
                value={String(device.mqttBrokerPort ?? "")}
              />
              {/* GH-784 — hai giá trị này tồn tại để KHỎI phải suy đoán: thiếu chúng thì người
                  cấu hình vẫn đoán TLS theo số cổng, và vẫn gõ tiền tố topic theo deviceCode
                  nguyên bản chữ hoa — broker so khớp topic phân biệt hoa/thường nên thiết bị bị
                  từ chối dù credential hoàn toàn đúng. */}
              {device.mqttUseTls !== null && (
                <CopyRow
                  label="MQTT TLS"
                  value={device.mqttUseTls ? "true" : "false"}
                />
              )}
              {device.mqttTopicPrefix && (
                <CopyRow
                  label="MQTT Topic Prefix"
                  value={device.mqttTopicPrefix}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              MQTT bridge chưa được bật trên máy chủ, nên chưa có thông tin
              broker để cấu hình thiết bị. Thiết bị vẫn dùng được API Key ở
              trên.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tôi đã lưu lại</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
