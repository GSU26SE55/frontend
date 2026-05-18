import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  forgotPasswordStep2Schema,
  type ForgotPasswordStep2Values,
} from '@/features/auth/schemas/forgot-password.schema';
import { useVerifyResetOtp } from '@/features/auth/hooks/useVerifyResetOtp';
import { useResendResetOtp } from '@/features/auth/hooks/useResendResetOtp';

const RESEND_COOLDOWN = 60;

interface ResetOtpVerifyFormProps {
  email: string;
  onSuccess: (resetToken: string) => void;
}

const ResetOtpVerifyForm = ({ email, onSuccess }: ResetOtpVerifyFormProps) => {
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordStep2Values>({
    resolver: zodResolver(forgotPasswordStep2Schema),
  });

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyResetOtp(onSuccess);
  const { mutate: resendOtp, isPending: isResending } = useResendResetOtp();

  useEffect(() => {
    if (countdown === 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const onSubmit = (data: ForgotPasswordStep2Values) =>
    verifyOtp({ email, otp: data.otp });

  const handleResend = () => {
    resendOtp({ email });
    setCountdown(RESEND_COOLDOWN);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Nhập mã OTP đã gửi đến <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="space-y-1">
        <Label htmlFor="reset-otp">Mã OTP</Label>
        <Input
          id="reset-otp"
          placeholder="123456"
          maxLength={6}
          {...register('otp')}
        />
        {errors.otp && <p className="text-sm text-destructive">{errors.otp.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isVerifying}>
        {isVerifying ? 'Đang xác thực...' : 'Xác nhận OTP'}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={countdown > 0 || isResending}
          onClick={handleResend}
        >
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP'}
        </Button>
      </div>
    </form>
  );
};

export default ResetOtpVerifyForm;
