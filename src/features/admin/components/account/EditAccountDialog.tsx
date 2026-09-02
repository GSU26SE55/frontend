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
import { DatePicker } from "@/shared/components/ui/DatePicker";
import {
  editAccountSchema,
  type EditAccountFormValues,
} from "@/features/admin/schemas/account/admin-account.schema";
import { useAdminUpdateAccount } from "@/features/admin/hooks/account/useAdminAccounts";
import { handleErrorApi } from "@/shared/lib/errors";
import { toLocalPhone } from "@/shared/lib/phone";
import type { AccountDto } from "@/shared/types/account/account.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface Props {
  open: boolean;
  onClose: () => void;
  account: AccountDto;
}

export default function EditAccountDialog({ open, onClose, account }: Props) {
  const { mutateAsync, isPending } = useAdminUpdateAccount();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountSchema),
    mode: "onChange",
    values: {
      fullName: account.fullName,
      phoneNumber: toLocalPhone(account.phoneNumber),
      dateOfBirth: account.dateOfBirth?.slice(0, 10) ?? "",
      address: account.address ?? "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: EditAccountFormValues) => {
    try {
      await mutateAsync({
        id: account.id,
        payload: {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
          address: data.address || undefined,
        },
      });
      toast.success(ADMIN_MESSAGES.account.updated);
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              value={account.email}
              disabled
              className="bg-muted"
              placeholder="user@solars.vn"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Full name <span className="text-destructive">*</span>
            </Label>
            <Input placeholder="Nguyen Van A" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <Input {...register("phoneNumber")} placeholder="0912345678" />
              {errors.phoneNumber && (
                <p className="text-xs text-red-500">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Date of birth</Label>
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                  />
                )}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              placeholder="Street, ward/commune..."
              {...register("address")}
            />
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
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
