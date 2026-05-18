import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  forgotPasswordStep1Schema,
  type ForgotPasswordStep1Values,
} from '@/features/auth/schemas/forgot-password.schema';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
}

const ForgotPasswordForm = ({ onSuccess }: ForgotPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordStep1Values>({
    resolver: zodResolver(forgotPasswordStep1Schema),
  });

  const { mutate, isPending } = useForgotPassword(() => onSuccess(getValues('email')));

  const onSubmit = (data: ForgotPasswordStep1Values) => mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Đang gửi...' : 'Gửi mã OTP'}
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
