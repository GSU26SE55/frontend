import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleErrorApi } from '@/shared/lib/errors';
import { transferOwnerSchema, type TransferOwnerFormValues } from '@/features/admin/schemas/battery-asset.schema';
import { useCustomers } from '@/features/admin/hooks/useCustomers';
import { useTransferOwner } from '@/features/admin/hooks/useTransferOwner';

interface TransferOwnerDialogProps {
  open:            boolean;
  onOpenChange:    (open: boolean) => void;
  assetId:         string;
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
    formState: { errors, isSubmitting },
  } = useForm<TransferOwnerFormValues>({
    resolver: zodResolver(transferOwnerSchema),
  });

  const onSubmit = async (data: TransferOwnerFormValues) => {
    if (data.newCustomerId === currentCustomerId) {
      setError('newCustomerId', { message: 'Phải chọn khách hàng khác' });
      return;
    }
    try {
      await transferOwner(data);
      toast.success('Chuyển chủ sở hữu thành công');
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  const selectClass =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chuyển chủ sở hữu</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="newCustomerId">Khách hàng mới *</Label>
            <select id="newCustomerId" {...register('newCustomerId')} className={selectClass}>
              <option value="">-- Chọn khách hàng --</option>
              {customersData?.items
                .filter((c) => c.id !== currentCustomerId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
                ))}
            </select>
            {errors.newCustomerId && (
              <p className="text-sm text-destructive">{errors.newCustomerId.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason">Lý do</Label>
            <Input id="reason" {...register('reason')} placeholder="Tuỳ chọn" />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Chuyển
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
