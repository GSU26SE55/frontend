import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { editAccountSchema, type EditAccountFormValues } from '@/features/admin/schemas/admin-account.schema';
import { useAdminUpdateAccount } from '@/features/admin/hooks/useAdminAccounts';
import { handleErrorApi } from '@/shared/lib/errors';
import type { AccountDto } from '@/shared/types/account.types';

interface Props {
  open: boolean;
  onClose: () => void;
  account: AccountDto;
}

export default function EditAccountDialog({ open, onClose, account }: Props) {
  const { mutateAsync, isPending } = useAdminUpdateAccount();

  const {
    register, handleSubmit, setError, reset,
    formState: { errors },
  } = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountSchema),
    values: {
      fullName: account.fullName,
      phoneNumber: account.phoneNumber ?? '',
      dateOfBirth: account.dateOfBirth ?? '',
      address: account.address ?? '',
    },
  });

  const handleClose = () => { reset(); onClose(); };

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
      toast.success('Cập nhật tài khoản thành công');
      handleClose();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={account.email} disabled className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label>Họ và tên <span className="text-red-500">*</span></Label>
            <Input {...register('fullName')} />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input {...register('phoneNumber')} placeholder="0912345678" />
              {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Ngày sinh</Label>
              <Input type="date" {...register('dateOfBirth')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Địa chỉ</Label>
            <Input {...register('address')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Hủy</Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
