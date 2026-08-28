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
import AddressAutocomplete from "@/shared/components/site/AddressAutocomplete";
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

const toNumOrNull = (val?: string): number | undefined => {
  if (!val || val === "") return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
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
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BatteryAssetFormValues>({
    resolver: zodResolver(batteryAssetFormSchema),
  });

  const installDate = useWatch({ control, name: "installDate" });
  const customerId = useWatch({ control, name: "customerId" });
  const siteId = useWatch({ control, name: "siteId" });

  // Auto-fill Location from the selected site's address — the battery is physically
  // at the site, so it shares the site's location instead of a separately typed one.
  // The coordinates travel with the address: latitude/longitude are read-only and only
  // ever come from a resolved place, so they can never drift from the text next to them.
  // Only on create (not edit) so we never silently overwrite a location already set on the asset.
  useEffect(() => {
    if (isEdit || !siteId) return;
    const site = sitesData?.items.find((s) => s.id === siteId);
    if (site?.address) {
      setValue("location", site.address);
      setValue("latitude", site.latitude?.toString() ?? "");
      setValue("longitude", site.longitude?.toString() ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, sitesData]);

  const batteryTypeOptions = useMemo(
    () =>
      batteryTypesData?.items.map((t) => ({ value: t.id, label: t.name })) ??
      [],
    [batteryTypesData],
  );

  const sites = useMemo(() => sitesData?.items ?? [], [sitesData]);
  const selectedSite = useMemo(
    () => sites.find((site) => site.id === siteId),
    [siteId, sites],
  );
  const visibleSites = useMemo(
    () =>
      sites.filter(
        (site) =>
          !customerId || site.customerId === customerId || site.id === siteId,
      ),
    [customerId, siteId, sites],
  );
  const customerOptions = useMemo(() => {
    const customers = [...(customersData?.items ?? [])];
    if (
      selectedSite &&
      !customers.some((customer) => customer.id === selectedSite.customerId)
    ) {
      customers.push({
        id: selectedSite.customerId,
        fullName: selectedSite.customerName,
        email: "Owner of selected site",
      });
    }
    return customers;
  }, [customersData, selectedSite]);

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
          latitude: editData.latitude?.toString() ?? "",
          longitude: editData.longitude?.toString() ?? "",
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

  useEffect(() => {
    if (!open || editData || !lockedSiteId) return;
    const lockedSite = sites.find((site) => site.id === lockedSiteId);
    if (lockedSite) {
      setValue("customerId", lockedSite.customerId, { shouldValidate: true });
      // Battery inherits the site's coordinates — the lat/long inputs are hidden
      // when locked, so pull the values straight from the site.
      setValue("latitude", lockedSite.latitude?.toString() ?? "");
      setValue("longitude", lockedSite.longitude?.toString() ?? "");
    }
  }, [editData, lockedSiteId, open, setValue, sites]);

  const onSubmit = async (data: BatteryAssetFormValues) => {
    // A Site has exactly one owner. Derive CustomerId from the selected Site so a
    // stale UI selection can never send a mismatched Customer/Site pair.
    const site = sites.find((item) => item.id === data.siteId);
    const payload = {
      serialNumber: data.serialNumber,
      batteryTypeId: data.batteryTypeId,
      customerId: site?.customerId ?? data.customerId,
      siteId: data.siteId || undefined,
      installDate: new Date(data.installDate).toISOString(),
      warrantyEndDate: data.warrantyEndDate
        ? new Date(data.warrantyEndDate).toISOString()
        : undefined,
      location: data.location || undefined,
      latitude: toNumOrNull(data.latitude),
      longitude: toNumOrNull(data.longitude),
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
            <Label htmlFor="serialNumber">
              Serial Number <span className="text-destructive">*</span>
            </Label>
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
            <Label htmlFor="batteryTypeId">
              Battery type <span className="text-destructive">*</span>
            </Label>
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
            <Label htmlFor="customerId">
              Customer <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <CustomerCombobox
                  id="customerId"
                  customers={customerOptions}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    if (selectedSite && selectedSite.customerId !== value) {
                      setValue("siteId", "", { shouldValidate: true });
                    }
                  }}
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
                  items={visibleSites.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  onValueChange={(value) => {
                    field.onChange(value ?? "");
                    const site = sites.find((item) => item.id === value);
                    if (site) {
                      setValue("customerId", site.customerId, {
                        shouldValidate: true,
                      });
                    }
                  }}
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
                    {visibleSites.map((s) => (
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
              <Label htmlFor="installDate">
                Install date <span className="text-destructive">*</span>
              </Label>
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
            {/* Type a place → pick a suggestion → latitude/longitude auto-fill. */}
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <AddressAutocomplete
                  id="location"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onSelect={(r) => {
                    field.onChange(r.displayName);
                    setValue("latitude", r.latitude.toString(), {
                      shouldValidate: true,
                    });
                    setValue("longitude", r.longitude.toString(), {
                      shouldValidate: true,
                    });
                  }}
                />
              )}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Auto-filled from the selected site's address — you can search
                for a different place.
              </p>
            )}
          </div>

          {/* Opened from the site page → coordinates come from the site, so hide the
              inputs. The values still live in form state (set from the locked site). */}
          {!lockedSiteId && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="latitude">Latitude</Label>
                {/* Filled from the location picker — read-only so it can't drift from the address. */}
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  readOnly
                  className="bg-muted text-muted-foreground"
                  {...register("latitude")}
                />
                {errors.latitude && (
                  <p className="text-sm text-destructive">
                    {errors.latitude.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  readOnly
                  className="bg-muted text-muted-foreground"
                  {...register("longitude")}
                />
                {errors.longitude && (
                  <p className="text-sm text-destructive">
                    {errors.longitude.message}
                  </p>
                )}
              </div>
            </div>
          )}

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
