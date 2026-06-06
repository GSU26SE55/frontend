import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  forgotPasswordStep2Schema,
  type ForgotPasswordStep2Values,
} from "@/features/auth/schemas/forgot-password.schema";
import { useVerifyResetOtp } from "@/features/auth/hooks/useVerifyResetOtp";
import { useResendResetOtp } from "@/features/auth/hooks/useResendResetOtp";
import OtpBoxInput from "./OtpBoxInput";

const RESEND_COOLDOWN = 60;

interface ResetOtpVerifyFormProps {
  email: string;
  onSuccess: (resetToken: string) => void;
}

const ResetOtpVerifyForm = ({ email, onSuccess }: ResetOtpVerifyFormProps) => {
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordStep2Values>({
    resolver: zodResolver(forgotPasswordStep2Schema),
    defaultValues: { otp: "" },
  });

  const { mutate: verifyOtp, isPending: isVerifying } =
    useVerifyResetOtp(onSuccess);
  const { mutate: resendOtp, isPending: isResending } = useResendResetOtp();

  useEffect(() => {
    if (countdown === 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const onSubmit = (data: ForgotPasswordStep2Values) =>
    verifyOtp({ email, otp: data.otp });

  const handleResend = () => {
    resendOtp({ email });
    setCountdown(RESEND_COOLDOWN);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-center text-sm text-muted-foreground">
        Nhập mã 6 chữ số đã gửi đến{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

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
          <p className="text-center text-xs text-destructive">
            {errors.otp.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
        disabled={isVerifying}
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Đang xác thực…
          </>
        ) : (
          "Xác nhận OTP"
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          disabled={countdown > 0 || isResending}
          onClick={handleResend}
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại OTP"}
        </button>
      </div>
    </form>
  );
};

export default ResetOtpVerifyForm;
