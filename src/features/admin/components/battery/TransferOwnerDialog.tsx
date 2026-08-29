import { useForm, Controller } from "react-hook-form";
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
  transferOwnerSchema,
  type TransferOwnerFormValues,
} from "@/features/admin/schemas/battery/battery-asset.schema";
import { useCustomers } from "@/features/admin/hooks/account/useCustomers";
import { useTransferOwner } from "@/features/admin/hooks/battery/useTransferOwner";
import CustomerCombobox from "@/features/admin/components/account/CustomerCombobox";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface TransferOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  currentCustomerId: string;
}

export default function TransferOwnerDialog({
  open,
  onOpenChange,
  assetId,
  currentCustomerId,
}: TransferOwnerDialogProps) {
  const { data: customersData } = useCustomers({ pageSize: 100 });
  const { mutateAsync: transferOwner } = useTransferOwner(assetId);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransferOwnerFormValues>({
    resolver: zodResolver(transferOwnerSchema),
  });

  const onSubmit = async (data: TransferOwnerFormValues) => {
    if (data.newCustomerId === currentCustomerId) {
      setError("newCustomerId", { message: "Select a different customer" });
      return;
    }
    try {
      await transferOwner(data);
      toast.success(ADMIN_MESSAGES.common.ownerTransferred);
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer ownership</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="newCustomerId">
              New customer <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="newCustomerId"
              render={({ field }) => (
                <CustomerCombobox
                  id="newCustomerId"
                  customers={
                    customersData?.items.filter(
                      (c) => c.id !== currentCustomerId,
                    ) ?? []
                  }
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.newCustomerId && (
              <p className="text-sm text-destructive">
                {errors.newCustomerId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" {...register("reason")} placeholder="Optional" />
            {errors.reason && (
              <p className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
