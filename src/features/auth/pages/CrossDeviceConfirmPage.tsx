import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  crossDeviceConfirmSchema,
  type CrossDeviceConfirmFormValues,
} from "@/features/auth/schemas/cross-device-confirm.schema";
import { useConfirmCrossDevice2fa } from "@/features/auth/hooks/useConfirmCrossDevice2fa";
import { handleErrorApi } from "@/shared/lib/errors";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

// #AUTH-51: Device B — confirm setup 2FA bằng token từ email + TOTP.
const CrossDeviceConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);

  const { mutateAsync, isPending } = useConfirmCrossDevice2fa();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CrossDeviceConfirmFormValues>({
    resolver: zodResolver(crossDeviceConfirmSchema),
    defaultValues: { confirmToken: token, totpCode: "" },
  });

  const onSubmit = async (data: CrossDeviceConfirmFormValues) => {
    try {
      await mutateAsync(data);
      setDone(true);
      toast.success(AUTH_MESSAGES.twoFactor.enabledSimple);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-600" />
            Xác nhận bật 2FA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                Link không hợp lệ — thiếu token. Vui lòng mở lại link từ email.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/settings")}
              >
                Tới Cài đặt bảo mật
              </Button>
            </div>
          ) : done ? (
            <div className="space-y-3">
              <p className="text-sm">
                Đã bật xác thực 2 lớp. Thiết bị gốc sẽ tự cập nhật khi bạn làm
                mới.
              </p>
              <p className="text-sm text-amber-600">
                ⚠️ Setup qua thiết bị khác <strong>không</strong> sinh backup
                codes. Hãy vào Cài đặt → Bảo mật để sinh backup codes ngay,
                tránh mất quyền truy cập nếu mất Authenticator.
              </p>
              <Button className="w-full" onClick={() => navigate("/settings")}>
                Tới Cài đặt bảo mật
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nhập mã 6 số từ ứng dụng Authenticator sau khi đã quét QR / nhập
                secret từ thiết bị gốc.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="totpCode">Mã TOTP</Label>
                <Input
                  id="totpCode"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  {...register("totpCode")}
                />
                {errors.totpCode && (
                  <p className="text-xs text-red-500">
                    {errors.totpCode.message}
                  </p>
                )}
                {errors.confirmToken && (
                  <p className="text-xs text-red-500">
                    {errors.confirmToken.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Xác nhận bật 2FA
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CrossDeviceConfirmPage;
