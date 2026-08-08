import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import IoTDeviceForm from "@/features/admin/components/iot/IoTDeviceForm";
import DeviceKeyRevealDialog from "@/features/admin/components/iot/DeviceKeyRevealDialog";
import { useIotDevice } from "@/features/admin/hooks/iot/useIotDevice";
import type { IotDeviceCreatedDto } from "@/shared/types/iot/iot.types";

export default function IoTDeviceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: device, isLoading } = useIotDevice(id);

  const [created, setCreated] = useState<IotDeviceCreatedDto | null>(null);

  // After closing the reveal dialog → navigate to the detail page of the newly created device.
  const handleSecretsClose = () => {
    const newId = created?.id;
    setCreated(null);
    if (newId) navigate(`/admin/iot-devices/${newId}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/iot-devices")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; IoT Devices
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? "Edit device" : "Create new device"}
          </h1>
        </div>
      </div>

      <Card className="p-6">
        {isEdit && isLoading ? (
          <div className="space-y-3 max-w-2xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isEdit && !device ? (
          <p className="text-muted-foreground">Device not found.</p>
        ) : (
          <IoTDeviceForm
            device={isEdit ? device : undefined}
            onCreated={setCreated}
            onUpdated={() => navigate(`/admin/iot-devices/${id}`)}
            onCancel={() => navigate("/admin/iot-devices")}
          />
        )}
      </Card>

      <DeviceKeyRevealDialog
        open={!!created}
        onOpenChange={(o) => !o && handleSecretsClose()}
        device={created}
      />
    </div>
  );
}
