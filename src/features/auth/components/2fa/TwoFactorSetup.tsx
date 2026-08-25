import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
import { useInitTwoFactor } from "@/features/auth/hooks/2fa/useInitTwoFactor";
import { useConfirmTwoFactor } from "@/features/auth/hooks/2fa/useConfirmTwoFactor";
import { useDisableTwoFactor } from "@/features/auth/hooks/2fa/useDisableTwoFactor";
import { useRegenerateBackupCodes } from "@/features/auth/hooks/2fa/useRegenerateBackupCodes";
import { useRequestCrossDevice2fa } from "@/features/auth/hooks/2fa/useRequestCrossDevice2fa";
import { handleErrorApi } from "@/shared/lib/errors";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  Init2faResponseData,
  CrossDeviceRequestResponseData,
} from "@/features/auth/types/account.types";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";
import { DUR, EASE_OUT } from "@/shared/motion/tokens";

interface TwoFactorSetupProps {
  isEnabled: boolean;
  bare?: boolean;
}

const BackupCodesList = ({ codes }: { codes: string[] }) => (
  <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-3 font-mono text-sm">
    {codes.map((c) => (
      <span key={c}>{c}</span>
    ))}
  </div>
);

const TwoFactorSetup = ({ isEnabled, bare }: TwoFactorSetupProps) => {
  const reducedMotion = useReducedMotion();
  const queryClient = useQueryClient();

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

  // #AUTH-51: cross-device setup (Device A) state
  const [crossData, setCrossData] =
    useState<CrossDeviceRequestResponseData | null>(null);
  const [crossRemaining, setCrossRemaining] = useState(0);

  const { mutate: initTwoFa, isPending: isIniting } = useInitTwoFactor();
  const { mutate: confirmTwoFa, isPending: isConfirming } =
    useConfirmTwoFactor();
  const { mutate: disableTwoFa, isPending: isDisabling } =
    useDisableTwoFactor();
  const { mutate: regenCodes, isPending: isRegen } = useRegenerateBackupCodes();
  const { mutate: requestCross, isPending: isRequestingCross } =
    useRequestCrossDevice2fa();

  // countdown TTL of the confirm token
  useEffect(() => {
    if (!crossData || crossRemaining <= 0) return;
    const t = setInterval(() => setCrossRemaining((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [crossData, crossRemaining]);

  const handleRequestCross = () => {
    requestCross(undefined, {
      onSuccess: (res) => {
        const data = res.data.data;
        if (data) {
          setCrossData(data);
          setCrossRemaining(data.expiresInSeconds);
        } else {
          toast.error(res.data.message ?? "Could not create request");
        }
      },
      onError: (error) => handleErrorApi({ error }),
    });
  };

  // Device A manual refresh — reload 2FA status after Device B confirms
  const handleRefreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    queryClient.invalidateQueries({ queryKey: [KEY.currentUser] });
    toast.info(AUTH_MESSAGES.twoFactor.refreshing);
  };

  const resetEnroll = () => {
    setInitData(null);
    setConfirmCode("");
  };

  const handleInit = () => {
    initTwoFa(undefined, {
      onSuccess: (res) => {
        if (res.data.data) setInitData(res.data.data);
        else toast.error(res.data.message ?? "Could not initialize 2FA");
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
            toast.success(AUTH_MESSAGES.twoFactor.enabled);
            queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
          } else {
            toast.error(res.data.message ?? "Incorrect code");
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
          toast.success(AUTH_MESSAGES.twoFactor.disabled);
          setShowDisable(false);
          setDisablePassword("");
          setDisableTotp("");
          queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
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
            toast.success(AUTH_MESSAGES.twoFactor.backupRegenerated);
          } else {
            toast.error(res.data.message ?? "Incorrect code");
          }
        },
        onError: (error) => handleErrorApi({ error }),
      },
    );
  };

  const actionRow = (
    <div className="flex items-center gap-2">
      {!isEnabled ? (
        <div className="flex gap-2">
          <Button onClick={handleInit} disabled={isIniting} size="sm">
            {isIniting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enable 2FA
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestCross}
            disabled={isRequestingCross}
          >
            {isRequestingCross && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Use another device
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRegen(true)}
          >
            Backup codes
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDisable(true)}
          >
            Disable 2FA
          </Button>
        </div>
      )}
    </div>
  );

  const dialogs = (
    <>
      {/* Enroll wizard — scan QR then enter TOTP */}
      <Dialog open={!!initData} onOpenChange={(open) => !open && resetEnroll()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Scan the QR code, then enter the 6-digit code
            </DialogTitle>
          </DialogHeader>
          {initData && (
            <div className="flex flex-col items-center gap-4">
              {/* Setting up 2FA happens once. The code scaling in from 0.96 marks it
                  as a moment rather than having it blink into existence. */}
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: DUR.enter, ease: EASE_OUT },
                }}
              >
                <QRCodeSVG value={initData.otpAuthUri} size={200} />
              </motion.div>
              <p className="text-xs text-muted-foreground break-all">
                Secret: {initData.secret}
              </p>
              <div className="w-full space-y-1.5">
                <Label htmlFor="confirm-code">TOTP code</Label>
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
                Confirm enable 2FA
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Backup codes — shown once (after confirm or regenerate) */}
      <Dialog
        open={!!backupCodes}
        onOpenChange={(open) => !open && setBackupCodes(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup codes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-destructive font-medium">
            ⚠️ Save/print these 8 codes now — they are shown only once.
          </p>
          {backupCodes && <BackupCodesList codes={backupCodes} />}
          <div className="flex justify-end">
            <Button onClick={() => setBackupCodes(null)}>I saved them</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable — password + TOTP */}
      <Dialog open={showDisable} onOpenChange={setShowDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="disable-pw">Current password</Label>
              <Input
                id="disable-pw"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disable-totp">TOTP code</Label>
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={
                isDisabling || !disablePassword || disableTotp.length !== 6
              }
            >
              {isDisabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm disable
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate backup codes — TOTP */}
      <Dialog open={showRegen} onOpenChange={setShowRegen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate backup codes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Old codes will be invalidated. Enter the TOTP code to confirm.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="regen-totp">TOTP code</Label>
            <Input
              id="regen-totp"
              inputMode="numeric"
              maxLength={6}
              value={regenTotp}
              onChange={(e) => setRegenTotp(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowRegen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRegen}
              disabled={isRegen || regenTotp.length !== 6}
            >
              {isRegen && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate new codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* #AUTH-51: Cross-device setup (Device A) — QR + secret + countdown + manual refresh */}
      <Dialog
        open={!!crossData}
        onOpenChange={(open) => !open && setCrossData(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up 2FA using another device</DialogTitle>
          </DialogHeader>
          {crossData && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Scan the QR code with an Authenticator app on your phone, or
                open the confirmation link just sent to your email to finish on
                the second device.
              </p>
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: DUR.enter, ease: EASE_OUT },
                }}
              >
                <QRCodeSVG value={crossData.otpAuthUri} size={200} />
              </motion.div>
              <p className="text-xs text-muted-foreground break-all">
                Secret: {crossData.secret}
              </p>
              <p className="text-xs font-medium">
                {crossRemaining > 0
                  ? `Link expires in ${Math.floor(crossRemaining / 60)}:${String(
                      crossRemaining % 60,
                    ).padStart(2, "0")}`
                  : "Link expired — please generate a new one."}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRefreshStatus}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                I've confirmed — Refresh status
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  if (bare) {
    return (
      <>
        {actionRow}
        {dialogs}
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication (2FA)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isEnabled
            ? "Two-factor authentication is enabled."
            : "Two-factor authentication is not enabled."}
        </p>
        {!isEnabled ? (
          <div className="flex gap-2">
            <Button onClick={handleInit} disabled={isIniting}>
              {isIniting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable 2FA
            </Button>
            <Button
              variant="outline"
              onClick={handleRequestCross}
              disabled={isRequestingCross}
            >
              {isRequestingCross && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Use another device
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRegen(true)}>
              Regenerate backup codes
            </Button>
            <Button variant="destructive" onClick={() => setShowDisable(true)}>
              Disable 2FA
            </Button>
          </div>
        )}
        {dialogs}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
