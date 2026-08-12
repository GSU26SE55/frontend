import { useEffect, useMemo, useState } from "react";
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
import SearchableSelect from "@/shared/components/ui/SearchableSelect";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  upsertThresholdSchema,
  type UpsertThresholdFormValues,
} from "@/features/admin/schemas/battery/threshold.schema";
import { useBatteryTypes } from "@/features/admin/hooks/battery/useBatteryTypes";
import {
  useThresholdByType,
  useThresholds,
} from "@/features/admin/hooks/battery/useThresholds";
import { useUpsertThreshold } from "@/features/admin/hooks/battery/useThresholdsMutation";
import { thresholdService } from "@/features/admin/services/battery/threshold.service";
import type { BatteryTypeDto } from "@/features/admin/types/battery/battery-type.types";
import type { UpsertThresholdPayload } from "@/features/admin/types/battery/threshold.types";
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpsertThresholdFormValues>({
    resolver: zodResolver(upsertThresholdSchema),
  });

  const { mutateAsync: upsert } = useUpsertThreshold(batteryTypeId);

  const THRESHOLD_FIELDS = [
    "voltageMin",
    "voltageMax",
    "temperatureMin",
    "temperatureMax",
    "socWarningThreshold",
    "socCriticalThreshold",
    "currentMaxCharge",
    "currentMaxDischarge",
    "sohWarningThreshold",
    "sohCriticalThreshold",
  ] as const;

  // Shared by the initial load and by switching the "Copy from" pick back to "None" —
  // both need to (re)populate the form from a ThresholdConfigDto (or clear it if there is none).
  // Uses setValue per field instead of reset(): reset() runs the zod resolver's validation
  // synchronously, and a required-number field going to `undefined` fails that validation —
  // observed via getValues() logging that reset() silently kept the previous values in that case.
  const applyConfig = (source: typeof config) => {
    for (const key of THRESHOLD_FIELDS) {
      setValue(key, source?.[key], {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  };

  useEffect(() => {
    if (!open) return;
    applyConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, config, reset]);

  // Copy-from-another-type — maps that type's saved thresholds into the form fields
  // below so the admin doesn't start every new type from a blank form; still just a
  // fill, not a submit, so the values can be reviewed/edited before Save.
  const NO_COPY = "__none__";
  const [copyFromId, setCopyFromId] = useState<string>(NO_COPY);
  // Reset the copy-from pick when the dialog transitions closed → open — adjusting
  // state during render (not in an effect) per React's "you might not need an effect" guidance.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setCopyFromId(NO_COPY);
  }

  const { data: otherTypes } = useBatteryTypes(
    open ? { pageSize: 100 } : undefined,
  );
  // Only types that already have a threshold config are worth offering as a copy
  // source — copying from one with nothing configured would just fill in blanks.
  const { data: allThresholds } = useThresholds(
    open ? { pageSize: 100, isActive: true } : undefined,
  );
  const configuredTypeIds = useMemo(
    () => new Set((allThresholds?.items ?? []).map((c) => c.batteryTypeId)),
    [allThresholds],
  );
  const copyFromOptions = useMemo(
    () => [
      { value: NO_COPY, label: "-- None (keep current values) --" },
      ...(otherTypes?.items ?? [])
        .filter((t) => t.id !== batteryTypeId && configuredTypeIds.has(t.id))
        .map((t) => ({ value: t.id, label: t.name })),
    ],
    [otherTypes, batteryTypeId, configuredTypeIds],
  );

  const handleCopyFrom = async (sourceTypeId: string) => {
    setCopyFromId(sourceTypeId);
    if (sourceTypeId === NO_COPY) {
      // "None" just clears the fields — no need to re-derive this type's own values.
      applyConfig(undefined);
      return;
    }
    try {
      const source = await thresholdService
        .getByType(sourceTypeId)
        .then((r) => r.data.data);
      applyConfig(source);
    } catch (error) {
      handleErrorApi({ error });
    }
  };

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
          <DialogTitle>Configure alert thresholds</DialogTitle>
          <DialogDescription>
            Battery type: <strong>{batteryType?.name}</strong>
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
            {copyFromOptions.length > 1 && (
              <div className="space-y-1">
                <Label htmlFor="copyFrom">Copy thresholds from</Label>
                <SearchableSelect
                  id="copyFrom"
                  options={copyFromOptions}
                  value={copyFromId}
                  onChange={handleCopyFrom}
                  placeholder="-- Select a battery type --"
                  searchPlaceholder="Search by battery type name..."
                  emptyText="No matching battery types"
                />
                <p className="text-xs text-muted-foreground">
                  Fills the fields below from that type's saved thresholds —
                  review and adjust before saving.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {field("voltageMin", "Minimum voltage (V)")}
              {field("voltageMax", "Maximum voltage (V)")}
              {field("temperatureMin", "Minimum temperature (°C)")}
              {field("temperatureMax", "Maximum temperature (°C)")}
              {field("socWarningThreshold", "SOC Warning (%)")}
              {field("socCriticalThreshold", "SOC Critical (%)")}
              {field("currentMaxCharge", "Maximum charge current (A)", true)}
              {field(
                "currentMaxDischarge",
                "Maximum discharge current (A)",
                true,
              )}
              {field("sohWarningThreshold", "SOH Warning (%)", true)}
              {field("sohCriticalThreshold", "SOH Critical (%)", true)}
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
                Save thresholds
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
