import { useEffect, useReducer } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';
import ResetOtpVerifyForm from '@/features/auth/components/ResetOtpVerifyForm';
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';
import { cn } from '@/lib/utils';

const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;

const STEPS = [
  { label: 'Email' },
  { label: 'Xác thực' },
  { label: 'Mật khẩu' },
] as const;

type ForgotPasswordStep = 1 | 2 | 3;

interface ForgotPasswordState {
  step: ForgotPasswordStep;
  email: string;
  resetToken: string;
  tokenExpiry: number | null;
  countdown: number;
}

type ForgotPasswordAction =
  | { type: 'OTP_REQUESTED'; email: string }
  | { type: 'OTP_VERIFIED'; resetToken: string; tokenExpiry: number }
  | { type: 'TOKEN_TICK'; countdown: number }
  | { type: 'RESET_FLOW' };

const initialState: ForgotPasswordState = {
  step: 1,
  email: '',
  resetToken: '',
  tokenExpiry: null,
  countdown: 0,
};

const forgotPasswordReducer = (
  state: ForgotPasswordState,
  action: ForgotPasswordAction
): ForgotPasswordState => {
  switch (action.type) {
    case 'OTP_REQUESTED':
      return { ...state, step: 2, email: action.email };
    case 'OTP_VERIFIED':
      return {
        ...state,
        step: 3,
        resetToken: action.resetToken,
        tokenExpiry: action.tokenExpiry,
        countdown: Math.ceil(RESET_TOKEN_TTL_MS / 1000),
      };
    case 'TOKEN_TICK':
      return { ...state, countdown: action.countdown };
    case 'RESET_FLOW':
      return initialState;
    default:
      return state;
  }
};

const ForgotPasswordPage = () => {
  const [state, dispatch] = useReducer(forgotPasswordReducer, initialState);

  useEffect(() => {
    if (state.step !== 3 || state.tokenExpiry === null) return;

    const tokenExpiry = state.tokenExpiry;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((tokenExpiry - Date.now()) / 1000));
      if (remaining === 0) {
        toast.error('Mã xác thực đã hết hạn, vui lòng thử lại.');
        dispatch({ type: 'RESET_FLOW' });
        return true;
      }

      dispatch({ type: 'TOKEN_TICK', countdown: remaining });
      return false;
    };

    if (tick()) return;

    const id = setInterval(() => {
      if (tick()) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [state.step, state.tokenExpiry]);

  const handleStep1Success = (userEmail: string) => {
    dispatch({ type: 'OTP_REQUESTED', email: userEmail });
  };

  const handleStep2Success = (token: string) => {
    dispatch({
      type: 'OTP_VERIFIED',
      resetToken: token,
      tokenExpiry: Date.now() + RESET_TOKEN_TTL_MS,
    });
  };

  const stepTitles = {
    1: { title: 'Quên mật khẩu', description: 'Nhập email để nhận mã OTP' },
    2: { title: 'Xác thực OTP', description: 'Nhập mã OTP đã gửi đến email của bạn' },
    3: { title: 'Đặt lại mật khẩu', description: 'Nhập mật khẩu mới của bạn' },
  };
  const formattedCountdown = `${Math.floor(state.countdown / 60)}:${String(
    state.countdown % 60
  ).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center">
        {STEPS.map((s, i) => {
          const stepNum = (i + 1) as ForgotPasswordStep;
          const isCompleted = state.step > stepNum;
          const isActive = state.step === stepNum;
          return (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : stepNum}
                </div>
                <span
                  className={cn(
                    'text-xs',
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mb-5 h-px w-12 transition-colors',
                    state.step > stepNum ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl tracking-tight">{stepTitles[state.step].title}</CardTitle>
          <CardDescription>{stepTitles[state.step].description}</CardDescription>
          {state.step === 3 && state.countdown > 0 && (
            <p className="pt-1 text-xs font-medium text-amber-600">
              Hết hạn sau: {formattedCountdown}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {state.step === 1 && <ForgotPasswordForm onSuccess={handleStep1Success} />}
          {state.step === 2 && (
            <ResetOtpVerifyForm email={state.email} onSuccess={handleStep2Success} />
          )}
          {state.step === 3 && <ResetPasswordForm resetToken={state.resetToken} />}

          <p className="pt-2 text-center text-xs text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Quay lại đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
