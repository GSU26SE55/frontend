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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeAccountRoleSchema,
  type ChangeAccountRoleFormValues,
} from "@/features/admin/schemas/admin-account.schema";
import { useAdminChangeAccountRole } from "@/features/admin/hooks/useAdminAccounts";
import { useAdminRoleList } from "@/features/admin/hooks/useAdminRoles";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account.types";

interface Props {
  open: boolean;
  onClose: () => void;
  account: AccountDto;
}

export default function ChangeRoleDialog({ open, onClose, account }: Props) {
  const { data: rolesData } = useAdminRoleList({ pageSize: 100 });
  const roles = Array.isArray(rolesData)
    ? rolesData
    : (((rolesData as { items?: unknown[] })?.items ?? []) as Array<{
        id: string;
        name: string;
      }>);

  const { mutateAsync, isPending } = useAdminChangeAccountRole();

  const {
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<ChangeAccountRoleFormValues>({
    resolver: zodResolver(changeAccountRoleSchema),
    defaultValues: { roleId: "" },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ChangeAccountRoleFormValues) => {
    try {
      await mutateAsync({ id: account.id, payload: { roleId: data.roleId } });
      toast.success("Đã thay đổi role");
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Thay đổi role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Tài khoản:{" "}
            <span className="font-medium text-foreground">
              {account.fullName}
            </span>
          </p>
          <div className="space-y-1.5">
            <Label>
              Role mới <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  items={roles.map((r) => ({ value: r.id, label: r.name }))}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn role" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.roleId && (
              <p className="text-xs text-red-500">{errors.roleId.message}</p>
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
