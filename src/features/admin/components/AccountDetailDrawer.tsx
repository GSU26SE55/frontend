import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useAdminAccountSessions,
  useAdminRevokeAllSessions,
  useAdminAccountLoginHistory,
} from "@/features/admin/hooks/useAdminAccounts";
import { RefreshTokenStatus } from "@/shared/types/account.types";
import { LoginAttemptResult } from "@/features/admin/enums/audit.enum";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account.types";
import type {
  SessionDto,
  LoginAttemptDto,
} from "@/features/admin/types/admin.types";

interface Props {
  open: boolean;
  onClose: () => void;
  account: AccountDto;
}

const SESSION_STATUS_MAP: Record<number, { label: string; cls: string }> = {
  [RefreshTokenStatus.Active]: {
    label: "Đang hoạt động",
    cls: "text-emerald-600",
  },
  [RefreshTokenStatus.Used]: { label: "Đã dùng", cls: "text-gray-500" },
  [RefreshTokenStatus.Revoked]: { label: "Đã thu hồi", cls: "text-red-500" },
  [RefreshTokenStatus.Expired]: { label: "Hết hạn", cls: "text-gray-400" },
  [RefreshTokenStatus.Compromised]: { label: "Xâm phạm", cls: "text-red-700" },
};

const LOGIN_RESULT_OK = [LoginAttemptResult.Success];

export default function AccountDetailDrawer({ open, onClose, account }: Props) {
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const { data: sessionsData, isLoading: loadingSessions } =
    useAdminAccountSessions(account.id, {});
  const { data: historyData, isLoading: loadingHistory } =
    useAdminAccountLoginHistory(account.id, { pageSize: 50 });
  const { mutate: revokeAll, isPending: isRevoking } =
    useAdminRevokeAllSessions();

  const sessions: SessionDto[] = Array.isArray(sessionsData)
    ? sessionsData
    : (((sessionsData as unknown as { items?: unknown[] })?.items ??
        []) as SessionDto[]);
  const history: LoginAttemptDto[] = Array.isArray(historyData)
    ? historyData
    : (((historyData as unknown as { items?: unknown[] })?.items ??
        []) as LoginAttemptDto[]);
  const activeSessions = sessions.filter(
    (s) => s.status === RefreshTokenStatus.Active,
  );

  const handleRevokeAll = () => {
    revokeAll(
      { id: account.id, payload: { reason: "Admin force logout" } },
      {
        onSuccess: () => {
          toast.success("Đã thu hồi tất cả session");
          setConfirmRevokeAll(false);
        },
        onError: (err) => {
          handleErrorApi({ error: err });
          setConfirmRevokeAll(false);
        },
      },
    );
  };

  const fmt = (dt: string) =>
    format(new Date(dt), "dd/MM/yyyy HH:mm", { locale: vi });

  return (
    <>
      <Sheet open={open} onOpenChange={(v: boolean) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-base">
              Sessions & Lịch sử —{" "}
              <span className="text-muted-foreground font-normal">
                {account.fullName}
              </span>
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {account.email}
            </p>
          </SheetHeader>

          <Tabs
            defaultValue="sessions"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="mx-6 mt-4 self-start">
              <TabsTrigger value="sessions">
                Sessions{" "}
                {activeSessions.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5">
                    {activeSessions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">Lịch sử đăng nhập</TabsTrigger>
            </TabsList>

            {/* ── Sessions tab ── */}
            <TabsContent
              value="sessions"
              className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-3"
            >
              {activeSessions.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setConfirmRevokeAll(true)}
                    disabled={isRevoking}
                  >
                    {isRevoking ? (
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                    ) : (
                      <LogOut className="mr-1.5 size-3" />
                    )}
                    Thu hồi tất cả
                  </Button>
                </div>
              )}
              {loadingSessions ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Không có session nào.
                </p>
              ) : (
                sessions.map((s) => {
                  const st = SESSION_STATUS_MAP[s.status] ?? {
                    label: String(s.status),
                    cls: "text-gray-500",
                  };
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border border-border bg-card p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                        {s.isCurrent && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                            Phiên hiện tại
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground space-y-0.5">
                        {s.ipAddress && <div>IP: {s.ipAddress}</div>}
                        {s.userAgent && (
                          <div className="truncate max-w-xs">
                            UA: {s.userAgent}
                          </div>
                        )}
                        <div>
                          Cấp: {fmt(s.issuedAt)} — Hết hạn: {fmt(s.expiredAt)}
                        </div>
                        {s.revokedAt && (
                          <div>
                            Thu hồi: {fmt(s.revokedAt)}
                            {s.revokedReason ? ` — ${s.revokedReason}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* ── History tab ── */}
            <TabsContent
              value="history"
              className="flex-1 overflow-y-auto px-6 pb-6 mt-4"
            >
              {loadingHistory ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Không có lịch sử đăng nhập.
                </p>
              ) : (
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left text-[10.5px] text-muted-foreground uppercase tracking-wider">
                      <th className="py-2 pr-3">STT</th>
                      <th className="py-2 pr-3">Kết quả</th>
                      <th className="py-2 pr-3">IP</th>
                      <th className="py-2 pr-3">Phương thức</th>
                      <th className="py-2">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, index) => {
                      const ok = LOGIN_RESULT_OK.includes(
                        h.result as typeof LoginAttemptResult.Success,
                      );
                      return (
                        <tr
                          key={h.id}
                          className="border-b border-border/60 hover:bg-muted/20"
                        >
                          <td className="py-2 pr-3 text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-2 pr-3">
                            <span
                              className={`font-medium ${ok ? "text-emerald-600" : "text-red-500"}`}
                            >
                              {h.resultName}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">
                            {h.ipAddress ?? "—"}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">
                            {h.method}
                          </td>
                          <td className="py-2 text-muted-foreground whitespace-nowrap">
                            {fmt(h.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <Dialog
        open={confirmRevokeAll}
        onOpenChange={(v: boolean) => setConfirmRevokeAll(v)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Thu hồi tất cả session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tất cả session của <strong>{account.fullName}</strong> sẽ bị thu hồi
            ngay lập tức. Người dùng sẽ bị đăng xuất khỏi tất cả thiết bị.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRevokeAll(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAll}
              disabled={isRevoking}
            >
              {isRevoking && <Loader2 className="mr-2 size-4 animate-spin" />}
              Thu hồi tất cả
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
