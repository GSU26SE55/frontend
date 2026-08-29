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
} from "@/features/auth/schemas/2fa/cross-device-confirm.schema";
import { useConfirmCrossDevice2fa } from "@/features/auth/hooks/2fa/useConfirmCrossDevice2fa";
import { handleErrorApi } from "@/shared/lib/errors";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { redirectByRole } from "@/shared/types/account/session.types";

// #AUTH-51: Device B — confirm 2FA setup using the token from email + TOTP.
const CrossDeviceConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  // Settings lives inside each role's layout (/admin/settings, ...) — this page sits
  // outside AppLayout, so it has to build the role-prefixed path itself.
  const role = useSessionStore((s) => s.user?.role);
  const settingsPath = role ? `${redirectByRole(role)}/settings` : "/login";
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
            Confirm 2FA activation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                Invalid link — missing token. Please reopen the link from the
                email.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(settingsPath)}
              >
                Go to security settings
              </Button>
            </div>
          ) : done ? (
            <div className="space-y-3">
              <p className="text-sm">
                Two-factor authentication enabled. The original device will
                update automatically on refresh.
              </p>
              <p className="text-sm text-amber-600">
                ⚠️ Setup from another device does <strong>not</strong>
                generate backup codes. Go to Settings → Security to generate
                backup codes now, to avoid losing access if you lose your
                Authenticator.
              </p>
              <Button className="w-full" onClick={() => navigate(settingsPath)}>
                Go to security settings
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your Authenticator app after
                scanning the QR / entering the secret from the original device.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="totpCode">TOTP code</Label>
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
                Confirm 2FA activation
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CrossDeviceConfirmPage;
