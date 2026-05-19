import type { CSSProperties } from 'react';
import React, { useState, useEffect } from 'react';
import loginBg from '@/assets/hero1.jpg';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Eye, EyeOff, Lock, Mail, Phone, Send, User, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import OtpBoxInput from '@/features/auth/components/OtpBoxInput';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/register.schema';
import { otpVerifySchema, type OtpVerifyFormValues } from '@/features/auth/schemas/otp-verify.schema';
import {
  forgotPasswordStep1Schema,
  forgotPasswordStep2Schema,
  forgotPasswordStep3Schema,
  type ForgotPasswordStep1Values,
  type ForgotPasswordStep2Values,
  type ForgotPasswordStep3Values,
} from '@/features/auth/schemas/forgot-password.schema';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { useVerifyOtp } from '@/features/auth/hooks/useVerifyOtp';
import { useResendOtp } from '@/features/auth/hooks/useResendOtp';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { useVerifyResetOtp } from '@/features/auth/hooks/useVerifyResetOtp';
import { useResendResetOtp } from '@/features/auth/hooks/useResendResetOtp';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import { env } from '@/config/env';
import { ENDPOINTS } from '@/shared/utils/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'login' | 'register' | 'otp-verify' | 'forgot' | 'reset-otp' | 'reset-password';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Framer Motion ────────────────────────────────────────────────────────────

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36, filter: 'blur(4px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24, filter: 'blur(2px)' }),
};

const springTransition = { type: 'spring' as const, stiffness: 480, damping: 36, mass: 0.8 };

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.02 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: -18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 28, mass: 0.8 } },
};

// ─── Atoms ────────────────────────────────────────────────────────────────────

const Item = ({ children }: { children: React.ReactNode }) => (
  <motion.div variants={staggerItem}>{children}</motion.div>
);

const StaggerForm = ({
  children,
  onSubmit,
  className,
}: {
  children: React.ReactNode;
  onSubmit?: React.FormEventHandler;
  className?: string;
}) => (
  <motion.form
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    onSubmit={onSubmit}
    className={cn('space-y-3', className)}
    noValidate
  >
    {children}
  </motion.form>
);

const PillInput = React.forwardRef<
  HTMLInputElement,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    error?: string;
    rightSlot?: React.ReactNode;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'>
>(({ icon: Icon, label, error, rightSlot, className, ...props }, ref) => (
  <div className="space-y-1.5">
    <div
      className={cn(
        'relative flex h-16 items-center rounded-full border-2 bg-background transition-all duration-200',
        'focus-within:shadow-[0_0_0_3px_oklch(0.50_0.22_260_/_0.12)]',
        error
          ? 'border-destructive/60 focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
          : 'border-border focus-within:border-primary/70',
        className,
      )}
    >
      <Icon className="absolute left-5 size-[1.35rem] shrink-0 text-muted-foreground" />
      <input
        ref={ref}
        placeholder=" "
        className="peer h-full w-full rounded-full bg-transparent pl-[3.25rem] pr-12 font-semibold text-foreground outline-none"
        {...props}
      />
      <span className="pointer-events-none absolute left-[3.25rem] select-none text-muted-foreground transition-opacity duration-300 peer-focus:opacity-0 peer-[:not(:placeholder-shown)]:opacity-0">
        {label}
      </span>
      {rightSlot && <div className="absolute right-4">{rightSlot}</div>}
    </div>
    {error && <p className="pl-5 text-xs text-destructive">{error}</p>}
  </div>
));
PillInput.displayName = 'PillInput';

const PillPasswordInput = React.forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'placeholder' | 'type'
  >
>(({ label, error, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <PillInput
      ref={ref}
      icon={Lock}
      label={label}
      error={error}
      type={show ? 'text' : 'password'}
      autoComplete="current-password"
      rightSlot={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(v => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...props}
    />
  );
});
PillPasswordInput.displayName = 'PillPasswordInput';

const PillButton = ({
  children,
  isPending,
  className,
  ...props
}: { children: React.ReactNode; isPending?: boolean } & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
>) => (
  <button
    type="submit"
    disabled={isPending}
    className={cn(
      'flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground',
      'shadow-[0_4px_20px_oklch(0.50_0.22_260_/_0.25)]',
      'transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_28px_oklch(0.50_0.22_260_/_0.35)]',
      'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55',
      className,
    )}
    {...props}
  >
    {isPending ? <Loader2 className="size-4 animate-spin" /> : children}
  </button>
);

const OrDivider = () => (
  <div className="relative flex items-center">
    <div className="flex-1 border-t border-border" />
    <span className="mx-3 text-xs text-muted-foreground">hoặc</span>
    <div className="flex-1 border-t border-border" />
  </div>
);

const ThemedOtpInput = (props: React.ComponentProps<typeof OtpBoxInput>) => (
  <div className="[&_input]:border-2 [&_input]:border-border [&_input]:bg-background [&_input]:text-foreground [&_input]:focus:border-primary [&_input]:focus:ring-0 [&_input]:focus:outline-none">
    <OtpBoxInput {...props} />
  </div>
);

const ResendButton = ({ onResend, isResending }: { onResend: () => void; isResending: boolean }) => {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown === 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  return (
    <button
      type="button"
      disabled={countdown > 0 || isResending}
      onClick={() => { onResend(); setCountdown(60); }}
      className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-50"
    >
      {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã OTP'}
    </button>
  );
};

// ─── Steps ────────────────────────────────────────────────────────────────────

const LoginStep = ({ onForgotPassword, onRegister }: { onForgotPassword: () => void; onRegister: () => void }) => {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const { mutate, isPending } = useLogin(setError);

  return (
    <StaggerForm onSubmit={handleSubmit(data => mutate(data))}>
      <Item>
        <h2 className="pb-2 text-center text-2xl font-bold tracking-tight text-foreground">Chào mừng trở lại</h2>
      </Item>
      <Item>
        <PillInput icon={Mail} label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      </Item>
      <Item>
        <PillPasswordInput label="Mật khẩu" error={errors.password?.message} {...register('password')} />
      </Item>
      <Item>
        <div className="flex justify-end">
          <button type="button" onClick={onForgotPassword} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Quên mật khẩu?
          </button>
        </div>
      </Item>
      <Item>
        <PillButton isPending={isPending}>Đăng nhập <Send className="size-4" /></PillButton>
      </Item>
      <Item><OrDivider /></Item>
      <Item>
        <button
          type="button"
          onClick={() => (window.location.href = `${env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.GOOGLE_LOGIN}`)}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full border-2 border-border bg-background text-sm font-semibold text-muted-foreground transition-all duration-200 hover:border-border/70 hover:text-foreground"
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Tiếp tục với Google
        </button>
      </Item>
      <Item>
        <p className="text-center text-xs text-muted-foreground">
          Chưa có tài khoản?{' '}
          <button type="button" onClick={onRegister} className="font-semibold text-foreground underline-offset-2 transition-colors hover:underline">
            Đăng ký
          </button>
        </p>
      </Item>
    </StaggerForm>
  );
};

const RegisterStep = ({ onLogin, onOtpSent }: { onLogin: () => void; onOtpSent: (email: string) => void }) => {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });
  const { mutate, isPending } = useRegister(setError, onOtpSent);

  return (
    <StaggerForm onSubmit={handleSubmit(data => mutate(data))}>
      <Item>
        <h2 className="pb-2 text-center text-2xl font-bold tracking-tight text-foreground">Tạo tài khoản</h2>
      </Item>
      <Item><PillInput icon={User} label="Họ và tên" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} /></Item>
      <Item><PillInput icon={Mail} label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /></Item>
      <Item><PillInput icon={Phone} label="Số điện thoại" type="tel" autoComplete="tel" inputMode="tel" error={errors.phoneNumber?.message} {...register('phoneNumber')} /></Item>
      <Item><PillPasswordInput label="Mật khẩu" autoComplete="new-password" error={errors.password?.message} {...register('password')} /></Item>
      <Item><PillPasswordInput label="Xác nhận mật khẩu" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} /></Item>
      <Item><PillButton isPending={isPending}>Tạo tài khoản <Send className="size-4" /></PillButton></Item>
      <Item>
        <p className="text-center text-xs text-muted-foreground">
          Đã có tài khoản?{' '}
          <button type="button" onClick={onLogin} className="font-semibold text-foreground underline-offset-2 transition-colors hover:underline">Đăng nhập</button>
        </p>
      </Item>
    </StaggerForm>
  );
};

const OtpVerifyStep = ({ email, onSuccess }: { email: string; onSuccess: () => void }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<OtpVerifyFormValues>({ resolver: zodResolver(otpVerifySchema), defaultValues: { otp: '' } });
  const { mutate: verify, isPending } = useVerifyOtp(onSuccess);
  const { mutate: resend, isPending: isResending } = useResendOtp();

  return (
    <StaggerForm onSubmit={handleSubmit(data => verify({ email, otp: data.otp }))}>
      <Item>
        <div className="pb-2 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Xác thực tài khoản</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Mã đã gửi đến <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>
      </Item>
      <Item>
        <Controller
          name="otp"
          control={control}
          render={({ field, fieldState }) => (
            <ThemedOtpInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} hasError={!!fieldState.error} disabled={isPending} />
          )}
        />
        {errors.otp && <p className="mt-1.5 text-center text-xs text-destructive">{errors.otp.message}</p>}
      </Item>
      <Item><PillButton isPending={isPending}>Xác thực <ShieldCheck className="size-4" /></PillButton></Item>
      <Item><ResendButton onResend={() => resend({ email })} isResending={isResending} /></Item>
    </StaggerForm>
  );
};

const ForgotStep = ({ onSuccess }: { onSuccess: (email: string) => void }) => {
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotPasswordStep1Values>({ resolver: zodResolver(forgotPasswordStep1Schema) });
  const { mutate, isPending } = useForgotPassword(() => onSuccess(getValues('email')));

  return (
    <StaggerForm onSubmit={handleSubmit(data => mutate(data))}>
      <Item>
        <div className="pb-2 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Quên mật khẩu</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">Nhập email để nhận mã OTP đặt lại mật khẩu</p>
        </div>
      </Item>
      <Item><PillInput icon={Mail} label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /></Item>
      <Item><PillButton isPending={isPending}>Gửi mã OTP <Send className="size-4" /></PillButton></Item>
    </StaggerForm>
  );
};

const ResetOtpStep = ({ email, onSuccess }: { email: string; onSuccess: (token: string) => void }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordStep2Values>({ resolver: zodResolver(forgotPasswordStep2Schema), defaultValues: { otp: '' } });
  const { mutate: verify, isPending } = useVerifyResetOtp(onSuccess);
  const { mutate: resend, isPending: isResending } = useResendResetOtp();

  return (
    <StaggerForm onSubmit={handleSubmit(data => verify({ email, otp: data.otp }))}>
      <Item>
        <div className="pb-2 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Xác thực OTP</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Mã đã gửi đến <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>
      </Item>
      <Item>
        <Controller
          name="otp"
          control={control}
          render={({ field, fieldState }) => (
            <ThemedOtpInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} hasError={!!fieldState.error} disabled={isPending} />
          )}
        />
        {errors.otp && <p className="mt-1.5 text-center text-xs text-destructive">{errors.otp.message}</p>}
      </Item>
      <Item><PillButton isPending={isPending}>Xác nhận <ShieldCheck className="size-4" /></PillButton></Item>
      <Item><ResendButton onResend={() => resend({ email })} isResending={isResending} /></Item>
    </StaggerForm>
  );
};

const ResetPasswordStep = ({ resetToken, onSuccess }: { resetToken: string; onSuccess: () => void }) => {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<ForgotPasswordStep3Values>({ resolver: zodResolver(forgotPasswordStep3Schema) });
  const { mutate, isPending } = useResetPassword(setError, onSuccess);

  return (
    <StaggerForm onSubmit={handleSubmit(data => mutate({ resetToken, newPassword: data.newPassword, confirmPassword: data.confirmPassword }))}>
      <Item>
        <div className="pb-2 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Đặt lại mật khẩu</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">Nhập mật khẩu mới của bạn</p>
        </div>
      </Item>
      <Item><PillPasswordInput label="Mật khẩu mới" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} /></Item>
      <Item><PillPasswordInput label="Xác nhận mật khẩu" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} /></Item>
      <Item><PillButton isPending={isPending}>Đặt lại mật khẩu <Send className="size-4" /></PillButton></Item>
    </StaggerForm>
  );
};

// ─── Dialog ───────────────────────────────────────────────────────────────────

const BACK_MAP: Partial<Record<Step, Step>> = {
  register: 'login',
  forgot: 'login',
  'reset-otp': 'forgot',
};

const dialogTheme = {
  '--primary': 'oklch(0.50 0.22 260)',
  '--primary-foreground': 'oklch(0.985 0 0)',
  '--ring': 'oklch(0.50 0.22 260)',
} as CSSProperties;

const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const [step, setStep] = useState<Step>('login');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const goTo = (next: Step, dir: 1 | -1 = 1) => { setDirection(dir); setStep(next); };

  const handleOpenChange = (val: boolean) => {
    if (!val) setTimeout(() => { setStep('login'); setDirection(1); setEmail(''); setResetToken(''); }, 250);
    onOpenChange(val);
  };

  const backStep = BACK_MAP[step];
  const showImage = step === 'login';

  const renderStep = () => {
    switch (step) {
      case 'login':
        return <LoginStep onForgotPassword={() => goTo('forgot')} onRegister={() => goTo('register')} />;
      case 'register':
        return <RegisterStep onLogin={() => goTo('login', -1)} onOtpSent={e => { setEmail(e); goTo('otp-verify'); }} />;
      case 'otp-verify':
        return <OtpVerifyStep email={email} onSuccess={() => goTo('login', -1)} />;
      case 'forgot':
        return <ForgotStep onSuccess={e => { setEmail(e); goTo('reset-otp'); }} />;
      case 'reset-otp':
        return <ResetOtpStep email={email} onSuccess={token => { setResetToken(token); goTo('reset-password'); }} />;
      case 'reset-password':
        return <ResetPasswordStep resetToken={resetToken} onSuccess={() => goTo('login', -1)} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/60 backdrop-blur-sm"
        className="gap-0 overflow-hidden border border-border ring-0 bg-background p-0 text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.10)] rounded-3xl max-w-[calc(100%-2rem)] sm:max-w-[420px] lg:w-fit lg:max-w-none lg:min-w-[400px]"
        style={dialogTheme}
      >
        <DialogTitle className="sr-only">
          {{ login: 'Đăng nhập', register: 'Đăng ký', 'otp-verify': 'Xác thực OTP', forgot: 'Quên mật khẩu', 'reset-otp': 'Xác thực OTP', 'reset-password': 'Đặt lại mật khẩu' }[step]}
        </DialogTitle>

        <div className="flex items-stretch">
          {/* Left: form panel */}
          <div className="flex w-full flex-shrink-0 flex-col lg:w-[400px]">
            <AnimatePresence initial={false}>
              {backStep && (
                <motion.div
                  key="back-bar"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden border-b border-border"
                >
                  <button
                    type="button"
                    onClick={() => goTo(backStep, -1)}
                    className="flex w-full items-center gap-1.5 px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronLeft className="size-4" />
                    Quay lại
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout transition={springTransition} style={{ overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={springTransition}
                  className="px-8 py-8"
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right: image panel — only on login step */}
          <AnimatePresence initial={false}>
            {showImage && (
              <motion.div
                key="img-panel"
                initial={{ width: 0 }}
                animate={{ width: 280 }}
                exit={{ width: 0 }}
                transition={springTransition}
                className="relative hidden shrink-0 overflow-hidden lg:block"
              >
                <motion.div
                  initial={{ x: 280 }}
                  animate={{ x: 0 }}
                  exit={{ x: 280 }}
                  transition={springTransition}
                  className="absolute inset-3"
                >
                  <div className="h-full overflow-hidden rounded-2xl">
                    <img src={loginBg} alt="" aria-hidden className="h-full w-full object-cover" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
