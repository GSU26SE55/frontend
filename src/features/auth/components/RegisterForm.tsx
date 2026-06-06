import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas/register.schema";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { handleErrorApi } from "@/shared/lib/errors";

interface RegisterFormProps {
  onLogin?: () => void;
  onOtpSent?: (email: string) => void;
}

const RegisterForm = ({ onLogin, onOtpSent }: RegisterFormProps = {}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const { mutateAsync, isPending } = useRegister(onOtpSent || (() => {}));
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await mutateAsync(data);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  const inputCls =
    "h-10 border-slate-200 bg-slate-50 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400";

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Tạo tài khoản
        </h1>
        <p className="text-sm text-slate-500">
          Điền thông tin để bắt đầu sử dụng hệ thống
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Full name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="fullName"
            className="text-sm font-medium text-slate-700"
          >
            Họ và tên
          </Label>
          <Input
            id="fullName"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            className={inputCls}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={inputCls}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label
            htmlFor="phoneNumber"
            className="text-sm font-medium text-slate-700"
          >
            Số điện thoại
          </Label>
          <Input
            id="phoneNumber"
            placeholder="0912345678"
            autoComplete="tel"
            inputMode="tel"
            className={inputCls}
            {...register("phoneNumber")}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Mật khẩu
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`${inputCls} pr-10`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn" : "Hiện"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-700"
          >
            Xác nhận mật khẩu
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`${inputCls} pr-10`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Ẩn" : "Hiện"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showConfirm ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang xử lý…
            </>
          ) : (
            "Tạo tài khoản"
          )}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          {onLogin ? (
            <button
              type="button"
              onClick={onLogin}
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline cursor-pointer"
            >
              Đăng nhập
            </button>
          ) : (
            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline"
            >
              Đăng nhập
            </Link>
          )}
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
