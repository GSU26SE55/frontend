import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { confirmOtpSchema, type ConfirmOtpFormValues } from '@/features/auth/schemas/confirm-otp.schema';
import { useSendPhoneOtp } from '@/features/auth/hooks/useSendPhoneOtp';
import { useVerifyPhoneOtp } from '@/features/auth/hooks/useVerifyPhoneOtp';
import { handleErrorApi } from '@/shared/lib/errors';

const COOLDOWN_SECONDS = 60;

const PhoneVerifySection = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { register, handleSubmit, formState: { errors }, setError } =
    useForm<ConfirmOtpFormValues>({ resolver: zodResolver(confirmOtpSchema) });

  const { mutate: sendOtp, isPending: isSending } = useSendPhoneOtp();
  const { mutateAsync: verifyOtp, isPending: isVerifying } = useVerifyPhoneOtp();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = () => {
    sendOtp(undefined, {
      onSuccess: () => {
        toast.success('Đã gửi OTP đến số điện thoại');
        setOtpSent(true);
        setCooldown(COOLDOWN_SECONDS);
      },
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const onSubmit = async (data: ConfirmOtpFormValues) => {
    try {
      await verifyOtp(data);
      toast.success('Xác thực số điện thoại thành công');
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xác thực số điện thoại</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSendOtp} disabled={isSending || cooldown > 0} variant="outline">
          {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi OTP'}
        </Button>

        {otpSent && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Mã OTP</Label>
              <Input maxLength={6} {...register('otp')} />
              {errors.otp && <p className="text-sm text-destructive">{errors.otp.message}</p>}
            </div>
            <Button type="submit" disabled={isVerifying}>
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PhoneVerifySection;
