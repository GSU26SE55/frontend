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
  siteFormSchema,
  type SiteFormValues,
} from "@/features/admin/schemas/site.schema";
import { useCreateSite, useUpdateSite } from "@/features/admin/hooks/useSites";
import {
  SiteStatusEnum,
  type SiteDto,
  type SiteCreatePayload,
} from "@/shared/types/site.types";

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

  const {
    register,
    handleSubmit,
    setError,
    reset,
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
        toast.success("Cập nhật site thành công");
      } else {
        await createSite(payload);
        toast.success("Tạo site thành công");
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
          <DialogTitle>{isEdit ? "Sửa site" : "Tạo site mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Tên site *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="customerId">Customer ID *</Label>
            <Input
              id="customerId"
              {...register("customerId")}
              placeholder="UUID"
              readOnly={isEdit}
              className={isEdit ? "cursor-not-allowed opacity-60" : undefined}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Không thể đổi khách hàng qua sửa site — dùng chức năng chuyển
                chủ sở hữu.
              </p>
            )}
            {errors.customerId && (
              <p className="text-sm text-destructive">
                {errors.customerId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="installDate">Ngày lắp *</Label>
            <Input id="installDate" type="date" {...register("installDate")} />
            {errors.installDate && (
              <p className="text-sm text-destructive">
                {errors.installDate.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...register("address")} />
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
              {errors.latitude && (
                <p className="text-sm text-destructive">
                  {errors.latitude.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="longitude">Kinh độ</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
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
              <Label htmlFor="contactPersonName">Người liên hệ</Label>
              <Input
                id="contactPersonName"
                {...register("contactPersonName")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactPersonPhone">SĐT liên hệ</Label>
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
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Lưu thay đổi" : "Tạo site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
