import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  createGatewayDeviceSchema,
  type CreateGatewayDeviceFormValues,
} from "@/features/admin/schemas/notification/sms-gateway.schema";
import { useAdminCreateSmsDevice } from "@/features/admin/hooks/notification/useAdminSmsGateway";
import type { CreateGatewayDeviceResponseDto } from "@/features/admin/types/ticket/sms-gateway.types";

interface CreateSmsDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (device: CreateGatewayDeviceResponseDto) => void;
}

const DEFAULTS: CreateGatewayDeviceFormValues = {
  deviceName: "",
  deviceCode: "",
  dailyLimit: 100,
};

export default function CreateSmsDeviceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSmsDeviceDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGatewayDeviceFormValues>({
    resolver: zodResolver(createGatewayDeviceSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const { mutateAsync: createDevice } = useAdminCreateSmsDevice();

  const onSubmit = async (data: CreateGatewayDeviceFormValues) => {
    try {
      const device = await createDevice({
        deviceName: data.deviceName.trim(),
        deviceCode: data.deviceCode.trim(),
        dailyLimit: data.dailyLimit,
      });
      onOpenChange(false);
      if (device) onCreated(device);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add gateway device</DialogTitle>
          <DialogDescription>
            Register an Android phone (running the sms_fowarder app) as an SMS
            sender. The API key will be shown once after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="deviceName">Device name *</Label>
            <Input
              id="deviceName"
              {...register("deviceName")}
              placeholder="Phone Office 5th floor"
            />
            {errors.deviceName && (
              <p className="text-sm text-destructive">
                {errors.deviceName.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="deviceCode">Device code *</Label>
            <Input
              id="deviceCode"
              {...register("deviceCode")}
              placeholder="android-gateway-001"
            />
            {errors.deviceCode && (
              <p className="text-sm text-destructive">
                {errors.deviceCode.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="dailyLimit">Daily SMS limit *</Label>
            <Input
              id="dailyLimit"
              type="number"
              {...register("dailyLimit", { valueAsNumber: true })}
              placeholder="100"
            />
            {errors.dailyLimit && (
              <p className="text-sm text-destructive">
                {errors.dailyLimit.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Create device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
