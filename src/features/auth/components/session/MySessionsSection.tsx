import { useState } from "react";
import { Loader2, LogOut, MonitorSmartphone } from "lucide-react";
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
import { useMySessions } from "@/features/auth/hooks/session/useMySessions";
import { useRevokeSession } from "@/features/auth/hooks/session/useRevokeSession";
import { useRevokeAllSessions } from "@/features/auth/hooks/session/useRevokeAllSessions";
import { handleErrorApi } from "@/shared/lib/errors";
import { describeUserAgent } from "@/shared/utils/userAgent";
import { plural } from "@/shared/utils/plural";
import type { SessionDto } from "@/shared/types/account/session.types";

const fmt = (iso?: string | null) =>
  iso ? format(new Date(iso), "dd/MM/yyyy HH:mm") : "—";

/**
 * "Where you're signed in" — the current user's own active sessions, with remote sign-out.
 *
 * Until this existed only an Admin could revoke someone else's sessions, so a user who
 * suspected their account was compromised had no way to end the intruder's access: changing
 * the password leaves the existing refresh tokens valid for their remaining 7 days.
 */
const MySessionsSection = () => {
  const { data, isLoading, isError } = useMySessions();
  const { mutate: revokeOne, isPending: isRevoking } = useRevokeSession();
  const { mutate: revokeAll, isPending: isRevokingAll } =
    useRevokeAllSessions();

  const [confirmAll, setConfirmAll] = useState(false);

  const sessions: SessionDto[] = data ?? [];
  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  const handleRevokeOne = (id: string) => {
    revokeOne(id, {
      onSuccess: () => toast.success("Device signed out"),
      onError: (error) => handleErrorApi({ error }),
    });
  };

  const handleRevokeAll = () => {
    revokeAll(undefined, {
      onSuccess: (res) => {
        // The BE returns how many sessions it actually revoked.
        const count = res.data.data ?? otherCount;
        toast.success(
          `Signed out of ${plural(count, "other device", "other devices")}`,
        );
        setConfirmAll(false);
      },
      onError: (error) => {
        handleErrorApi({ error });
        setConfirmAll(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading sessions...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load your sessions.</p>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No active sessions found.</p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">
                    {describeUserAgent(s.userAgent)}
                  </p>
                  {s.isCurrent && (
                    <Badge variant="secondary" className="text-3xs">
                      This device
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Signed in {fmt(s.issuedAt)} · expires {fmt(s.expiredAt)}
                </p>
                {/* IP is shown last and unlabelled-as-location on purpose: every row currently
                    reports the cluster's internal address, so it cannot identify a device
                    until the BE forwards the real client IP. */}
                {s.ipAddress && (
                  <p className="text-xs text-muted-foreground">
                    IP {s.ipAddress}
                  </p>
                )}
              </div>
            </div>
            {/* The current session has no sign-out button — use the normal Log out control,
                which also clears the cookies on this device. */}
            {!s.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive hover:text-destructive"
                disabled={isRevoking}
                onClick={() => handleRevokeOne(s.id)}
                aria-label={`Sign out ${describeUserAgent(s.userAgent)}`}
              >
                <LogOut className="size-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {otherCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmAll(true)}
        >
          Sign out other devices
        </Button>
      )}

      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              {plural(otherCount, "device", "devices")} will be signed out and
              need to log in again. This device stays signed in.
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
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MySessionsSection;
