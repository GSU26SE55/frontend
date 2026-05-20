import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/features/auth/schemas/change-password.schema';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import { handleErrorApi } from '@/shared/lib/errors';

const ChangePasswordForm = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError, reset } =
    useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const { mutateAsync, isPending } = useChangePassword();

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await mutateAsync(data);
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      reset();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input type={showCurrent ? 'text' : 'password'} {...register('currentPassword')} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Mật khẩu mới</Label>
            <div className="relative">
              <Input type={showNew ? 'text' : 'password'} {...register('newPassword')} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input type={showConfirm ? 'text' : 'password'} {...register('confirmPassword')} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đổi mật khẩu
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;
