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
} from "@/features/admin/schemas/account/admin-account.schema";
import { useAdminChangeAccountStatus } from "@/features/admin/hooks/account/useAdminAccounts";
import { AccountStatusEnum } from "@/shared/types/account/account.types";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account/account.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

const STATUS_OPTIONS = [
  { value: AccountStatusEnum.Active, label: "Active" },
  { value: AccountStatusEnum.Inactive, label: "Inactive" },
  { value: AccountStatusEnum.Suspended, label: "Suspended" },
  { value: AccountStatusEnum.Banned, label: "Banned" },
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
      toast.success(ADMIN_MESSAGES.common.statusUpdated);
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change account status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Account:{" "}
            <span className="font-medium text-foreground">
              {account.fullName}
            </span>
          </p>
          <div className="space-y-1.5">
            <Label>
              New status <span className="text-destructive">*</span>
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
                    <SelectValue placeholder="Select a status" />
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
              <p className="text-xs text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input
              {...register("reason")}
              placeholder="Enter a reason"
              aria-invalid={!!errors.reason || undefined}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
