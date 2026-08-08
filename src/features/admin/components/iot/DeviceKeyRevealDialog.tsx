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
    toast.success(`Copied ${label}`);
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

// Displays sensitive info — BE only returns it once (create + rotate-key). Closing the dialog = gone forever.
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
          <DialogTitle>Device secrets</DialogTitle>
          <DialogDescription className="text-destructive">
            ⚠️ These values are shown ONLY ONCE. Save them before closing — they
            cannot be viewed again.
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

          {/* BE returns ALL SIX MQTT fields empty together when the bridge isn't enabled
              (`MqttBrokerEndpointProvider` → `MqttBrokerEndpoint.Disabled`), so this block is
              handled as ONE unit: either there's enough to configure, or we say plainly there isn't.

              Previously host/port rendered unconditionally: the "Broker Host" field was empty (React
              even warned about `value` prop is null) and the "Broker Port" field showed the literal
              text "null" from `String(null)` — operators copied that exact string into firmware.
              Measured directly on the dev stack. */}
          {device.mqttBrokerHost ? (
            <>
              <CopyRow label="MQTT Broker Host" value={device.mqttBrokerHost} />
              <CopyRow
                label="MQTT Broker Port"
                value={String(device.mqttBrokerPort ?? "")}
              />
              {/* GH-784 — these two values exist so no one has to guess: without them, whoever
                  configures the device would still guess TLS from the port number, and would still
                  type the topic prefix using the original uppercase deviceCode — the broker matches
                  topics case-sensitively, so the device gets rejected even with fully correct
                  credentials. */}
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
              The MQTT bridge isn't enabled on the server, so there's no broker
              info to configure the device with yet. The device can still use
              the API Key above.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>I've saved this</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
