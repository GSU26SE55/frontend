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
} from "@/features/admin/schemas/sms-gateway.schema";
import { useAdminCreateSmsDevice } from "@/features/admin/hooks/useAdminSmsGateway";
import type { CreateGatewayDeviceResponseDto } from "@/features/admin/types/sms-gateway.types";

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
          <DialogTitle>Thêm thiết bị gateway</DialogTitle>
          <DialogDescription>
            Đăng ký một điện thoại Android (chạy app sms_fowarder) làm máy gửi
            SMS. API key sẽ hiển thị một lần sau khi tạo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="deviceName">Tên thiết bị *</Label>
            <Input
              id="deviceName"
              {...register("deviceName")}
              placeholder="iPhone Văn phòng tầng 5"
            />
            {errors.deviceName && (
              <p className="text-sm text-destructive">
                {errors.deviceName.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="deviceCode">Mã thiết bị *</Label>
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
            <Label htmlFor="dailyLimit">Giới hạn SMS/ngày *</Label>
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
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Tạo thiết bị
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
