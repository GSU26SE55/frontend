import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useVerify2faLogin } from "@/features/auth/hooks/useVerify2faLogin";
import { useSend2faSms } from "@/features/auth/hooks/useSend2faSms";
import { handleErrorApi } from "@/shared/lib/errors";
import { CHALLENGE_TOKEN_KEY } from "@/features/auth/types/auth.types";

type Mode = "totp" | "backup" | "sms";

const Login2faPage = () => {
  const navigate = useNavigate();
  // đọc challengeToken 1 lần khi mount (lazy init — tránh set-state-in-effect)
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
    // không có challenge → quay lại login
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
          toast.success(res.data.message ?? "Đã gửi OTP qua SMS");
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
        // backup code path không trust device (BE bỏ qua) → chỉ gửi khi totp/sms
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
    ? "Nhập một backup code (xxxx-xxxx)."
    : isSms
      ? maskedPhone
        ? `Nhập mã 6 số đã gửi tới ${maskedPhone}.`
        : "Bấm gửi để nhận OTP qua SMS."
      : "Nhập mã 6 số từ ứng dụng Authenticator.";

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Xác thực 2 lớp
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
            {maskedPhone ? "Gửi lại OTP qua SMS" : "Gửi OTP qua SMS"}
          </Button>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="code">
            {isBackup ? "Backup code" : isSms ? "Mã OTP (SMS)" : "Mã TOTP"}
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
                Tin tưởng thiết bị này (bỏ qua 2FA trong 30 ngày)
              </Label>
            </div>
            {trustDevice && (
              <Input
                placeholder="Tên thiết bị (vd: MacBook nhà) — tùy chọn"
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
          Xác thực
        </Button>

        <div className="flex flex-col gap-1.5 text-center text-sm text-slate-500">
          {!isBackup && (
            <button
              type="button"
              className="hover:text-emerald-600"
              onClick={() => switchMode("backup")}
            >
              Dùng backup code thay thế
            </button>
          )}
          {!isSms && (
            <button
              type="button"
              className="hover:text-emerald-600"
              onClick={() => switchMode("sms")}
            >
              Mất Authenticator? Nhận OTP qua SMS
            </button>
          )}
          {mode !== "totp" && (
            <button
              type="button"
              className="hover:text-emerald-600"
              onClick={() => switchMode("totp")}
            >
              Dùng mã TOTP từ Authenticator
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login2faPage;
