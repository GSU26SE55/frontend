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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBatteryAssets } from "@/shared/hooks/battery/useBatteryAssets";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { checkRole } from "@/shared/lib/authz";
import { UserRole } from "@/shared/enums/account/session.enum";

// Select needs a non-empty value, but "no asset" must reach the BE as an absent field.
const DEVICE_LEVEL = "__device_level__";
const DEVICE_LEVEL_LABEL = "No asset — device-level calibration";

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

  // GET /api/battery-assets is Admin,Manager only — Staff gets a 403 even though Staff is one
  // of the two roles allowed to CREATE a calibration (POST is Admin,Staff). So the picker is
  // offered to whoever can actually load the list, and Staff keeps the id field it has always
  // had rather than being shown an empty or erroring dropdown.
  const currentUser = useSessionStore((st) => st.user);
  const canListAssets = checkRole(
    currentUser,
    UserRole.ADMIN,
    UserRole.MANAGER,
  );
  const { data: assetList } = useBatteryAssets(
    { pageSize: 100 },
    { enabled: open && canListAssets },
  );
  const assetOptions = (assetList?.items ?? []).map((a) => ({
    value: a.id,
    label: a.siteName ? `${a.serialNumber} — ${a.siteName}` : a.serialNumber,
  }));

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
            <Label htmlFor="batteryAssetId">Battery asset</Label>
            {canListAssets ? (
              <Controller
                control={control}
                name="batteryAssetId"
                render={({ field }) => (
                  <Select
                    value={field.value || DEVICE_LEVEL}
                    items={[
                      { value: DEVICE_LEVEL, label: DEVICE_LEVEL_LABEL },
                      ...assetOptions,
                    ]}
                    // The sentinel stands in for "no asset": an empty string cannot be a
                    // Select value, but the schema and the BE both want the field absent.
                    onValueChange={(v) =>
                      field.onChange(v === DEVICE_LEVEL ? "" : v)
                    }
                  >
                    <SelectTrigger id="batteryAssetId">
                      <SelectValue placeholder={DEVICE_LEVEL_LABEL} />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectItem value={DEVICE_LEVEL}>
                        {DEVICE_LEVEL_LABEL}
                      </SelectItem>
                      {assetOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              // Staff cannot read the asset list (403), so it keeps the raw id field.
              <Input
                id="batteryAssetId"
                {...register("batteryAssetId")}
                placeholder="Leave blank = device-level calibration"
              />
            )}
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
