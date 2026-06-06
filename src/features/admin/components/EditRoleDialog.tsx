import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  editRoleSchema,
  type EditRoleFormValues,
} from "@/features/admin/schemas/role.schema";
import { useAdminUpdateRole } from "@/features/admin/hooks/useAdminRoles";
import { handleErrorApi } from "@/shared/lib/errors";
import type { RoleDto } from "@/features/admin/types/admin.types";

interface Props {
  open: boolean;
  onClose: () => void;
  role: RoleDto;
}

export default function EditRoleDialog({ open, onClose, role }: Props) {
  const { mutateAsync, isPending } = useAdminUpdateRole();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<EditRoleFormValues>({
    resolver: zodResolver(editRoleSchema),
    values: { name: role.name, description: role.description ?? "" },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: EditRoleFormValues) => {
    try {
      await mutateAsync({
        id: role.id,
        payload: {
          name: data.name,
          description: data.description || undefined,
        },
      });
      toast.success("Đã cập nhật role");
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
          {role.isSystemRole && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
              Đây là system role — chỉ chỉnh sửa được tên hiển thị và mô tả.
            </p>
          )}
          <div className="space-y-1.5">
            <Label>
              Tên role <span className="text-red-500">*</span>
            </Label>
            <Input {...register("name")} disabled={role.isSystemRole} />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Input {...register("description")} />
            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
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
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
