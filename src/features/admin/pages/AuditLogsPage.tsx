import { ScrollText, Search } from "lucide-react";
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
import { useAdminAuditLogs } from "@/features/admin/hooks/useAdminAuditLogs";
import DataPagination from "@/shared/components/common/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const ACTION_GROUPS: Record<string, string> = {
  LoginSuccess: "Đăng nhập",
  LoginFailedWrongPassword: "Đăng nhập thất bại",
  LoginFailedAccountLocked: "Đăng nhập thất bại",
  LoginFailedAccountSuspended: "Đăng nhập thất bại",
  LoginFailedAccountBanned: "Đăng nhập thất bại",
  LoginFailedAccountInactive: "Đăng nhập thất bại",
  LoginFailedNotVerified: "Đăng nhập thất bại",
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
  TwoFactorEnabled: "2FA bật",
  TwoFactorDisabled: "2FA tắt",
  GoogleLinked: "Liên kết Google",
  GoogleUnlinked: "Hủy liên kết Google",
  AccountRegistered: "Đăng ký",
  AccountCreatedByAdmin: "Admin tạo",
  AccountUpdated: "Cập nhật",
  AccountStatusChanged: "Đổi trạng thái",
  AccountUnlocked: "Mở khóa",
  AccountDeleted: "Xóa tài khoản",
  AccountInviteSent: "Gửi lời mời",
  AccountInviteAccepted: "Chấp nhận lời mời",
  SessionRevoked: "Thu hồi session",
  AllSessionsRevoked: "Thu hồi tất cả session",
  AdminForceLogout: "Admin đăng xuất bắt buộc",
  RoleAssigned: "Gán role",
  RoleRevoked: "Xóa role",
  RoleCreated: "Tạo role",
  RoleUpdated: "Cập nhật role",
  RoleStatusChanged: "Đổi trạng thái role",
  RoleDeleted: "Xóa role",
  PermissionGranted: "Cấp quyền",
  PermissionRevoked: "Thu quyền",
};

const DEFAULTS = {
  keyword: "",
  pageNumber: 1,
  pageSize: 25,
};

const fmt = (dt: string) =>
  format(new Date(dt), "dd/MM/yyyy HH:mm:ss", { locale: vi });

export default function AuditLogsPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);

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
    <div className="p-6 space-y-5 max-w-360">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Admin · Hệ thống
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "…" : (data?.totalItems ?? 0)} sự kiện — lịch sử hoạt
            động trên hệ thống.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={filters.keyword}
            onChange={(e) => setFilter("keyword", e.target.value || undefined)}
            placeholder="Action, email, IP…"
            className="h-9 w-full pl-8 pr-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
        </div>
        {hasActiveFilter && (
          <Button variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <div
        className="bg-card rounded-xl border border-border overflow-hidden"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Thời gian</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Kết quả</TableHead>
                <TableHead>Tài khoản bị ảnh hưởng</TableHead>
                <TableHead>Thực hiện bởi</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Lý do</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                    {fmt(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm">
                      {ACTION_GROUPS[log.actionName] ?? log.actionName}
                    </span>
                    <span className="ml-1.5 text-[10.5px] text-muted-foreground font-mono">
                      #{log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${log.isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                    >
                      {log.isSuccess ? "OK" : "FAIL"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.targetEmail ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {log.actorAccountId
                      ? log.actorAccountId.slice(0, 8) + "…"
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {log.ipAddress ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-40 truncate">
                    {log.reason ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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
    </div>
  );
}
