import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  reactivateRequestSchema,
  reactivateVerifySchema,
  type ReactivateRequestFormValues,
  type ReactivateVerifyFormValues,
} from "@/features/auth/schemas/reactivate.schema";
import { useReactivateRequest } from "@/features/auth/hooks/useReactivateRequest";
import { useReactivateVerify } from "@/features/auth/hooks/useReactivateVerify";
import { handleErrorApi } from "@/shared/lib/errors";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

const ReactivatePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");

  const { mutateAsync: requestOtp, isPending: isRequesting } =
    useReactivateRequest();
  const { mutateAsync: verifyOtp, isPending: isVerifying } =
    useReactivateVerify();

  const requestForm = useForm<ReactivateRequestFormValues>({
    resolver: zodResolver(reactivateRequestSchema),
  });
  const verifyForm = useForm<ReactivateVerifyFormValues>({
    resolver: zodResolver(reactivateVerifySchema),
  });

  const onRequest = async (data: ReactivateRequestFormValues) => {
    try {
      await requestOtp(data);
      setEmail(data.email);
      verifyForm.reset({ email: data.email, otp: "" });
      setStep("verify");
      // anti-enumeration: luôn báo cùng message dù email có tồn tại hay không
      toast.success(
        "Nếu tài khoản còn trong window khôi phục 90 ngày, OTP đã được gửi tới email.",
      );
    } catch (error) {
      handleErrorApi({ error, setError: requestForm.setError });
    }
  };

  const onVerify = async (data: ReactivateVerifyFormValues) => {
    try {
      await verifyOtp(data);
      toast.success(AUTH_MESSAGES.account.reactivated);
      navigate("/login", { replace: true });
    } catch (error) {
      handleErrorApi({ error, setError: verifyForm.setError });
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Khôi phục tài khoản
        </h1>
        <p className="text-sm text-slate-500">
          {step === "request"
            ? "Nhập email của tài khoản đã bị xóa (trong vòng 90 ngày)."
            : `Nhập mã OTP đã gửi tới ${email}.`}
        </p>
      </div>

      {step === "request" ? (
        <form
          onSubmit={requestForm.handleSubmit(onRequest)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...requestForm.register("email")}
            />
            {requestForm.formState.errors.email && (
              <p className="text-xs text-red-500">
                {requestForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isRequesting}
            className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
          >
            {isRequesting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Gửi OTP khôi phục
          </Button>
        </form>
      ) : (
        <form
          onSubmit={verifyForm.handleSubmit(onVerify)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="otp">Mã OTP</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              {...verifyForm.register("otp")}
            />
            {verifyForm.formState.errors.otp && (
              <p className="text-xs text-red-500">
                {verifyForm.formState.errors.otp.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isVerifying}
            className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
          >
            {isVerifying && <Loader2 className="mr-2 size-4 animate-spin" />}
            Xác nhận khôi phục
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-slate-500 hover:text-emerald-600"
            onClick={() => setStep("request")}
          >
            Đổi email
          </button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500">
        <Link
          to="/login"
          className="font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
};

export default ReactivatePage;
