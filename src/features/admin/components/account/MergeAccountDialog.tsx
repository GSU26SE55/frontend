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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mergeAccountSchema,
  type MergeAccountFormValues,
} from "@/features/admin/schemas/account/merge-account.schema";
import { useAdminAccountList } from "@/features/admin/hooks/account/useAdminAccounts";
import { useMergeAccount } from "@/features/admin/hooks/account/useMergeAccount";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account/account.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface Props {
  open: boolean;
  onClose: () => void;
  account: AccountDto; // primary — the account that's kept
}

// #AUTH-47: Admin merges secondary into primary. Secondary is chosen from the list (excluding primary).
export default function MergeAccountDialog({ open, onClose, account }: Props) {
  const { data: listData } = useAdminAccountList({ pageSize: 100 });
  const candidates: AccountDto[] = (listData?.items ?? []).filter(
    (a) => a.id !== account.id,
  );

  const { mutateAsync, isPending } = useMergeAccount();

  const {
    handleSubmit,
    setError,
    reset,
    register,
    control,
    formState: { errors },
  } = useForm<MergeAccountFormValues>({
    resolver: zodResolver(mergeAccountSchema),
    defaultValues: { secondaryAccountId: "", reason: "" },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: MergeAccountFormValues) => {
    try {
      await mutateAsync({ primaryId: account.id, payload: data });
      toast.success(ADMIN_MESSAGES.account.merged);
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Merge accounts</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Kept (primary):{" "}
            <span className="font-medium text-foreground">
              {account.fullName} — {account.email}
            </span>
          </p>

          <div className="space-y-1.5">
            <Label>
              Account being merged (secondary){" "}
              <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="secondaryAccountId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  items={candidates.map((c) => ({
                    value: c.id,
                    label: `${c.fullName} — ${c.email}`,
                  }))}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account to merge" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {candidates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName} — {c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.secondaryAccountId && (
              <p className="text-xs text-red-500">
                {errors.secondaryAccountId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="E.g.: user reported to support that 2 accounts with the same email were created by mistake"
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <p className="text-xs text-amber-600">
            ⚠️ The secondary account will be tombstoned (soft-deleted + email
            anonymized), and all sessions revoked. This action{" "}
            <strong>cannot be undone</strong>.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} variant="destructive">
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Merge accounts
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
