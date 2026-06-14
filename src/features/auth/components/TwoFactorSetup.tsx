import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInitTwoFactor } from "@/features/auth/hooks/useInitTwoFactor";
import { useConfirmTwoFactor } from "@/features/auth/hooks/useConfirmTwoFactor";
import { useDisableTwoFactor } from "@/features/auth/hooks/useDisableTwoFactor";
import { useRegenerateBackupCodes } from "@/features/auth/hooks/useRegenerateBackupCodes";
import { handleErrorApi } from "@/shared/lib/errors";
import type { Init2faResponseData } from "@/features/auth/types/account.types";

interface TwoFactorSetupProps {
  isEnabled: boolean;
}

const BackupCodesList = ({ codes }: { codes: string[] }) => (
  <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-3 font-mono text-sm">
    {codes.map((c) => (
      <span key={c}>{c}</span>
    ))}
  </div>
);

const TwoFactorSetup = ({ isEnabled }: TwoFactorSetupProps) => {
  // enroll wizard state
  const [initData, setInitData] = useState<Init2faResponseData | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // disable form state
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableTotp, setDisableTotp] = useState("");

  // regenerate state
  const [showRegen, setShowRegen] = useState(false);
  const [regenTotp, setRegenTotp] = useState("");

  const { mutate: initTwoFa, isPending: isIniting } = useInitTwoFactor();
  const { mutate: confirmTwoFa, isPending: isConfirming } =
    useConfirmTwoFactor();
  const { mutate: disableTwoFa, isPending: isDisabling } =
    useDisableTwoFactor();
  const { mutate: regenCodes, isPending: isRegen } = useRegenerateBackupCodes();

  const resetEnroll = () => {
    setInitData(null);
    setConfirmCode("");
  };

  const handleInit = () => {
    initTwoFa(undefined, {
      onSuccess: (res) => {
        if (res.data.data) setInitData(res.data.data);
        else toast.error(res.data.message ?? "Không thể khởi tạo 2FA");
      },
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const handleConfirm = () => {
    if (!initData) return;
    confirmTwoFa(
      { pendingToken: initData.pendingToken, code: confirmCode },
      {
        onSuccess: (res) => {
          const data = res.data.data;
          if (data?.enabled) {
            resetEnroll();
            setBackupCodes(data.backupCodes);
            toast.success("Đã bật 2FA. Lưu lại backup codes ngay.");
          } else {
            toast.error(res.data.message ?? "Mã không đúng");
          }
        },
        onError: (error) => handleErrorApi({ error }),
      },
    );
  };

  const handleDisable = () => {
    disableTwoFa(
      { password: disablePassword, totpCode: disableTotp },
      {
        onSuccess: () => {
          toast.success("Đã tắt xác thực 2 lớp");
          setShowDisable(false);
          setDisablePassword("");
          setDisableTotp("");
        },
        onError: (error) => handleErrorApi({ error }),
      },
    );
  };

  const handleRegen = () => {
    regenCodes(
      { totpCode: regenTotp },
      {
        onSuccess: (res) => {
          const data = res.data.data;
          if (data) {
            setShowRegen(false);
            setRegenTotp("");
            setBackupCodes(data.backupCodes);
            toast.success("Đã sinh backup codes mới. Codes cũ vô hiệu hóa.");
          } else {
            toast.error(res.data.message ?? "Mã không đúng");
          }
        },
        onError: (error) => handleErrorApi({ error }),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xác thực 2 lớp (2FA)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isEnabled ? "Xác thực 2 lớp đang bật." : "Chưa bật xác thực 2 lớp."}
        </p>

        {!isEnabled ? (
          <Button onClick={handleInit} disabled={isIniting}>
            {isIniting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bật 2FA
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRegen(true)}>
              Sinh lại backup codes
            </Button>
            <Button variant="destructive" onClick={() => setShowDisable(true)}>
              Tắt 2FA
            </Button>
          </div>
        )}

        {/* Enroll wizard — QR + nhập TOTP */}
        <Dialog
          open={!!initData}
          onOpenChange={(open) => !open && resetEnroll()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quét QR rồi nhập mã 6 số</DialogTitle>
            </DialogHeader>
            {initData && (
              <div className="flex flex-col items-center gap-4">
                <QRCodeSVG value={initData.otpAuthUri} size={200} />
                <p className="text-xs text-muted-foreground break-all">
                  Secret: {initData.secret}
                </p>
                <div className="w-full space-y-1.5">
                  <Label htmlFor="confirm-code">Mã TOTP</Label>
                  <Input
                    id="confirm-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={confirmCode}
                    onChange={(e) =>
                      setConfirmCode(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={isConfirming || confirmCode.length !== 6}
                >
                  {isConfirming && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Xác nhận bật 2FA
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Backup codes — hiển thị 1 lần (sau confirm hoặc regenerate) */}
        <Dialog
          open={!!backupCodes}
          onOpenChange={(open) => !open && setBackupCodes(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Backup codes</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-destructive font-medium">
              ⚠️ Lưu/in 8 mã này ngay — chỉ hiển thị 1 lần.
            </p>
            {backupCodes && <BackupCodesList codes={backupCodes} />}
            <div className="flex justify-end">
              <Button onClick={() => setBackupCodes(null)}>Tôi đã lưu</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disable — password + TOTP */}
        <Dialog open={showDisable} onOpenChange={setShowDisable}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tắt xác thực 2 lớp?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="disable-pw">Mật khẩu hiện tại</Label>
                <Input
                  id="disable-pw"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="disable-totp">Mã TOTP</Label>
                <Input
                  id="disable-totp"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableTotp}
                  onChange={(e) =>
                    setDisableTotp(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDisable(false)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={
                  isDisabling || !disablePassword || disableTotp.length !== 6
                }
              >
                {isDisabling && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xác nhận tắt
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Regenerate backup codes — TOTP */}
        <Dialog open={showRegen} onOpenChange={setShowRegen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sinh lại backup codes</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Codes cũ sẽ bị vô hiệu hóa. Nhập mã TOTP để xác nhận.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="regen-totp">Mã TOTP</Label>
              <Input
                id="regen-totp"
                inputMode="numeric"
                maxLength={6}
                value={regenTotp}
                onChange={(e) =>
                  setRegenTotp(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRegen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleRegen}
                disabled={isRegen || regenTotp.length !== 6}
              >
                {isRegen && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sinh codes mới
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
