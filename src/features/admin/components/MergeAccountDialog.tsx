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
} from "@/features/admin/schemas/merge-account.schema";
import { useAdminAccountList } from "@/features/admin/hooks/useAdminAccounts";
import { useMergeAccount } from "@/features/admin/hooks/useMergeAccount";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface Props {
  open: boolean;
  onClose: () => void;
  account: AccountDto; // primary — account giữ lại
}

// #AUTH-47: Admin merge secondary vào primary. Secondary chọn từ danh sách (loại trừ primary).
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
          <DialogTitle>Gộp tài khoản</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Giữ lại (primary):{" "}
            <span className="font-medium text-foreground">
              {account.fullName} — {account.email}
            </span>
          </p>

          <div className="space-y-1.5">
            <Label>
              Tài khoản bị gộp (secondary){" "}
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
                    <SelectValue placeholder="Chọn tài khoản để gộp" />
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
              Lý do <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Vd: User báo support tạo nhầm 2 account cùng email"
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <p className="text-xs text-amber-600">
            ⚠️ Secondary sẽ bị tombstone (xóa mềm + ẩn danh email), toàn bộ
            session bị thu hồi. Hành động <strong>không thể hoàn tác</strong>.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending} variant="destructive">
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Gộp tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
