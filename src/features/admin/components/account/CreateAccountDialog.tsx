import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
  createAccountSchema,
  type CreateAccountFormValues,
} from "@/features/admin/schemas/account/admin-account.schema";
import { useAdminCreateAccount } from "@/features/admin/hooks/account/useAdminAccounts";
import { useAdminRoleList } from "@/features/admin/hooks/account/useAdminRoles";
import { handleErrorApi } from "@/shared/lib/errors";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateAccountDialog({ open, onClose }: Props) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: rolesData } = useAdminRoleList({ pageSize: 100 });
  const roles = Array.isArray(rolesData)
    ? rolesData
    : (((rolesData as { items?: unknown[] })?.items ?? []) as Array<{
        id: string;
        name: string;
      }>);

  const { mutateAsync, isPending } = useAdminCreateAccount();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
  });

  const handleClose = () => {
    reset();
    setShowPw(false);
    setShowConfirm(false);
    onClose();
  };

  const onSubmit = async (data: CreateAccountFormValues) => {
    try {
      await mutateAsync({
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        phoneNumber: data.phoneNumber || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        address: data.address || undefined,
        roleId: data.roleId,
      });
      toast.success(ADMIN_MESSAGES.account.created);
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="user@sunaria.vn"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="Nguyễn Văn A" {...register("fullName")} />
              {errors.fullName && (
                <p className="text-xs text-red-500">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  className="pr-10"
                  placeholder="Nhập mật khẩu"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  className="pr-10"
                  placeholder="Nhập lại mật khẩu"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input {...register("phoneNumber")} placeholder="0912345678" />
              {errors.phoneNumber && (
                <p className="text-xs text-red-500">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Ngày sinh</Label>
              <Input type="date" {...register("dateOfBirth")} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Địa chỉ</Label>
              <Input
                placeholder="Số nhà, đường, phường/xã..."
                {...register("address")}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
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
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
