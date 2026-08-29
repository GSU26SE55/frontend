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
} from "@/features/admin/schemas/account/role.schema";
import { useAdminUpdateRole } from "@/features/admin/hooks/account/useAdminRoles";
import { handleErrorApi } from "@/shared/lib/errors";
import type { RoleDto } from "@/features/admin/types/account/admin.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

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
      toast.success(ADMIN_MESSAGES.role.updated);
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
          {role.isSystemRole && (
            <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-300">
              This is a system role — only the display name and description can
              be edited.
            </p>
          )}
          <div className="space-y-1.5">
            <Label>
              Role name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("name")}
              disabled={role.isSystemRole}
              placeholder="e.g. SeniorTechnician"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              {...register("description")}
              placeholder="Short description of this role"
            />
            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
