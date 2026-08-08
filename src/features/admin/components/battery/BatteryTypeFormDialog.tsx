import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  createBatteryTypeSchema,
  type CreateBatteryTypeFormValues,
} from "@/features/admin/schemas/battery/battery-type.schema";
import {
  useCreateBatteryType,
  useUpdateBatteryType,
} from "@/features/admin/hooks/battery/useBatteryTypesMutation";
import {
  BatteryChemistryEnum,
  type BatteryTypeDto,
  type CreateBatteryTypePayload,
  type UpdateBatteryTypePayload,
} from "@/features/admin/types/battery/battery-type.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface BatteryTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: BatteryTypeDto | null;
}

const CHEMISTRY_OPTIONS: { value: BatteryChemistryEnum; label: string }[] = [
  { value: BatteryChemistryEnum.LI_FE_PO4, label: "LiFePO4" },
  { value: BatteryChemistryEnum.NMC, label: "NMC" },
  { value: BatteryChemistryEnum.NCA, label: "NCA" },
  { value: BatteryChemistryEnum.LCO, label: "LCO" },
  { value: BatteryChemistryEnum.OTHER, label: "Other" },
];

export default function BatteryTypeFormDialog({
  open,
  onOpenChange,
  editData,
}: BatteryTypeFormDialogProps) {
  const isEdit = !!editData;

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBatteryTypeFormValues>({
    resolver: zodResolver(createBatteryTypeSchema),
    defaultValues: {
      chemistry: BatteryChemistryEnum.LI_FE_PO4,
      maxCycleCount: 2000,
    },
  });

  const { mutateAsync: createType } = useCreateBatteryType();
  const { mutateAsync: updateType } = useUpdateBatteryType(editData?.id ?? "");

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          name: editData.name,
          manufacturer: editData.manufacturer ?? "",
          nominalCapacityAh: editData.nominalCapacityAh,
          nominalVoltage: editData.nominalVoltage,
          chemistry: editData.chemistry,
          maxCycleCount: editData.maxCycleCount,
          description: editData.description ?? "",
        });
      } else {
        reset({
          chemistry: BatteryChemistryEnum.LI_FE_PO4,
          maxCycleCount: 2000,
        });
      }
    }
  }, [open, editData, reset]);

  const onSubmit = async (data: CreateBatteryTypeFormValues) => {
    const payload: CreateBatteryTypePayload = {
      name: data.name,
      manufacturer: data.manufacturer || undefined,
      nominalCapacityAh: data.nominalCapacityAh,
      nominalVoltage: data.nominalVoltage,
      chemistry: data.chemistry,
      maxCycleCount: data.maxCycleCount,
      description: data.description || undefined,
    };

    try {
      if (isEdit && editData) {
        await updateType(payload as UpdateBatteryTypePayload);
        toast.success(ADMIN_MESSAGES.battery.typeUpdated);
      } else {
        await createType(payload);
        toast.success(ADMIN_MESSAGES.battery.typeCreated);
      }
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit battery type" : "Create battery type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Model name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="LiFePO4-200Ah-48V"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" {...register("manufacturer")} />
              {errors.manufacturer && (
                <p className="text-sm text-destructive">
                  {errors.manufacturer.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Chemistry *</Label>
              <Controller
                name="chemistry"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={CHEMISTRY_OPTIONS}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select chemistry" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHEMISTRY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nominalCapacityAh">Capacity (Ah) *</Label>
              <Input
                id="nominalCapacityAh"
                type="number"
                step="any"
                {...register("nominalCapacityAh", { valueAsNumber: true })}
              />
              {errors.nominalCapacityAh && (
                <p className="text-sm text-destructive">
                  {errors.nominalCapacityAh.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="nominalVoltage">Voltage (V) *</Label>
              <Input
                id="nominalVoltage"
                type="number"
                step="any"
                {...register("nominalVoltage", { valueAsNumber: true })}
              />
              {errors.nominalVoltage && (
                <p className="text-sm text-destructive">
                  {errors.nominalVoltage.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="maxCycleCount">Max cycle count</Label>
            <Input
              id="maxCycleCount"
              type="number"
              placeholder="2000"
              {...register("maxCycleCount", {
                setValueAs: (v) =>
                  v === "" || v == null ? undefined : Number(v),
              })}
            />
            {errors.maxCycleCount && (
              <p className="text-sm text-destructive">
                {errors.maxCycleCount.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
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
              {isEdit ? "Save changes" : "Create battery type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
