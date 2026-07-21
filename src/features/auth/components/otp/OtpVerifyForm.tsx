import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  otpVerifySchema,
  type OtpVerifyFormValues,
} from "@/features/auth/schemas/otp/otp-verify.schema";
import { useVerifyOtp } from "@/features/auth/hooks/otp/useVerifyOtp";
import { useResendOtp } from "@/features/auth/hooks/otp/useResendOtp";
import OtpBoxInput from "./OtpBoxInput";

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
    defaultValues: { otp: "" },
  });

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp(
    onSuccess || (() => {}),
  );
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();

  useEffect(() => {
    if (countdown === 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const onSubmit = (data: OtpVerifyFormValues) =>
    verifyOtp({ email, otp: data.otp });

  const handleResend = () => {
    resendOtp({ email });
    setCountdown(RESEND_COOLDOWN);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Xác thực email
        </h1>
        <p className="text-sm text-slate-500">Mã 6 chữ số đã được gửi đến</p>
      </div>

      {/* Email badge */}
      <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
        <Mail className="size-4 shrink-0 text-emerald-500" />
        <span className="text-sm font-medium text-slate-700 truncate">
          {email}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
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
            <p className="text-center text-xs text-red-500">
              {errors.otp.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isVerifying}
          className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang xác thực…
            </>
          ) : (
            "Xác thực"
          )}
        </Button>

        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Chưa nhận được mã?</p>
          <button
            type="button"
            disabled={countdown > 0 || isResending}
            onClick={handleResend}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtpVerifyForm;
