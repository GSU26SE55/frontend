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
  [BatteryStatusEnum.Active]: "Hoạt động",
  [BatteryStatusEnum.Inactive]: "Tạm ngừng",
  [BatteryStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

const WARRANTY_LABELS: Record<WarrantyStatusEnum, string> = {
  [WarrantyStatusEnum.ACTIVE]: "Còn bảo hành",
  [WarrantyStatusEnum.EXPIRED]: "Hết bảo hành",
  [WarrantyStatusEnum.VOID]: "Vô hiệu",
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
   * Mở form từ trang chi tiết site → site điền sẵn và khoá lại, người dùng
   * không phải tự chọn (và không chọn nhầm sang site khác).
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<BatteryAssetFormValues>({
    resolver: zodResolver(batteryAssetFormSchema),
  });

  const installDate = useWatch({ control, name: "installDate" });

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
          latitude: editData.latitude?.toString() ?? "",
          longitude: editData.longitude?.toString() ?? "",
          notes: editData.notes ?? "",
          warrantyStatus: editData.warrantyStatus,
          status: editData.status,
        });
      } else {
        // Tạo mới từ trang site → điền sẵn site đang mở.
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
      latitude: toNumOrNull(data.latitude),
      longitude: toNumOrNull(data.longitude),
      notes: data.notes || undefined,
    };

    try {
      if (isEdit) {
        // Gửi kèm status + warrantyStatus để KHÔNG reset về Active (BE update default Active nếu thiếu)
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
            {isEdit ? "Sửa battery asset" : "Tạo battery asset mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="serialNumber">Serial Number *</Label>
            <Input
              id="serialNumber"
              {...register("serialNumber")}
              placeholder="VD: BAT-001"
            />
            {errors.serialNumber && (
              <p className="text-sm text-destructive">
                {errors.serialNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="batteryTypeId">Loại pin *</Label>
            <Controller
              control={control}
              name="batteryTypeId"
              render={({ field }) => (
                <SearchableSelect
                  id="batteryTypeId"
                  options={batteryTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- Chọn loại pin --"
                  searchPlaceholder="Tìm theo tên loại pin..."
                  emptyText="Không tìm thấy loại pin"
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
            <Label htmlFor="customerId">Khách hàng *</Label>
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
            {/* Mở từ trang site → khoá trigger. Giá trị vẫn nằm trong form state
                (Controller) nên submit vẫn gửi siteId dù trigger bị disabled. */}
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
                  {/* disabled mặc định opacity-50 làm mờ cả chevron → giữ
                      opacity-100 và chỉ làm dịu màu chữ cho rõ là đang khoá. */}
                  <SelectTrigger
                    id="siteId"
                    className={cn(
                      "w-full",
                      lockedSiteId &&
                        "disabled:opacity-100 disabled:text-muted-foreground",
                    )}
                  >
                    <SelectValue placeholder="-- Chưa gán site --" />
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
                Pin sẽ được gán vào site đang mở.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Để trống nếu pin chưa lắp vào site nào.
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
              <Label htmlFor="installDate">Ngày lắp đặt *</Label>
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
              <Label htmlFor="warrantyEndDate">Hết bảo hành</Label>
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
            <Label htmlFor="location">Vị trí</Label>
            <Input id="location" {...register("location")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="latitude">Vĩ độ</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register("latitude")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="longitude">Kinh độ</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register("longitude")}
              />
            </div>
          </div>

          {isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="status">Trạng thái</Label>
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
                <Label htmlFor="warrantyStatus">Bảo hành</Label>
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
            <Label htmlFor="notes">Ghi chú</Label>
            <Input id="notes" {...register("notes")} />
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
              {isEdit ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
