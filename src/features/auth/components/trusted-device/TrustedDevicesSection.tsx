import { useState } from "react";
import { Loader2, Trash2, MonitorSmartphone } from "lucide-react";
import { formatDateTime } from "@/shared/utils/datetime";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useTrustedDevices } from "@/features/auth/hooks/trusted-device/useTrustedDevices";
import { useRevokeTrustedDevice } from "@/features/auth/hooks/trusted-device/useRevokeTrustedDevice";
import { useRevokeAllTrustedDevices } from "@/features/auth/hooks/trusted-device/useRevokeAllTrustedDevices";
import { handleErrorApi } from "@/shared/lib/errors";
import { plural } from "@/shared/utils/plural";
import type { TrustedDeviceDto } from "@/features/auth/types/trusted-device/trusted-device.types";

const fmt = (iso?: string | null) => (iso ? formatDateTime(iso) : "—");

// #AUTH-48: manage trusted devices — list + revoke one / revoke all
const TrustedDevicesSection = () => {
  const { data, isLoading, isError } = useTrustedDevices();
  const { mutate: revokeOne, isPending: isRevoking } = useRevokeTrustedDevice();
  const { mutate: revokeAll, isPending: isRevokingAll } =
    useRevokeAllTrustedDevices();

  const [confirmAll, setConfirmAll] = useState(false);

  const devices: TrustedDeviceDto[] = data ?? [];

  const handleRevokeOne = (id: string) => {
    revokeOne(id, {
      onSuccess: (res) => toast.success(res.data.message ?? "Device revoked"),
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const handleRevokeAll = () => {
    revokeAll(undefined, {
      onSuccess: (res) => {
        toast.success(res.data.message ?? "All devices revoked");
        setConfirmAll(false);
      },
      onError: (error) => handleErrorApi({ error }),
    });
  };

  if (isLoading) {
    return (
      <ul className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="size-8 shrink-0 rounded-md" />
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load trusted devices list.
      </p>
    );
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No trusted devices yet. Check &quot;Trust this device&quot; during 2FA
        login to add one.
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
                    <Badge variant="secondary" className="text-3xs">
                      This device
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  IP {d.ipPrefix} · trusted {fmt(d.trustedAt)} · expires{" "}
                  {fmt(d.expiresAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last used {fmt(d.lastUsedAt)} ·{" "}
                  {plural(d.usageCount, "time", "times")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-destructive hover:text-destructive"
              disabled={isRevoking}
              onClick={() => handleRevokeOne(d.id)}
              /* Icon-only — without a name a screen reader announces just "button", and the
                 list renders one per device so the label has to say WHICH one it revokes. */
              aria-label={`Revoke trusted device ${d.label}`}
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
        Revoke all
      </Button>

      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all trusted devices?</AlertDialogTitle>
            <AlertDialogDescription>
              All devices will need to re-verify 2FA on their next login.
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
              Revoke all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrustedDevicesSection;
