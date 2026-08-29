import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { DatePicker } from "@/shared/components/ui/DatePicker";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  createCalibrationSchema,
  type CreateCalibrationForm,
} from "@/shared/schemas/iot/iot-calibration.schema";
import { useCreateCalibration } from "@/shared/hooks/iot/useIotCalibrationMutations";
import { MESSAGES } from "@/shared/constants/messages";

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateCalibrationForm>({
    resolver: zodResolver(createCalibrationSchema),
    defaultValues: { scale: 1, offset: 0 },
  });

  const calibratedAt = useWatch({ control, name: "calibratedAt" });

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
      toast.success(MESSAGES.calibration.added);
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add calibration</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="channel">
                Channel <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="unit">
                Unit <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="scale">
                Scale <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="offset">
                Offset <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="calibratedAt">
                Calibration date <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="calibratedAt"
                render={({ field }) => (
                  <DatePicker
                    id="calibratedAt"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                  />
                )}
              />
              {errors.calibratedAt && (
                <p className="text-sm text-destructive">
                  {errors.calibratedAt.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiresAt">Expiration date</Label>
              <Controller
                control={control}
                name="expiresAt"
                render={({ field }) => (
                  <DatePicker
                    id="expiresAt"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    min={calibratedAt || undefined}
                  />
                )}
              />
              {errors.expiresAt && (
                <p className="text-sm text-destructive">
                  {errors.expiresAt.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="batteryAssetId">Battery Asset ID</Label>
            <Input
              id="batteryAssetId"
              {...register("batteryAssetId")}
              placeholder="Leave blank = device-level calibration"
            />
            {errors.batteryAssetId && (
              <p className="text-sm text-destructive">
                {errors.batteryAssetId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} />
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
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
