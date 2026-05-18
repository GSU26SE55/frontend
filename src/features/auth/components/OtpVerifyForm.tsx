import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { otpVerifySchema, type OtpVerifyFormValues } from '@/features/auth/schemas/otp-verify.schema';
import { useVerifyOtp } from '@/features/auth/hooks/useVerifyOtp';
import { useResendOtp } from '@/features/auth/hooks/useResendOtp';

const RESEND_COOLDOWN = 60;

interface OtpVerifyFormProps {
  email: string;
}

const OtpVerifyForm = ({ email }: OtpVerifyFormProps) => {
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpVerifyFormValues>({ resolver: zodResolver(otpVerifySchema) });

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp();
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();

  useEffect(() => {
    if (countdown === 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const onSubmit = (data: OtpVerifyFormValues) =>
    verifyOtp({ email, otp: data.otp });

  const handleResend = () => {
    resendOtp({ email });
    setCountdown(RESEND_COOLDOWN);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xác thực OTP</CardTitle>
        <CardDescription>
          Mã OTP đã được gửi đến <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="otp">Mã OTP</Label>
            <Input
              id="otp"
              placeholder="123456"
              maxLength={6}
              {...register('otp')}
            />
            {errors.otp && (
              <p className="text-sm text-destructive">{errors.otp.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? 'Đang xác thực...' : 'Xác thực'}
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
      </CardContent>
    </Card>
  );
};

export default OtpVerifyForm;
