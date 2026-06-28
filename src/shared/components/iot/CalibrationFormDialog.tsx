import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  createCalibrationSchema,
  type CreateCalibrationForm,
} from "@/shared/schemas/iot-calibration.schema";
import { useCreateCalibration } from "@/shared/hooks/useIotCalibrationMutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
}

export default function CalibrationFormDialog({
  open,
  onOpenChange,
  deviceId,
}: Props) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCalibrationForm>({
    resolver: zodResolver(createCalibrationSchema),
    defaultValues: { scale: 1, offset: 0 },
  });

  const { mutateAsync: createCalibration } = useCreateCalibration(deviceId);

  useEffect(() => {
    if (open) reset({ scale: 1, offset: 0 });
  }, [open, reset]);

  const onSubmit = async (data: CreateCalibrationForm) => {
    try {
      await createCalibration({
        channel: data.channel,
        batteryAssetId: data.batteryAssetId || undefined,
        scale: data.scale,
        offset: data.offset,
        unit: data.unit,
        calibratedAt: data.calibratedAt,
        expiresAt: data.expiresAt || undefined,
        notes: data.notes || undefined,
      });
      toast.success("Thêm calibration thành công");
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm calibration</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="channel">Channel *</Label>
              <Input
                id="channel"
                {...register("channel")}
                placeholder="voltage"
              />
              {errors.channel && (
                <p className="text-sm text-destructive">
                  {errors.channel.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit">Đơn vị *</Label>
              <Input id="unit" {...register("unit")} placeholder="V" />
              {errors.unit && (
                <p className="text-sm text-destructive">
                  {errors.unit.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="scale">Scale *</Label>
              <Input
                id="scale"
                type="number"
                step="any"
                {...register("scale", { valueAsNumber: true })}
              />
              {errors.scale && (
                <p className="text-sm text-destructive">
                  {errors.scale.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="offset">Offset *</Label>
              <Input
                id="offset"
                type="number"
                step="any"
                {...register("offset", { valueAsNumber: true })}
              />
              {errors.offset && (
                <p className="text-sm text-destructive">
                  {errors.offset.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="calibratedAt">Ngày calibration *</Label>
              <Input
                id="calibratedAt"
                type="date"
                {...register("calibratedAt")}
              />
              {errors.calibratedAt && (
                <p className="text-sm text-destructive">
                  {errors.calibratedAt.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiresAt">Ngày hết hạn</Label>
              <Input id="expiresAt" type="date" {...register("expiresAt")} />
              {errors.expiresAt && (
                <p className="text-sm text-destructive">
                  {errors.expiresAt.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="batteryAssetId">Battery Asset ID (tuỳ chọn)</Label>
            <Input
              id="batteryAssetId"
              {...register("batteryAssetId")}
              placeholder="Bỏ trống = calibration cấp device"
            />
            {errors.batteryAssetId && (
              <p className="text-sm text-destructive">
                {errors.batteryAssetId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea id="notes" {...register("notes")} />
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
              Thêm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
