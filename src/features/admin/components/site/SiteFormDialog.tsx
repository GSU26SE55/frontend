import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
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
import { DatePicker } from "@/shared/components/ui/DatePicker";
import AddressAutocomplete from "@/shared/components/site/AddressAutocomplete";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  siteFormSchema,
  type SiteFormValues,
} from "@/features/admin/schemas/site/site.schema";
import {
  useCreateSite,
  useUpdateSite,
} from "@/features/admin/hooks/site/useSites";
import { useCustomers } from "@/features/admin/hooks/account/useCustomers";
import { useAdminAccountDetail } from "@/features/admin/hooks/account/useAdminAccounts";
import CustomerCombobox from "@/features/admin/components/account/CustomerCombobox";
import {
  SiteStatusEnum,
  type SiteDto,
  type SiteCreatePayload,
} from "@/shared/types/site/site.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface SiteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: SiteDto | null;
}

const toNumOrNull = (val?: string): number | null | undefined => {
  if (!val || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
};

export default function SiteFormDialog({
  open,
  onOpenChange,
  editData,
}: SiteFormDialogProps) {
  const isEdit = !!editData;

  const { data: customersData } = useCustomers({ pageSize: 100 });

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: { status: SiteStatusEnum.Active },
  });

  const { mutateAsync: createSite } = useCreateSite();
  const { mutateAsync: updateSite } = useUpdateSite();

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          name: editData.name,
          customerId: editData.customerId,
          address: editData.address ?? "",
          latitude: editData.latitude?.toString() ?? "",
          longitude: editData.longitude?.toString() ?? "",
          installDate: editData.installDate.slice(0, 10),
          status: editData.status,
          contactPersonName: editData.contactPersonName ?? "",
          contactPersonPhone: editData.contactPersonPhone ?? "",
        });
      } else {
        reset({ status: SiteStatusEnum.Active });
      }
    }
  }, [open, editData, reset]);

  // Auto-fill Address from the selected customer's saved address — only on create
  // (not edit, so we never silently overwrite an address the user already set on the site).
  const customerId = useWatch({ control, name: "customerId" });
  const { data: customerDetail } = useAdminAccountDetail(
    !isEdit ? (customerId ?? "") : "",
  );
  useEffect(() => {
    if (!isEdit && customerDetail?.address) {
      setValue("address", customerDetail.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerDetail]);

  const onSubmit = async (data: SiteFormValues) => {
    const payload: SiteCreatePayload = {
      name: data.name,
      customerId: data.customerId,
      installDate: data.installDate,
      status: data.status,
      address: data.address || undefined,
      latitude: toNumOrNull(data.latitude),
      longitude: toNumOrNull(data.longitude),
      contactPersonName: data.contactPersonName || undefined,
      contactPersonPhone: data.contactPersonPhone || undefined,
    };

    try {
      if (isEdit && editData) {
        await updateSite({ id: editData.id, payload });
        toast.success(ADMIN_MESSAGES.site.updated);
      } else {
        await createSite(payload);
        toast.success(ADMIN_MESSAGES.site.created);
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
          <DialogTitle>{isEdit ? "Edit site" : "New site"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">
              Site name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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
                  customers={customersData?.items ?? []}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isEdit}
                />
              )}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                The customer can't be changed by editing the site — use transfer
                ownership.
              </p>
            )}
            {errors.customerId && (
              <p className="text-sm text-destructive">
                {errors.customerId.message}
              </p>
            )}
          </div>

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
            <Label htmlFor="address">Address</Label>
            {/* Type an address → pick a suggestion → latitude/longitude auto-fill. */}
            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <AddressAutocomplete
                  id="address"
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
                Auto-filled from the customer's saved address — you can edit it.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="latitude">Latitude</Label>
              {/* Filled from the address picker — read-only so it can't drift from the address. */}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="contactPersonName">Contact person</Label>
              <Input
                id="contactPersonName"
                {...register("contactPersonName")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactPersonPhone">Contact phone</Label>
              <Input
                id="contactPersonPhone"
                {...register("contactPersonPhone")}
              />
            </div>
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
              {isEdit ? "Save changes" : "Create site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
