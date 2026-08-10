import { useEffect, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from "@/shared/components/ui/SearchableSelect";
import CustomerCombobox from "@/features/admin/components/account/CustomerCombobox";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/shared/components/ui/DatePicker";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  batteryAssetFormSchema,
  type BatteryAssetFormValues,
} from "@/features/admin/schemas/battery/battery-asset.schema";
import { useBatteryTypes } from "@/features/admin/hooks/battery/useBatteryTypes";
import { useCustomers } from "@/features/admin/hooks/account/useCustomers";
import { useSiteList } from "@/features/admin/hooks/site/useSites";
import { useCreateBatteryAsset } from "@/features/admin/hooks/battery/useCreateBatteryAsset";
import { useUpdateBatteryAsset } from "@/features/admin/hooks/battery/useUpdateBatteryAsset";
import type { BatteryAssetDto } from "@/features/admin/types/battery/battery-asset.types";
import { WarrantyStatusEnum } from "@/features/admin/enums/battery-asset.enum";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

const STATUS_LABELS: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Active",
  [BatteryStatusEnum.Inactive]: "Paused",
  [BatteryStatusEnum.Decommissioned]: "Decommissioned",
};

const WARRANTY_LABELS: Record<WarrantyStatusEnum, string> = {
  [WarrantyStatusEnum.ACTIVE]: "Under warranty",
  [WarrantyStatusEnum.EXPIRED]: "Warranty expired",
  [WarrantyStatusEnum.VOID]: "Void",
};

interface BatteryAssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: BatteryAssetDto | null;
  /**
   * Opening the form from the site detail page → the site is prefilled and locked,
   * so the user doesn't have to pick it (and can't pick the wrong site).
   */
  lockedSiteId?: string;
}

export default function BatteryAssetForm({
  open,
  onOpenChange,
  editData,
  lockedSiteId,
}: BatteryAssetFormProps) {
  const isEdit = !!editData;

  const { data: batteryTypesData } = useBatteryTypes({ pageSize: 100 });
  const { data: customersData } = useCustomers({ pageSize: 100 });
  const { data: sitesData } = useSiteList({ pageSize: 100 });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BatteryAssetFormValues>({
    resolver: zodResolver(batteryAssetFormSchema),
  });

  const installDate = useWatch({ control, name: "installDate" });
  const siteId = useWatch({ control, name: "siteId" });

  // Auto-fill Location from the selected site's address — the battery is physically
  // at the site, so it shares the site's location instead of a separately typed one.
  // Only on create (not edit) so we never silently overwrite a location already set on the asset.
  useEffect(() => {
    if (isEdit || !siteId) return;
    const site = sitesData?.items.find((s) => s.id === siteId);
    if (site?.address) {
      setValue("location", site.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, sitesData]);

  const batteryTypeOptions = useMemo(
    () =>
      batteryTypesData?.items.map((t) => ({ value: t.id, label: t.name })) ??
      [],
    [batteryTypesData],
  );

  const { mutateAsync: createAsset } = useCreateBatteryAsset();
  const { mutateAsync: updateAsset } = useUpdateBatteryAsset(
    editData?.id ?? "",
  );

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          serialNumber: editData.serialNumber,
          batteryTypeId: editData.batteryTypeId,
          customerId: editData.customerId,
          siteId: editData.siteId ?? "",
          installDate: editData.installDate.slice(0, 10),
          warrantyEndDate: editData.warrantyEndDate?.slice(0, 10) ?? "",
          location: editData.location ?? "",
          notes: editData.notes ?? "",
          warrantyStatus: editData.warrantyStatus,
          status: editData.status,
        });
      } else {
        // Creating from the site page → prefill the site currently open.
        reset(lockedSiteId ? { siteId: lockedSiteId } : {});
      }
    }
  }, [open, editData, reset, lockedSiteId]);

  const onSubmit = async (data: BatteryAssetFormValues) => {
    const payload = {
      serialNumber: data.serialNumber,
      batteryTypeId: data.batteryTypeId,
      customerId: data.customerId,
      siteId: data.siteId || undefined,
      installDate: new Date(data.installDate).toISOString(),
      warrantyEndDate: data.warrantyEndDate
        ? new Date(data.warrantyEndDate).toISOString()
        : undefined,
      location: data.location || undefined,
      notes: data.notes || undefined,
    };

    try {
      if (isEdit) {
        // Send status + warrantyStatus so they are NOT reset to Active (BE update defaults to Active when missing)
        await updateAsset({
          ...payload,
          warrantyStatus: data.warrantyStatus,
          status: data.status,
        });
        toast.success(ADMIN_MESSAGES.battery.updated);
      } else {
        await createAsset(payload);
        toast.success(ADMIN_MESSAGES.battery.created);
      }
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit battery asset" : "Create battery asset"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="serialNumber">Serial Number *</Label>
            <Input
              id="serialNumber"
              {...register("serialNumber")}
              placeholder="e.g. BAT-001"
            />
            {errors.serialNumber && (
              <p className="text-sm text-destructive">
                {errors.serialNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="batteryTypeId">Battery type *</Label>
            <Controller
              control={control}
              name="batteryTypeId"
              render={({ field }) => (
                <SearchableSelect
                  id="batteryTypeId"
                  options={batteryTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- Select a battery type --"
                  searchPlaceholder="Search by battery type name..."
                  emptyText="No matching battery types"
                />
              )}
            />
            {errors.batteryTypeId && (
              <p className="text-sm text-destructive">
                {errors.batteryTypeId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="customerId">Customer *</Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <CustomerCombobox
                  id="customerId"
                  customers={customersData?.items ?? []}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.customerId && (
              <p className="text-sm text-destructive">
                {errors.customerId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="siteId">Site</Label>
            {/* Opened from the site page → lock the trigger. The value still lives in form
                state (Controller), so submit sends siteId even while the trigger is disabled. */}
            <Controller
              control={control}
              name="siteId"
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  items={
                    sitesData?.items.map((s) => ({
                      value: s.id,
                      label: s.name,
                    })) ?? []
                  }
                  onValueChange={(value) => field.onChange(value ?? "")}
                  disabled={!!lockedSiteId}
                >
                  {/* The default disabled opacity-50 dims the chevron too → keep
                      opacity-100 and only mute the text color to show it's locked. */}
                  <SelectTrigger
                    id="siteId"
                    className={cn(
                      "w-full",
                      lockedSiteId &&
                        "disabled:opacity-100 disabled:text-muted-foreground",
                    )}
                  >
                    <SelectValue placeholder="-- No site assigned --" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {sitesData?.items.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {lockedSiteId ? (
              <p className="text-xs text-muted-foreground">
                The battery will be assigned to the site currently open.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Leave empty if the battery isn't installed at a site yet.
              </p>
            )}
            {errors.siteId && (
              <p className="text-sm text-destructive">
                {errors.siteId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="installDate">Install date *</Label>
              <Controller
                control={control}
                name="installDate"
                render={({ field }) => (
                  <DatePicker
                    id="installDate"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                )}
              />
              {errors.installDate && (
                <p className="text-sm text-destructive">
                  {errors.installDate.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="warrantyEndDate">Warranty end</Label>
              <Controller
                control={control}
                name="warrantyEndDate"
                render={({ field }) => (
                  <DatePicker
                    id="warrantyEndDate"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    min={installDate || undefined}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Auto-filled from the selected site's address — you can edit it.
              </p>
            )}
          </div>

          {isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register("status", { valueAsNumber: true })}
                  className={selectClass}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="warrantyStatus">Warranty</Label>
                <select
                  id="warrantyStatus"
                  {...register("warrantyStatus", { valueAsNumber: true })}
                  className={selectClass}
                >
                  {Object.entries(WARRANTY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
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
              {isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
