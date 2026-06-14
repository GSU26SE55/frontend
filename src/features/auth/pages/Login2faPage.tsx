import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVerify2faLogin } from "@/features/auth/hooks/useVerify2faLogin";
import { handleErrorApi } from "@/shared/lib/errors";
import { CHALLENGE_TOKEN_KEY } from "@/features/auth/types/auth.types";

const Login2faPage = () => {
  const navigate = useNavigate();
  // đọc challengeToken 1 lần khi mount (lazy init — tránh set-state-in-effect)
  const [challengeToken] = useState<string | null>(() =>
    sessionStorage.getItem(CHALLENGE_TOKEN_KEY),
  );
  const [code, setCode] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);

  const { mutateAsync, isPending } = useVerify2faLogin();

  useEffect(() => {
    // không có challenge → quay lại login
    if (!challengeToken) navigate("/login", { replace: true });
  }, [challengeToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    try {
      await mutateAsync({ challengeToken, code, isBackupCode });
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  if (!challengeToken) return null;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Xác thực 2 lớp
        </h1>
        <p className="text-sm text-slate-500">
          {isBackupCode
            ? "Nhập một backup code (xxxx-xxxx)."
            : "Nhập mã 6 số từ ứng dụng Authenticator."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">
            {isBackupCode ? "Backup code" : "Mã TOTP"}
          </Label>
          <Input
            id="code"
            autoFocus
            inputMode={isBackupCode ? "text" : "numeric"}
            placeholder={isBackupCode ? "abcd-2345" : "123456"}
            value={code}
            onChange={(e) =>
              setCode(
                isBackupCode
                  ? e.target.value
                  : e.target.value.replace(/\D/g, "").slice(0, 6),
              )
            }
          />
        </div>

        <Button
          type="submit"
          disabled={isPending || code.length === 0}
          className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
        >
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Xác thực
        </Button>

        <button
          type="button"
          className="w-full text-center text-sm text-slate-500 hover:text-emerald-600"
          onClick={() => {
            setIsBackupCode((v) => !v);
            setCode("");
          }}
        >
          {isBackupCode
            ? "Dùng mã TOTP từ Authenticator"
            : "Dùng backup code thay thế"}
        </button>
      </form>
    </div>
  );
};

export default Login2faPage;
