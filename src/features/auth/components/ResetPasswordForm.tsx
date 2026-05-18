import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  forgotPasswordStep3Schema,
  type ForgotPasswordStep3Values,
} from '@/features/auth/schemas/forgot-password.schema';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import type { ResetPasswordPayload } from '@/features/auth/types/auth.types';

interface ResetPasswordFormProps {
  resetToken: string;
}

const ResetPasswordForm = ({ resetToken }: ResetPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordStep3Values>({
    resolver: zodResolver(forgotPasswordStep3Schema),
  });

  const { mutate, isPending } = useResetPassword(setError);

  const onSubmit = (data: ForgotPasswordStep3Values) => {
    const payload: ResetPasswordPayload = {
      resetToken,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    };
    mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="••••••••"
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
