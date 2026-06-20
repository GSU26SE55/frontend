import { useState } from "react";
import { Loader2, Trash2, MonitorSmartphone } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useTrustedDevices } from "@/features/auth/hooks/useTrustedDevices";
import { useRevokeTrustedDevice } from "@/features/auth/hooks/useRevokeTrustedDevice";
import { useRevokeAllTrustedDevices } from "@/features/auth/hooks/useRevokeAllTrustedDevices";
import { handleErrorApi } from "@/shared/lib/errors";
import type { TrustedDeviceDto } from "@/features/auth/types/trusted-device.types";

const fmt = (iso?: string | null) =>
  iso ? format(new Date(iso), "dd/MM/yyyy HH:mm") : "—";

// #AUTH-48: quản lý thiết bị tin cậy — list + revoke 1 / revoke all
const TrustedDevicesSection = () => {
  const { data, isLoading, isError } = useTrustedDevices();
  const { mutate: revokeOne, isPending: isRevoking } = useRevokeTrustedDevice();
  const { mutate: revokeAll, isPending: isRevokingAll } =
    useRevokeAllTrustedDevices();

  const [confirmAll, setConfirmAll] = useState(false);

  const devices: TrustedDeviceDto[] = data ?? [];

  const handleRevokeOne = (id: string) => {
    revokeOne(id, {
      onSuccess: (res) =>
        toast.success(res.data.message ?? "Đã thu hồi thiết bị"),
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const handleRevokeAll = () => {
    revokeAll(undefined, {
      onSuccess: (res) => {
        toast.success(res.data.message ?? "Đã thu hồi toàn bộ thiết bị");
        setConfirmAll(false);
      },
      onError: (error) => handleErrorApi({ error }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tải thiết bị...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Không tải được danh sách thiết bị tin cậy.
      </p>
    );
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có thiết bị tin cậy nào. Tick &quot;Tin tưởng thiết bị này&quot;
        khi đăng nhập 2FA để thêm.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {devices.map((d) => (
          <li
            key={d.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{d.label}</p>
                  {d.isCurrentDevice && (
                    <Badge variant="secondary" className="text-[10px]">
                      Thiết bị này
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  IP {d.ipPrefix} · tin tưởng {fmt(d.trustedAt)} · hết hạn{" "}
                  {fmt(d.expiresAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lần cuối dùng {fmt(d.lastUsedAt)} · {d.usageCount} lần
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-destructive hover:text-destructive"
              disabled={isRevoking}
              onClick={() => handleRevokeOne(d.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirmAll(true)}
      >
        Thu hồi tất cả
      </Button>

      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Thu hồi tất cả thiết bị tin cậy?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tất cả thiết bị sẽ phải xác thực 2FA lại ở lần đăng nhập tới.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAll(false)} />
            <AlertDialogAction
              variant="destructive"
              onClick={handleRevokeAll}
              disabled={isRevokingAll}
            >
              {isRevokingAll && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Thu hồi tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrustedDevicesSection;
