import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useVerify2faLogin } from "@/features/auth/hooks/2fa/useVerify2faLogin";
import { useSend2faSms } from "@/features/auth/hooks/2fa/useSend2faSms";
import { handleErrorApi } from "@/shared/lib/errors";
import { CHALLENGE_TOKEN_KEY } from "@/features/auth/types/auth.types";

type Mode = "totp" | "backup" | "sms";

const Login2faPage = () => {
  const navigate = useNavigate();
  // read challengeToken once on mount (lazy init — avoids set-state-in-effect)
  const [challengeToken] = useState<string | null>(() =>
    sessionStorage.getItem(CHALLENGE_TOKEN_KEY),
  );
  const [mode, setMode] = useState<Mode>("totp");
  const [code, setCode] = useState("");
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);

  // #AUTH-48: trust this device
  const [trustDevice, setTrustDevice] = useState(false);
  const [trustDeviceLabel, setTrustDeviceLabel] = useState("");

  const { mutateAsync, isPending } = useVerify2faLogin();
  const { mutate: sendSms, isPending: isSendingSms } = useSend2faSms();

  useEffect(() => {
    // no challenge → go back to login
    if (!challengeToken) navigate("/login", { replace: true });
  }, [challengeToken, navigate]);

  const isBackup = mode === "backup";
  const isSms = mode === "sms";

  const switchMode = (next: Mode) => {
    setMode(next);
    setCode("");
  };

  const handleSendSms = () => {
    if (!challengeToken) return;
    sendSms(
      { challengeToken },
      {
        onSuccess: (res) => {
          setMaskedPhone(res.data.data ?? null);
          toast.success(res.data.message ?? "OTP sent via SMS");
        },
        onError: (error) => handleErrorApi({ error }),
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    try {
      await mutateAsync({
        challengeToken,
        code,
        isBackupCode: isBackup,
        isSmsCode: isSms,
        // backup code path doesn't trust the device (BE ignores it) → only send when totp/sms
        trustDevice: isBackup ? false : trustDevice,
        trustDeviceLabel:
          !isBackup && trustDevice && trustDeviceLabel.trim()
            ? trustDeviceLabel.trim()
            : undefined,
      });
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  if (!challengeToken) return null;

  const hint = isBackup
    ? "Enter a backup code (xxxx-xxxx)."
    : isSms
      ? maskedPhone
        ? `Enter the 6-digit code sent to ${maskedPhone}.`
        : "Tap send to receive an OTP via SMS."
      : "Enter the 6-digit code from your Authenticator app.";

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Two-factor authentication
        </h1>
        <p className="text-sm text-slate-500">{hint}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSms && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isSendingSms}
            onClick={handleSendSms}
          >
            {isSendingSms && <Loader2 className="mr-2 size-4 animate-spin" />}
            {maskedPhone ? "Resend OTP via SMS" : "Send OTP via SMS"}
          </Button>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="code">
            {isBackup ? "Backup code" : isSms ? "OTP code (SMS)" : "TOTP code"}
          </Label>
          <Input
            id="code"
            autoFocus
            inputMode={isBackup ? "text" : "numeric"}
            placeholder={isBackup ? "abcd-2345" : "123456"}
            value={code}
            onChange={(e) =>
              setCode(
                isBackup
                  ? e.target.value
                  : e.target.value.replace(/\D/g, "").slice(0, 6),
              )
            }
          />
        </div>

        {!isBackup && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="trust-device"
                checked={trustDevice}
                onCheckedChange={(v) => setTrustDevice(v === true)}
              />
              <Label
                htmlFor="trust-device"
                className="text-sm font-normal text-slate-600"
              >
                Trust this device (skip 2FA for 30 days)
              </Label>
            </div>
            {trustDevice && (
              <Input
                placeholder="Device name (e.g. Home MacBook) — optional"
                maxLength={120}
                value={trustDeviceLabel}
                onChange={(e) => setTrustDeviceLabel(e.target.value)}
              />
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending || code.length === 0}
          className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
        >
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Verify
        </Button>

        <div className="flex flex-col gap-1.5 text-center text-sm text-slate-500">
          {!isBackup && (
            <button
              type="button"
              className="hover:text-emerald-600"
              onClick={() => switchMode("backup")}
            >
              Use a backup code instead
            </button>
          )}
          {!isSms && (
            <button
              type="button"
              className="hover:text-emerald-600"
              onClick={() => switchMode("sms")}
            >
              Lost your Authenticator? Get an OTP via SMS
            </button>
          )}
          {mode !== "totp" && (
            <button
              type="button"
              className="hover:text-emerald-600"
              onClick={() => switchMode("totp")}
            >
              Use TOTP code from Authenticator
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login2faPage;
