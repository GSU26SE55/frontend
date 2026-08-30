import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import IoTDeviceStatusBadge from "@/shared/components/iot/IoTDeviceStatusBadge";
import CalibrationTable from "@/shared/components/iot/CalibrationTable";
import CalibrationFormDialog from "@/shared/components/iot/CalibrationFormDialog";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import {
  useDeviceByCode,
  useIotCalibrations,
} from "@/shared/hooks/iot/useIotCalibrations";

export default function IoTCalibrationsPage() {
  const [input, setInput] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | undefined>();
  const [calibrationOpen, setCalibrationOpen] = useState(false);

  const { data: device, isLoading, isError } = useDeviceByCode(submittedCode);
  const { data: calibrations } = useIotCalibrations(device?.id);

  const submit = () => {
    const code = input.trim().toUpperCase();
    setSubmittedCode(code || undefined);
  };

  return (
    <PageContainer>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          Staff &middot; IoT
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Device calibration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the device code (printed on the device body) to manage
          calibration.
        </p>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ESP32-001"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="pl-8 font-mono"
          />
        </div>
        <Button onClick={submit}>Search</Button>
      </div>

      {submittedCode && isLoading && (
        <Skeleton className="h-32 w-full max-w-2xl" />
      )}

      {submittedCode && isError && (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            No device found with code{" "}
            <span className="font-mono">{submittedCode}</span> (or it has been
            decommissioned).
          </p>
        </Card>
      )}

      {device && (
        <div className="space-y-4">
          <Card className="p-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">
                  {device.deviceCode}
                </span>
                <IoTDeviceStatusBadge status={device.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {device.displayName} &middot; {device.siteName ?? "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setCalibrationOpen(true)}>
                <Plus className="size-3.5" /> Add calibration
              </Button>
              <RefreshButton
                queryKeys={[KEY.iotCalibrations, KEY.iotDevices]}
              />
            </div>
          </Card>

          <Card className="gap-0 py-0 overflow-hidden">
            <CalibrationTable deviceId={device.id} items={calibrations ?? []} />
          </Card>

          <CalibrationFormDialog
            open={calibrationOpen}
            onOpenChange={setCalibrationOpen}
            deviceId={device.id}
          />
        </div>
      )}
    </PageContainer>
  );
}
