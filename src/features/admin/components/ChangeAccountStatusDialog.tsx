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
  changeAccountStatusSchema,
  type ChangeAccountStatusFormValues,
} from "@/features/admin/schemas/admin-account.schema";
import { useAdminChangeAccountStatus } from "@/features/admin/hooks/useAdminAccounts";
import { AccountStatusEnum } from "@/shared/types/account.types";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account.types";

const STATUS_OPTIONS = [
  { value: AccountStatusEnum.Active, label: "Hoạt động" },
  { value: AccountStatusEnum.Inactive, label: "Không hoạt động" },
  { value: AccountStatusEnum.Suspended, label: "Tạm khóa" },
  { value: AccountStatusEnum.Banned, label: "Bị cấm" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  account: AccountDto;
}

export default function ChangeAccountStatusDialog({
  open,
  onClose,
  account,
}: Props) {
  const { mutateAsync, isPending } = useAdminChangeAccountStatus();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<ChangeAccountStatusFormValues>({
    resolver: zodResolver(changeAccountStatusSchema),
    values: { status: account.status, reason: "" },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ChangeAccountStatusFormValues) => {
    try {
      await mutateAsync({
        id: account.id,
        payload: { status: data.status, reason: data.reason || undefined },
      });
      toast.success("Đã cập nhật trạng thái");
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Thay đổi trạng thái tài khoản</DialogTitle>
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
              Trạng thái mới <span className="text-red-500">*</span>
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
          <div className="space-y-1.5">
            <Label>Lý do</Label>
            <Input
              {...register("reason")}
              placeholder="Nhập lý do (tùy chọn)"
            />
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
