import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/features/auth/schemas/change-password.schema";
import { useChangePassword } from "@/features/auth/hooks/useChangePassword";
import { handleErrorApi } from "@/shared/lib/errors";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

interface ChangePasswordFormProps {
  bare?: boolean;
}

function PasswordInput({
  label,
  show,
  onToggle,
  error,
  ...rest
}: {
  label: string;
  show: boolean;
  onToggle: () => void;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          className="pr-9 h-8 text-sm"
          {...rest}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={onToggle}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const ChangePasswordForm = ({ bare }: ChangePasswordFormProps = {}) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const { mutateAsync, isPending } = useChangePassword();

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await mutateAsync(data);
      toast.success(AUTH_MESSAGES.password.changed);
      reset();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="max-w-sm space-y-3">
        <PasswordInput
          label="Mật khẩu hiện tại"
          show={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <PasswordInput
          label="Mật khẩu mới"
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <PasswordInput
          label="Xác nhận mật khẩu mới"
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending} className="mt-1">
          {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Cập nhật mật khẩu
        </Button>
      </div>
    </form>
  );

  if (bare) return form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
};

export default ChangePasswordForm;
