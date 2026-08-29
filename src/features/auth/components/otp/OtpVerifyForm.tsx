import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleErrorApi } from "@/shared/lib/errors";
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
    setError,
    formState: { errors },
  } = useForm<OtpVerifyFormValues>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { otp: "" },
  });

  const { mutateAsync: verifyOtp, isPending: isVerifying } = useVerifyOtp(
    onSuccess || (() => {}),
  );
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();

  useEffect(() => {
    if (countdown === 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const onSubmit = async (data: OtpVerifyFormValues) => {
    try {
      await verifyOtp({ email, otp: data.otp });
    } catch (error) {
      // EntityError (400 + listErrors) → the message appears under the input the BE
      // rejected — a wrong or expired code belongs beside the OTP box, not in a toast.
      handleErrorApi({ error, setError });
    }
  };

  const handleResend = () => {
    resendOtp({ email });
    setCountdown(RESEND_COOLDOWN);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Verify email
        </h1>
        <p className="text-sm text-muted-foreground">
          A 6-digit code was sent to
        </p>
      </div>

      {/* Email badge */}
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted px-3.5 py-2.5">
        <Mail className="size-4 shrink-0 text-emerald-500" />
        <span className="text-sm font-medium text-foreground truncate">
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
              Verifying…
            </>
          ) : (
            "Verify"
          )}
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Didn't get a code?
          </p>
          <button
            type="button"
            disabled={countdown > 0 || isResending}
            onClick={handleResend}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtpVerifyForm;
