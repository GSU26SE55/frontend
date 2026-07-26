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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  batteryAssetFormSchema,
  type BatteryAssetFormValues,
} from "@/features/admin/schemas/battery/battery-asset.schema";
import { useBatteryTypes } from "@/features/admin/hooks/battery/useBatteryTypes";
import { useCustomers } from "@/features/admin/hooks/account/useCustomers";
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
}

export default function BatteryAssetForm({
  open,
  onOpenChange,
  editData,
}: BatteryAssetFormProps) {
  const isEdit = !!editData;

  const { data: batteryTypesData } = useBatteryTypes({ pageSize: 100 });
  const { data: customersData } = useCustomers({ pageSize: 100 });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BatteryAssetFormValues>({
    resolver: zodResolver(batteryAssetFormSchema),
  });

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
        reset({});
      }
    }
  }, [open, editData, reset]);

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
            <select
              id="batteryTypeId"
              {...register("batteryTypeId")}
              className={selectClass}
            >
              <option value="">-- Chọn loại pin --</option>
              {batteryTypesData?.items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.batteryTypeId && (
              <p className="text-sm text-destructive">
                {errors.batteryTypeId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="customerId">Khách hàng *</Label>
            <select
              id="customerId"
              {...register("customerId")}
              className={selectClass}
            >
              <option value="">-- Chọn khách hàng --</option>
              {customersData?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.email})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-sm text-destructive">
                {errors.customerId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="installDate">Ngày lắp đặt *</Label>
              <Input
                id="installDate"
                type="date"
                {...register("installDate")}
              />
              {errors.installDate && (
                <p className="text-sm text-destructive">
                  {errors.installDate.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="warrantyEndDate">Hết bảo hành</Label>
              <Input
                id="warrantyEndDate"
                type="date"
                {...register("warrantyEndDate")}
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
