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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inviteAccountSchema,
  type InviteAccountFormValues,
} from "@/features/admin/schemas/admin-account.schema";
import { useAdminInviteAccount } from "@/features/admin/hooks/useAdminAccounts";
import { useAdminRoleList } from "@/features/admin/hooks/useAdminRoles";
import { handleErrorApi } from "@/shared/lib/errors";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InviteAccountDialog({ open, onClose }: Props) {
  const { data: rolesData } = useAdminRoleList({ pageSize: 100 });
  const roles = Array.isArray(rolesData)
    ? rolesData
    : (((rolesData as { items?: unknown[] })?.items ?? []) as Array<{
        id: string;
        name: string;
      }>);

  const { mutateAsync, isPending } = useAdminInviteAccount();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<InviteAccountFormValues>({
    resolver: zodResolver(inviteAccountSchema),
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: InviteAccountFormValues) => {
    try {
      await mutateAsync({
        email: data.email,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
        roleId: data.roleId,
      });
      toast.success(ADMIN_MESSAGES.account.invited);
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mời người dùng</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="user@sunaria.vn"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-fullName">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invite-fullName"
              placeholder="Nguyễn Văn A"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-phone">Số điện thoại</Label>
            <Input
              id="invite-phone"
              {...register("phoneNumber")}
              placeholder="0912345678"
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-500">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>
              Role <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
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
              Gửi lời mời
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
