import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordStep3Schema,
  type ForgotPasswordStep3Values,
} from "@/features/auth/schemas/forgot-password.schema";
import { useResetPassword } from "@/features/auth/hooks/useResetPassword";
import { handleErrorApi } from "@/shared/lib/errors";
import type { ResetPasswordPayload } from "@/features/auth/types/auth.types";

interface ResetPasswordFormProps {
  resetToken: string;
  onSuccess?: () => void;
}

const ResetPasswordForm = ({
  resetToken,
  onSuccess,
}: ResetPasswordFormProps) => {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordStep3Values>({
    resolver: zodResolver(forgotPasswordStep3Schema),
  });

  const { mutateAsync, isPending } = useResetPassword(onSuccess || (() => {}));

  const onSubmit = async (data: ForgotPasswordStep3Values) => {
    const payload: ResetPasswordPayload = {
      resetToken,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    };
    try {
      await mutateAsync(payload);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            className="h-10 pr-10 border-slate-200 bg-slate-50 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400"
            {...register("newPassword")}
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNew ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            className="h-10 pr-10 border-slate-200 bg-slate-50 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Đang xử lý…
          </>
        ) : (
          "Đặt lại mật khẩu"
        )}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
