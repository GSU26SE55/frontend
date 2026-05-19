import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { otpVerifySchema, type OtpVerifyFormValues } from '@/features/auth/schemas/otp-verify.schema';
import { useVerifyOtp } from '@/features/auth/hooks/useVerifyOtp';
import { useResendOtp } from '@/features/auth/hooks/useResendOtp';
import OtpBoxInput from './OtpBoxInput';

const RESEND_COOLDOWN = 60;

interface OtpVerifyFormProps {
  email: string;
  onSuccess?: () => void;
}

const OtpVerifyForm = ({ email, onSuccess }: OtpVerifyFormProps) => {
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpVerifyFormValues>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { otp: '' },
  });

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp(onSuccess || (() => {}));
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();

  useEffect(() => {
    if (countdown === 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const onSubmit = (data: OtpVerifyFormValues) => verifyOtp({ email, otp: data.otp });

  const handleResend = () => {
    resendOtp({ email });
    setCountdown(RESEND_COOLDOWN);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl tracking-tight">Xác thực OTP</CardTitle>
        <CardDescription>
          Nhập mã 6 chữ số đã gửi đến{' '}
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Controller
              name="otp"
              control={control}
              render={({ field, fieldState }) => (
                <OtpBoxInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  disabled={isVerifying}
                />
              )}
            />
            {errors.otp && (
              <p className="text-center text-xs text-destructive">{errors.otp.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang xác thực…
              </>
            ) : (
              'Xác thực'
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
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
