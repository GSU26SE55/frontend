import { useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAuditLogs } from '@/features/admin/hooks/useAdminAuditLogs';
import type { AuditLogDto } from '@/features/admin/types/admin.types';

const ACTION_GROUPS: Record<string, string> = {
  LoginSuccess:                      'Đăng nhập',
  LoginFailedWrongPassword:          'Đăng nhập thất bại',
  LoginFailedAccountLocked:          'Đăng nhập thất bại',
  LoginFailedAccountSuspended:       'Đăng nhập thất bại',
  LoginFailedAccountBanned:          'Đăng nhập thất bại',
  LoginFailedAccountInactive:        'Đăng nhập thất bại',
  LoginFailedNotVerified:            'Đăng nhập thất bại',
  AccountAutoLocked:                 'Khóa tự động',
  Logout:                            'Đăng xuất',
  GoogleLoginSuccess:                'Google đăng nhập',
  GoogleLoginFailed:                 'Google đăng nhập thất bại',
  TokenRefreshed:                    'Làm mới token',
  TokenReuseDetected:                'Token bất thường',
  PasswordChanged:                   'Đổi mật khẩu',
  PasswordReset:                     'Reset mật khẩu',
  OtpVerifySuccess:                  'Xác thực OTP',
  OtpVerifyFailed:                   'Xác thực OTP thất bại',
  TwoFactorEnabled:                  '2FA bật',
  TwoFactorDisabled:                 '2FA tắt',
  GoogleLinked:                      'Liên kết Google',
  GoogleUnlinked:                    'Hủy liên kết Google',
  AccountRegistered:                 'Đăng ký',
  AccountCreatedByAdmin:             'Admin tạo',
  AccountUpdated:                    'Cập nhật',
  AccountStatusChanged:              'Đổi trạng thái',
  AccountUnlocked:                   'Mở khóa',
  AccountDeleted:                    'Xóa tài khoản',
  AccountInviteSent:                 'Gửi lời mời',
  AccountInviteAccepted:             'Chấp nhận lời mời',
  SessionRevoked:                    'Thu hồi session',
  AllSessionsRevoked:                'Thu hồi tất cả session',
  AdminForceLogout:                  'Admin đăng xuất bắt buộc',
  RoleAssigned:                      'Gán role',
  RoleRevoked:                       'Xóa role',
  RoleCreated:                       'Tạo role',
  RoleUpdated:                       'Cập nhật role',
  RoleStatusChanged:                 'Đổi trạng thái role',
  RoleDeleted:                       'Xóa role',
  PermissionGranted:                 'Cấp quyền',
  PermissionRevoked:                 'Thu quyền',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminAuditLogs({ pageNumber: 1, pageSize: 100 });

  const raw  = data as unknown;
  const logs = Array.isArray(raw) ? raw : ((raw as { items?: unknown[] })?.items ?? []) as AuditLogDto[];
  const total = (raw as { totalItems?: number })?.totalItems ?? (Array.isArray(raw) ? raw.length : 0);

  const filtered = search
    ? logs.filter(l =>
        (l.actionName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.targetEmail ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.ipAddress ?? '').includes(search),
      )
    : logs;

  const fmt = (dt: string) => format(new Date(dt), 'dd/MM/yyyy HH:mm:ss', { locale: vi });

  return (
    <div className="p-6 space-y-5 max-w-[1440px]">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Admin · Hệ thống
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? '…' : total} sự kiện — lịch sử hoạt động trên hệ thống.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Action, email, IP…"
          className="h-9 w-full pl-8 pr-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <ScrollText size={32} className="opacity-30" />
            <span className="text-sm">Không có audit log nào.</span>
          </div>
        ) : (
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Thời gian', 'Hành động', 'Kết quả', 'Tài khoản bị ảnh hưởng', 'Thực hiện bởi', 'IP', 'Lý do'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{fmt(log.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{ACTION_GROUPS[log.actionName] ?? log.actionName}</span>
                    <span className="ml-1.5 text-[10.5px] text-muted-foreground font-mono">#{log.action}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${log.isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {log.isSuccess ? 'OK' : 'FAIL'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{log.targetEmail ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-[11.5px]">
                    {log.actorAccountId ? log.actorAccountId.slice(0, 8) + '…' : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono">{log.ipAddress ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[160px] truncate">{log.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
