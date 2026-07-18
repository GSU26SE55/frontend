import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  upsertThresholdSchema,
  type UpsertThresholdFormValues,
} from "@/features/admin/schemas/threshold.schema";
import { useThresholdByType } from "@/features/admin/hooks/useThresholds";
import { useUpsertThreshold } from "@/features/admin/hooks/useThresholdsMutation";
import type { BatteryTypeDto } from "@/features/admin/types/battery-type.types";
import type { UpsertThresholdPayload } from "@/features/admin/types/threshold.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface ThresholdConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batteryType: BatteryTypeDto | null;
}

const reqNum = { valueAsNumber: true } as const;
const optNum = {
  setValueAs: (v: unknown) => (v === "" || v == null ? undefined : Number(v)),
} as const;

export default function ThresholdConfigDialog({
  open,
  onOpenChange,
  batteryType,
}: ThresholdConfigDialogProps) {
  const batteryTypeId = batteryType?.id ?? "";

  const { data: config, isLoading } = useThresholdByType(
    open ? batteryTypeId : "",
    { includeInactive: true },
  );

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpsertThresholdFormValues>({
    resolver: zodResolver(upsertThresholdSchema),
  });

  const { mutateAsync: upsert } = useUpsertThreshold(batteryTypeId);

  useEffect(() => {
    if (!open) return;
    if (config) {
      reset({
        voltageMin: config.voltageMin,
        voltageMax: config.voltageMax,
        temperatureMin: config.temperatureMin,
        temperatureMax: config.temperatureMax,
        socWarningThreshold: config.socWarningThreshold,
        socCriticalThreshold: config.socCriticalThreshold,
        currentMaxCharge: config.currentMaxCharge,
        currentMaxDischarge: config.currentMaxDischarge,
        sohWarningThreshold: config.sohWarningThreshold,
        sohCriticalThreshold: config.sohCriticalThreshold,
      });
    } else {
      reset({});
    }
  }, [open, config, reset]);

  const onSubmit = async (data: UpsertThresholdFormValues) => {
    const payload: UpsertThresholdPayload = {
      voltageMin: data.voltageMin,
      voltageMax: data.voltageMax,
      temperatureMin: data.temperatureMin,
      temperatureMax: data.temperatureMax,
      socWarningThreshold: data.socWarningThreshold,
      socCriticalThreshold: data.socCriticalThreshold,
      currentMaxCharge: data.currentMaxCharge,
      currentMaxDischarge: data.currentMaxDischarge,
      sohWarningThreshold: data.sohWarningThreshold,
      sohCriticalThreshold: data.sohCriticalThreshold,
    };

    try {
      await upsert(payload);
      toast.success(ADMIN_MESSAGES.battery.thresholdSaved);
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  const field = (
    name: keyof UpsertThresholdFormValues,
    label: string,
    optional = false,
  ) => (
    <div className="space-y-1">
      <Label htmlFor={name}>{optional ? label : `${label} *`}</Label>
      <Input
        id={name}
        type="number"
        step="any"
        {...register(name, optional ? optNum : reqNum)}
      />
      {errors[name] && (
        <p className="text-sm text-destructive">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Cấu hình ngưỡng cảnh báo</DialogTitle>
          <DialogDescription>
            Loại pin: <strong>{batteryType?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field("voltageMin", "Điện áp tối thiểu (V)")}
              {field("voltageMax", "Điện áp tối đa (V)")}
              {field("temperatureMin", "Nhiệt độ tối thiểu (°C)")}
              {field("temperatureMax", "Nhiệt độ tối đa (°C)")}
              {field("socWarningThreshold", "SOC Warning (%)")}
              {field("socCriticalThreshold", "SOC Critical (%)")}
              {field("currentMaxCharge", "Dòng nạp tối đa (A)", true)}
              {field("currentMaxDischarge", "Dòng xả tối đa (A)", true)}
              {field("sohWarningThreshold", "SOH Warning (%)", true)}
              {field("sohCriticalThreshold", "SOH Critical (%)", true)}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Lưu ngưỡng
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
