import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  changeEmailSchema,
  type ChangeEmailFormValues,
} from "@/features/auth/schemas/change-email.schema";
import {
  confirmOtpSchema,
  type ConfirmOtpFormValues,
} from "@/features/auth/schemas/confirm-otp.schema";
import { useChangeEmail } from "@/features/auth/hooks/useChangeEmail";
import { useConfirmEmailChange } from "@/features/auth/hooks/useConfirmEmailChange";
import { handleErrorApi } from "@/shared/lib/errors";

interface ChangeEmailFormProps {
  bare?: boolean;
}

const ChangeEmailForm = ({ bare }: ChangeEmailFormProps = {}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const emailForm = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
  });
  const otpForm = useForm<ConfirmOtpFormValues>({
    resolver: zodResolver(confirmOtpSchema),
  });

  const { mutateAsync: changeEmail, isPending: isSendingEmail } = useChangeEmail();
  const { mutateAsync: confirmChange, isPending: isConfirming } = useConfirmEmailChange();

  const onEmailSubmit = async (data: ChangeEmailFormValues) => {
    try {
      await changeEmail(data);
      toast.success("Đã gửi OTP đến email mới");
      setStep(2);
    } catch (error) {
      handleErrorApi({ error, setError: emailForm.setError });
    }
  };

  const onOtpSubmit = async (data: ConfirmOtpFormValues) => {
    try {
      await confirmChange(data);
      toast.success("Đổi email thành công. Vui lòng đăng nhập lại.");
    } catch (error) {
      handleErrorApi({ error, setError: otpForm.setError });
    }
  };

  const content = step === 1 ? (
    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Email mới</Label>
        <Input
          type="email"
          className="h-8 text-sm"
          {...emailForm.register("newEmail")}
        />
        {emailForm.formState.errors.newEmail && (
          <p className="text-xs text-destructive">
            {emailForm.formState.errors.newEmail.message}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Mật khẩu hiện tại</Label>
        <Input
          type="password"
          className="h-8 text-sm"
          {...emailForm.register("currentPassword")}
        />
        {emailForm.formState.errors.currentPassword && (
          <p className="text-xs text-destructive">
            {emailForm.formState.errors.currentPassword.message}
          </p>
        )}
      </div>
      <Button type="submit" size="sm" disabled={isSendingEmail} className="mt-1">
        {isSendingEmail && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Gửi OTP xác nhận
      </Button>
    </form>
  ) : (
    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Nhập mã OTP đã gửi đến email mới của bạn.
      </p>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Mã OTP</Label>
        <Input
          maxLength={6}
          className="h-8 text-sm tracking-widest"
          {...otpForm.register("otp")}
        />
        {otpForm.formState.errors.otp && (
          <p className="text-xs text-destructive">
            {otpForm.formState.errors.otp.message}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)}>
          Quay lại
        </Button>
        <Button type="submit" size="sm" disabled={isConfirming}>
          {isConfirming && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Xác nhận
        </Button>
      </div>
    </form>
  );

  if (bare) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi email</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default ChangeEmailForm;
