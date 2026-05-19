import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEnableTwoFactor } from '@/features/auth/hooks/useEnableTwoFactor';
import { useDisableTwoFactor } from '@/features/auth/hooks/useDisableTwoFactor';
import { handleErrorApi } from '@/shared/lib/errors';
import type { EnableTwoFactorResponseData } from '@/features/auth/types/account.types';

interface TwoFactorSetupProps {
  isEnabled: boolean;
}

const TwoFactorSetup = ({ isEnabled }: TwoFactorSetupProps) => {
  const [qrData, setQrData] = useState<EnableTwoFactorResponseData | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const { mutate: enableTwoFa, isPending: isEnabling } = useEnableTwoFactor();
  const { mutate: disableTwoFa, isPending: isDisabling } = useDisableTwoFactor();

  const handleEnable = () => {
    enableTwoFa(undefined, {
      onSuccess: (res) => {
        const data = res.data.data;
        if (data) setQrData(data);
      },
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const handleDisable = () => {
    disableTwoFa(undefined, {
      onSuccess: () => {
        toast.success('Đã tắt xác thực 2 lớp');
        setShowDisableConfirm(false);
      },
      onError: (error) => handleErrorApi({ error }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xác thực 2 lớp (2FA)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isEnabled ? 'Xác thực 2 lớp đang bật.' : 'Chưa bật xác thực 2 lớp.'}
        </p>

        {!isEnabled ? (
          <Button onClick={handleEnable} disabled={isEnabling}>
            {isEnabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bật 2FA
          </Button>
        ) : (
          <Button variant="destructive" onClick={() => setShowDisableConfirm(true)}>
            Tắt 2FA
          </Button>
        )}

        {/* QR code modal after enable */}
        <Dialog open={!!qrData} onOpenChange={() => setQrData(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quét QR code</DialogTitle>
            </DialogHeader>
            {qrData && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Lưu secret ngay — không thể xem lại
                </p>
                <QRCodeSVG value={qrData.otpAuthUri} size={200} />
                <p className="text-xs text-muted-foreground break-all">Secret: {qrData.secret}</p>
                <Button onClick={() => setQrData(null)}>Đã lưu</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Disable confirm dialog */}
        <Dialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tắt xác thực 2 lớp?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Tài khoản của bạn sẽ kém bảo mật hơn.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDisableConfirm(false)}>Hủy</Button>
              <Button variant="destructive" onClick={handleDisable} disabled={isDisabling}>
                {isDisabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận tắt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
