import { useState } from "react";
import {
  ScrollText,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Monitor,
  Globe,
  Fingerprint,
  Clock,
  Hash,
  User,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useAdminAuditLogs } from "@/features/admin/hooks/useAdminAuditLogs";
import DataPagination from "@/shared/components/common/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import type { AuditLogDto } from "@/features/admin/types/admin.types";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

// ── Metadata ──────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  LoginSuccess: "Đăng nhập",
  LoginFailedWrongPassword: "Sai mật khẩu",
  LoginFailedAccountLocked: "Tài khoản bị khóa",
  LoginFailedAccountSuspended: "Tài khoản bị suspend",
  LoginFailedAccountBanned: "Tài khoản bị ban",
  LoginFailedAccountInactive: "Tài khoản inactive",
  LoginFailedNotVerified: "Chưa xác thực email",
  AccountAutoLocked: "Khóa tự động",
  Logout: "Đăng xuất",
  GoogleLoginSuccess: "Google đăng nhập",
  GoogleLoginFailed: "Google đăng nhập thất bại",
  TokenRefreshed: "Làm mới token",
  TokenReuseDetected: "Token bất thường",
  PasswordChanged: "Đổi mật khẩu",
  PasswordReset: "Reset mật khẩu",
  OtpVerifySuccess: "Xác thực OTP",
  OtpVerifyFailed: "Xác thực OTP thất bại",
  TwoFactorEnabled: "Bật 2FA",
  TwoFactorDisabled: "Tắt 2FA",
  TwoFactorReset: "Reset 2FA",
  BackupCodeRedeemed: "Dùng backup code",
  BackupCodesRegenerated: "Tạo lại backup code",
  Admin2faReset: "Admin reset 2FA",
  LoginWith2fa: "Đăng nhập với 2FA",
  LoginPending2fa: "Chờ xác thực 2FA",
  GoogleLinked: "Liên kết Google",
  GoogleUnlinked: "Hủy liên kết Google",
  AccountRegistered: "Đăng ký tài khoản",
  AccountCreatedByAdmin: "Admin tạo tài khoản",
  AccountUpdated: "Cập nhật tài khoản",
  AccountStatusChanged: "Đổi trạng thái tài khoản",
  AccountUnlocked: "Mở khóa tài khoản",
  AccountDeactivated: "Vô hiệu hóa tài khoản",
  AccountDeleted: "Xóa tài khoản",
  AccountInviteSent: "Gửi lời mời",
  AccountInviteAccepted: "Chấp nhận lời mời",
  SessionRevoked: "Thu hồi session",
  AllSessionsRevoked: "Thu hồi tất cả session",
  AdminForceLogout: "Admin đăng xuất bắt buộc",
  SessionLimitExceededOldestRevoked: "Quá giới hạn session",
  RoleAssigned: "Gán role",
  RoleRevoked: "Xóa role",
  RoleTemporaryAssigned: "Gán role tạm thời",
  RoleCreated: "Tạo role",
  RoleUpdated: "Cập nhật role",
  RoleStatusChanged: "Đổi trạng thái role",
  RoleDeleted: "Xóa role",
  PermissionGranted: "Cấp quyền",
  PermissionRevoked: "Thu quyền",
};

type ActionCategory =
  | "auth"
  | "account"
  | "session"
  | "role"
  | "security"
  | "other";

const ACTION_CATEGORY: Record<string, ActionCategory> = {
  LoginSuccess: "auth",
  LoginFailedWrongPassword: "auth",
  LoginFailedAccountLocked: "auth",
  LoginFailedAccountSuspended: "auth",
  LoginFailedAccountBanned: "auth",
  LoginFailedAccountInactive: "auth",
  LoginFailedNotVerified: "auth",
  Logout: "auth",
  GoogleLoginSuccess: "auth",
  GoogleLoginFailed: "auth",
  LoginWith2fa: "auth",
  LoginPending2fa: "auth",
  TokenRefreshed: "security",
  TokenReuseDetected: "security",
  AccountAutoLocked: "security",
  TwoFactorEnabled: "security",
  TwoFactorDisabled: "security",
  TwoFactorReset: "security",
  BackupCodeRedeemed: "security",
  BackupCodesRegenerated: "security",
  Admin2faReset: "security",
  PasswordChanged: "security",
  PasswordReset: "security",
  OtpVerifySuccess: "security",
  OtpVerifyFailed: "security",
  GoogleLinked: "security",
  GoogleUnlinked: "security",
  AccountRegistered: "account",
  AccountCreatedByAdmin: "account",
  AccountUpdated: "account",
  AccountStatusChanged: "account",
  AccountUnlocked: "account",
  AccountDeactivated: "account",
  AccountDeleted: "account",
  AccountInviteSent: "account",
  AccountInviteAccepted: "account",
  SessionRevoked: "session",
  AllSessionsRevoked: "session",
  AdminForceLogout: "session",
  SessionLimitExceededOldestRevoked: "session",
  RoleAssigned: "role",
  RoleRevoked: "role",
  RoleTemporaryAssigned: "role",
  RoleCreated: "role",
  RoleUpdated: "role",
  RoleStatusChanged: "role",
  RoleDeleted: "role",
  PermissionGranted: "role",
  PermissionRevoked: "role",
};

const CATEGORY_STYLE: Record<ActionCategory, string> = {
  auth: "bg-blue-50 text-blue-700 border-blue-200",
  account: "bg-violet-50 text-violet-700 border-violet-200",
  session: "bg-amber-50 text-amber-700 border-amber-200",
  role: "bg-indigo-50 text-indigo-700 border-indigo-200",
  security: "bg-orange-50 text-orange-700 border-orange-200",
  other: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_LABEL: Record<ActionCategory, string> = {
  auth: "Auth",
  account: "Tài khoản",
  session: "Session",
  role: "Phân quyền",
  security: "Bảo mật",
  other: "Khác",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (dt: string) =>
  format(new Date(dt), "dd/MM/yyyy HH:mm:ss", { locale: vi });

const fmtFull = (dt: string) =>
  format(new Date(dt), "EEEE, dd/MM/yyyy 'lúc' HH:mm:ss", { locale: vi });

function parseMetadata(raw?: string): Record<string, string> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseUserAgent(ua?: string) {
  if (!ua) return null;
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Edg)[/\s]([\d.]+)/);
  const os = ua.match(/\(([^)]+)\)/);
  return {
    browser: browser
      ? `${browser[1].replace("Edg", "Edge")} ${browser[2].split(".")[0]}`
      : "Unknown",
    os: os ? os[1].split(";")[0].trim() : "Unknown",
    full: ua,
  };
}

// ── Detail Sheet ──────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 min-w-0">
      <div className="mt-0.5 shrink-0">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <div className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function AuditLogDetail({
  log,
  open,
  onClose,
}: {
  log: AuditLogDto;
  open: boolean;
  onClose: () => void;
}) {
  const category = ACTION_CATEGORY[log.actionName] ?? "other";
  const metadata = parseMetadata(log.metadataJson);
  const ua = parseUserAgent(log.userAgent);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="sm:max-w-130">
        {/* Header */}
        <DrawerHeader className="border-b border-border p-0">
          <div className="flex items-start gap-3 px-6 py-5">
            <div
              className={`mt-0.5 size-8 rounded-lg flex items-center justify-center border ${CATEGORY_STYLE[category]}`}
            >
              <ShieldAlert size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-base font-semibold leading-tight">
                {ACTION_LABELS[log.actionName] ?? log.actionName}
              </DrawerTitle>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {log.actionName} · #{log.action}
              </p>
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                log.isSuccess
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}
            >
              {log.isSuccess ? (
                <CheckCircle2 size={11} />
              ) : (
                <XCircle size={11} />
              )}
              {log.isSuccess ? "Thành công" : "Thất bại"}
            </span>
          </div>
        </DrawerHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Thông tin chung
            </h3>
            <div className="space-y-3">
              <DetailRow
                icon={Clock}
                label="Thời gian"
                value={fmtFull(log.createdAt)}
              />
              <DetailRow icon={Hash} label="Log ID" value={log.id} mono />
              {log.correlationId && (
                <DetailRow
                  icon={Hash}
                  label="Correlation ID"
                  value={log.correlationId}
                  mono
                />
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tài khoản
            </h3>
            <div className="space-y-3">
              {log.targetEmail && (
                <DetailRow
                  icon={User}
                  label="Tài khoản bị ảnh hưởng"
                  value={log.targetEmail}
                />
              )}
              {log.targetAccountId && (
                <DetailRow
                  icon={Hash}
                  label="Target Account ID"
                  value={log.targetAccountId}
                  mono
                />
              )}
              {log.actorAccountId && (
                <DetailRow
                  icon={User}
                  label="Thực hiện bởi (Actor ID)"
                  value={log.actorAccountId}
                  mono
                />
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Thiết bị & Mạng
            </h3>
            <div className="space-y-3">
              {log.ipAddress && (
                <DetailRow
                  icon={Globe}
                  label="Địa chỉ IP"
                  value={log.ipAddress}
                  mono
                />
              )}
              {log.deviceId && (
                <DetailRow
                  icon={Fingerprint}
                  label="Device ID"
                  value={log.deviceId}
                  mono
                />
              )}
              {ua && (
                <DetailRow
                  icon={Monitor}
                  label="Trình duyệt"
                  value={
                    <div className="space-y-1">
                      <p className="text-sm">
                        {ua.browser} · {ua.os}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono break-all leading-relaxed">
                        {ua.full}
                      </p>
                    </div>
                  }
                />
              )}
            </div>
          </section>

          {log.reason && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Lý do
                </h3>
                <p className="text-sm">{log.reason}</p>
              </section>
            </>
          )}

          {metadata && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Metadata
                </h3>
                <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border">
                  {Object.entries(metadata).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3 px-3 py-2.5">
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0 pt-0.5 w-28 truncate">
                        {k}
                      </span>
                      <span className="text-xs font-mono break-all">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer cố định */}
        <DrawerFooter className="border-t border-border">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Đóng
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  keyword: "",
  pageNumber: 1,
  pageSize: 25,
};

export default function AuditLogsPage() {
  const [selected, setSelected] = useState<AuditLogDto | null>(null);

  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  const { data, isLoading } = useAdminAuditLogs({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  });

  const logs = data?.items ?? [];
  const keyword = (filters.keyword ?? "").toLowerCase();
  const filtered = keyword
    ? logs.filter(
        (l) =>
          (l.actionName ?? "").toLowerCase().includes(keyword) ||
          (l.targetEmail ?? "").toLowerCase().includes(keyword) ||
          (l.ipAddress ?? "").includes(keyword),
      )
    : logs;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin · Hệ thống
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "…" : (data?.totalItems ?? 0).toLocaleString()} sự kiện
            — lịch sử hoạt động trên hệ thống.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.admin.auditLogs]} />
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Danh sách audit log
            </h2>
            <p className="text-sm text-muted-foreground">
              Click vào hàng để xem chi tiết đầy đủ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search.value}
                onChange={search.onChange}
                placeholder="Action, email, IP..."
                className="pl-8"
              />
            </div>
            {hasActiveFilter && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <ScrollText size={32} className="opacity-30" />
            <span className="text-sm">Không có audit log nào.</span>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-12 text-center">STT</TableHead>
                <TableHead className="w-1/5">Thời gian</TableHead>
                <TableHead className="w-1/5">Hành động</TableHead>
                <TableHead className="w-1/5">Kết quả</TableHead>
                <TableHead className="w-1/5">Tài khoản</TableHead>
                <TableHead className="w-1/5">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log, index) => {
                const category = ACTION_CATEGORY[log.actionName] ?? "other";
                return (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelected(log)}
                  >
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {(filters.pageNumber - 1) * filters.pageSize + index + 1}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {fmt(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10.5px] font-medium px-1.5 py-0 border shrink-0 ${CATEGORY_STYLE[category]}`}
                        >
                          {CATEGORY_LABEL[category]}
                        </Badge>
                        <span className="font-medium text-sm">
                          {ACTION_LABELS[log.actionName] ?? log.actionName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full border ${
                          log.isSuccess
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {log.isSuccess ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <XCircle size={10} />
                        )}
                        {log.isSuccess ? "OK" : "FAIL"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm max-w-50 truncate">
                      {log.targetEmail ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs font-mono">
                          {log.ipAddress ?? "—"}
                        </span>
                        <ChevronRight
                          size={14}
                          className="opacity-30 shrink-0"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <DataPagination
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />

      {selected && (
        <AuditLogDetail
          log={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
