import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';
import ResetOtpVerifyForm from '@/features/auth/components/ResetOtpVerifyForm';
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';

const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (step !== 3 || tokenExpiry === null) return;

    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((tokenExpiry - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        toast.error('Mã xác thực đã hết hạn, vui lòng thử lại.');
        setStep(1);
        setEmail('');
        setResetToken('');
        setTokenExpiry(null);
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [step, tokenExpiry]);

  const handleStep1Success = (userEmail: string) => {
    setEmail(userEmail);
    setStep(2);
  };

  const handleStep2Success = (token: string) => {
    setResetToken(token);
    setTokenExpiry(Date.now() + RESET_TOKEN_TTL_MS);
    setStep(3);
  };

  const stepTitles = {
    1: { title: 'Quên mật khẩu', description: 'Nhập email để nhận mã OTP' },
    2: { title: 'Xác thực OTP', description: 'Nhập mã OTP đã gửi đến email của bạn' },
    3: { title: 'Đặt lại mật khẩu', description: 'Nhập mật khẩu mới của bạn' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{stepTitles[step].title}</CardTitle>
            <CardDescription className="mt-1">{stepTitles[step].description}</CardDescription>
          </div>
          <span className="text-xs text-muted-foreground">Bước {step}/3</span>
        </div>
        {step === 3 && countdown > 0 && (
          <p className="text-xs text-amber-600">
            Mã hết hạn sau: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && <ForgotPasswordForm onSuccess={handleStep1Success} />}
        {step === 2 && <ResetOtpVerifyForm email={email} onSuccess={handleStep2Success} />}
        {step === 3 && <ResetPasswordForm resetToken={resetToken} />}

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordPage;
