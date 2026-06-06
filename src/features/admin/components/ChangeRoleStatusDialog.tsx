import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  changeRoleStatusSchema,
  type ChangeRoleStatusFormValues,
} from "@/features/admin/schemas/role.schema";
import { useAdminChangeRoleStatus } from "@/features/admin/hooks/useAdminRoles";
import { RoleStatusEnum } from "@/features/admin/types/admin.types";
import { handleErrorApi } from "@/shared/lib/errors";
import type { RoleDto } from "@/features/admin/types/admin.types";

const STATUS_OPTIONS = [
  { value: RoleStatusEnum.Active, label: "Hoạt động" },
  { value: RoleStatusEnum.Inactive, label: "Tắt" },
  { value: RoleStatusEnum.Deprecated, label: "Deprecated" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  role: RoleDto;
}

export default function ChangeRoleStatusDialog({ open, onClose, role }: Props) {
  const { mutateAsync, isPending } = useAdminChangeRoleStatus();

  const {
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<ChangeRoleStatusFormValues>({
    resolver: zodResolver(changeRoleStatusSchema),
    values: { status: role.status },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ChangeRoleStatusFormValues) => {
    try {
      await mutateAsync({ id: role.id, payload: { status: data.status } });
      toast.success("Đã cập nhật trạng thái role");
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Đổi trạng thái role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Role:{" "}
            <span className="font-medium text-foreground">{role.name}</span>
          </p>
          <div className="space-y-1.5">
            <Label>
              Trạng thái <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  items={STATUS_OPTIONS.map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-xs text-red-500">{errors.status.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
