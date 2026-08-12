import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IoTDeviceStatusBadge from "@/shared/components/iot/IoTDeviceStatusBadge";
import DeviceKeyRevealDialog from "@/features/admin/components/iot/DeviceKeyRevealDialog";
import {
  fromCreatedDto,
  fromDetailDto,
  type DeviceSecrets,
} from "@/features/admin/components/iot/deviceSecrets";
import DeviceCommandDialog from "@/features/admin/components/iot/DeviceCommandDialog";
import ConfirmActionDialog from "@/features/admin/components/common/ConfirmActionDialog";
import CalibrationTable from "@/shared/components/iot/CalibrationTable";
import CalibrationFormDialog from "@/shared/components/iot/CalibrationFormDialog";
import { useIotDevice } from "@/features/admin/hooks/iot/useIotDevice";
import {
  useRotateIotDeviceKey,
  useRotateIotDeviceMqtt,
  useRevokeIotDeviceKey,
} from "@/features/admin/hooks/iot/useIotDeviceMutations";
import { useIotCalibrations } from "@/shared/hooks/iot/useIotCalibrations";
import { handleErrorApi } from "@/shared/lib/errors";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? "—"}</p>
    </div>
  );
}

// Full plaintext API key — it's a secret: hidden by default, shown only when the Admin
// deliberately clicks. apiKey = null for devices created before the BE started storing
// plaintext (older DB rows only keep the hash).
function ApiKeyReveal({ apiKey }: { apiKey: string | null }) {
  const [shown, setShown] = useState(false);

  if (apiKey == null) {
    return (
      <span className="text-xs text-muted-foreground">
        This older device has no plaintext key stored — rotate the key to
        generate a new one.
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs break-all">
        {shown ? apiKey : "•".repeat(16)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        aria-label={shown ? "Hide API key" : "Show API key"}
        onClick={() => setShown((v) => !v)}
      >
        {shown ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        aria-label="Copy API key"
        onClick={() => {
          navigator.clipboard.writeText(apiKey);
          toast.success(ADMIN_MESSAGES.iot.apiKeyCopied);
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function IoTDeviceDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams<{ id: string }>();
  const { data: device, isLoading } = useIotDevice(id);
  const { data: calibrations } = useIotCalibrations(id);

  const { mutate: rotateKey } = useRotateIotDeviceKey(id);
  const { mutate: rotateMqtt } = useRotateIotDeviceMqtt(id);
  const { mutate: revokeKey } = useRevokeIotDeviceKey(id);

  const [revealed, setRevealed] = useState<DeviceSecrets | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [confirm, setConfirm] = useState<
    "rotate" | "rotate-mqtt" | "revoke" | null
  >(null);

  if (isLoading) {
    return (
      <div className="p-6 max-w-360 mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!device) {
    return (
      <div className="p-6 max-w-360 mx-auto">
        <p className="text-muted-foreground">Device not found.</p>
      </div>
    );
  }

  const isDecommissioned = device.status === IotDeviceStatusEnum.Decommissioned;
  const isRevoked = device.apiKeyRevokedAt != null;
  const isDisabled = device.status === IotDeviceStatusEnum.Disabled;
  // Not yet provisioned (Pending) → no MQTT connection, so a command would land on a
  // topic nobody listens to. Hide the button to avoid a misleading "sent" message.
  const isPending = device.status === IotDeviceStatusEnum.Pending;
  const canSendCommand = !isDisabled && !isDecommissioned && !isPending;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/iot-devices")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight font-mono">
                {device.deviceCode}
              </h1>
              <IoTDeviceStatusBadge status={device.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {device.displayName}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/iot-devices/${id}/edit`)}
          >
            Edit
          </Button>
          {canSendCommand && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandOpen(true)}
            >
              Send command
            </Button>
          )}
          {/* IOT3-73 — mở lại dialog từ dữ liệu ĐANG CÓ, không gọi thêm request nào:
              `useIotDevice` đã nạp `GET /{id}`, và từ IOT3-70/71 endpoint đó trả đủ QR + MQTT. */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealed(fromDetailDto(device))}
          >
            Xem lại thông tin
          </Button>
          {!isDecommissioned && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirm("rotate-mqtt")}
            >
              Xoay khoá MQTT
            </Button>
          )}
          {!isDecommissioned && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirm("rotate")}
            >
              Rotate key
            </Button>
          )}
          {!isRevoked && !isDecommissioned && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirm("revoke")}
            >
              Revoke key
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calibrations">Calibration</TabsTrigger>
          <TabsTrigger value="firmware">Firmware</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Site" value={device.siteName} />
            <Field label="Hardware revision" value={device.hardwareRevision} />
            <Field
              label="API key (last 4)"
              value={
                <span className="font-mono">…{device.apiKeyLastFour}</span>
              }
            />
            <Field
              label="API key (full)"
              value={<ApiKeyReveal apiKey={device.apiKey} />}
            />
            <Field
              label="Key issued at"
              value={new Date(device.apiKeyIssuedAt).toLocaleString("vi-VN")}
            />
            <Field
              label="Key revoked"
              value={
                device.apiKeyRevokedAt
                  ? new Date(device.apiKeyRevokedAt).toLocaleString("vi-VN")
                  : "Still valid"
              }
            />
            <Field
              label="Heartbeat (seconds)"
              value={device.heartbeatIntervalSeconds}
            />
            <Field
              label="Last heartbeat"
              value={
                device.lastSeenAt
                  ? new Date(device.lastSeenAt).toLocaleString("vi-VN")
                  : "Never"
              }
            />
            <Field
              label="Clock skew (seconds)"
              value={device.lastClockSkewSeconds}
            />
            <Field
              label="Created at"
              value={new Date(device.createdAt).toLocaleString("vi-VN")}
            />
            <div className="col-span-2 md:col-span-3">
              <Field label="Notes" value={device.notes} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="calibrations">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setCalibrationOpen(true)}>
              <Plus className="size-3.5" /> Add calibration
            </Button>
          </div>
          <Card className="gap-0 py-0 overflow-hidden">
            <CalibrationTable deviceId={id} items={calibrations ?? []} />
          </Card>
        </TabsContent>

        <TabsContent value="firmware">
          <Card className="p-6 grid grid-cols-2 gap-4">
            <Field
              label="Current firmware"
              value={device.currentFirmwareVersion}
            />
            <Field label="Target OTA" value={device.targetFirmwareVersion} />
          </Card>
        </TabsContent>
      </Tabs>

      <DeviceKeyRevealDialog
        open={!!revealed}
        onOpenChange={(o) => !o && setRevealed(null)}
        device={revealed}
      />
      <DeviceCommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        deviceId={id}
        deviceStatus={device.status}
      />
      <CalibrationFormDialog
        open={calibrationOpen}
        onOpenChange={setCalibrationOpen}
        deviceId={id}
      />

      {/* IOT3-76 — hai lệnh xoay khoá, HAI cảnh báo hoàn toàn khác nhau.
          Dùng chung một lời cảnh báo là hoặc doạ quá (admin ngại xoay khi nghi bị lộ), hoặc
          nói nhẹ quá (admin xoay apiKey rồi mới biết phải ra hiện trường). */}
      <ConfirmActionDialog
        open={confirm === "rotate-mqtt"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Xoay khoá MQTT?"
        description="Chỉ đổi username/mật khẩu MQTT. API key GIỮ NGUYÊN, nên thiết bị tự gọi /provision lấy mật khẩu mới — KHÔNG cần ra hiện trường. Trong lúc chờ, thiết bị tạm mất đường MQTT nhưng vẫn gửi dữ liệu qua HTTPS."
        actionLabel="Xoay khoá MQTT"
        onConfirm={() => {
          setConfirm(null);
          rotateMqtt(undefined, {
            onSuccess: (res) => {
              if (res.data) setRevealed(fromCreatedDto(res.data));
              toast.success("Đã xoay khoá MQTT. Thiết bị sẽ tự re-provision.");
            },
            onError: (error) => handleErrorApi({ error }),
          });
        }}
      />
      <ConfirmActionDialog
        open={confirm === "rotate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Rotate API key?"
        description="Đổi CẢ API key LẪN khoá MQTT. Thiết bị mất cả hai đường và KHÔNG tự lành được — bắt buộc mang cáp ra hiện trường nạp lại API key. Chỉ nghi bị lộ API key mới dùng lệnh này; nếu chỉ cần đổi khoá MQTT thì dùng Xoay khoá MQTT."
        actionLabel="Rotate"
        onConfirm={() => {
          setConfirm(null);
          rotateKey(undefined, {
            onSuccess: (res) => {
              if (res.data) setRevealed(fromCreatedDto(res.data));
              toast.success(ADMIN_MESSAGES.iot.keyRotated);
            },
            onError: (error) => handleErrorApi({ error }),
          });
        }}
      />
      <ConfirmActionDialog
        open={confirm === "revoke"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Revoke API key?"
        description="The device will be blocked from all requests and moved to Disabled."
        actionLabel="Revoke"
        destructive
        onConfirm={() => {
          setConfirm(null);
          revokeKey(undefined, {
            onSuccess: () => toast.success(ADMIN_MESSAGES.iot.keyRevoked),
            onError: (error) => handleErrorApi({ error }),
          });
        }}
      />
    </div>
  );
}
