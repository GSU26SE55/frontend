import { Search, Mail, MoreHorizontal, Users } from 'lucide-react';
import { useAdminAccountList } from '@/features/admin/hooks/useAdminAccounts';
import { AccountStatusEnum } from '@/shared/types/account.types';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  [AccountStatusEnum.PendingVerification]: { label: 'Chờ xác thực', cls: 'bg-amber-100 text-amber-700'    },
  [AccountStatusEnum.Active]:              { label: 'Hoạt động',     cls: 'bg-emerald-100 text-emerald-700' },
  [AccountStatusEnum.Locked]:              { label: 'Đã khóa',       cls: 'bg-red-100 text-red-600'         },
  [AccountStatusEnum.Inactive]:            { label: 'Không hoạt động', cls: 'bg-gray-100 text-gray-500'    },
  [AccountStatusEnum.Suspended]:           { label: 'Tạm khóa',      cls: 'bg-orange-100 text-orange-700'  },
  [AccountStatusEnum.Banned]:              { label: 'Bị cấm',        cls: 'bg-red-200 text-red-700'         },
};

const ROLE_CLS: Record<string, string> = {
  Admin:    'bg-purple-100 text-purple-700',
  Manager:  'bg-blue-100   text-blue-700',
  Staff:    'bg-slate-100  text-slate-600',
  Customer: 'bg-teal-100   text-teal-700',
};

export default function AccountsPage() {
  const { data, isLoading } = useAdminAccountList({ pageNumber: 1, pageSize: 50 });
  // Guard: API might return array directly or { items }
  const raw      = data as unknown;
  const accounts = Array.isArray(raw) ? raw : ((raw as { items?: unknown[] })?.items ?? []);
  const total    = (raw as { totalItems?: number })?.totalItems ?? (Array.isArray(raw) ? raw.length : 0);

  return (
    <div className="p-6 space-y-5 max-w-[1440px]">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Admin · Người dùng
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý tài khoản</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? '…' : total} tài khoản — Admin, Manager, Staff, Customer.
          </p>
        </div>
        <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
          <Mail size={14} /> Mời người dùng
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Tên, email…"
          className="h-9 w-full pl-8 pr-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          readOnly
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Users size={32} className="opacity-30" />
            <span className="text-sm">Chưa có tài khoản nào.</span>
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Người dùng', 'Roles', 'Trạng thái', 'Ngày tạo', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => {
                const s = STATUS_MAP[acc.status] ?? { label: String(acc.status), cls: 'bg-gray-100 text-gray-500' };
                const initials = acc.fullName.split(' ').slice(-2).map((n: string) => n[0]).join('').toUpperCase();
                return (
                  <tr key={acc.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials}
                        </span>
                        <div>
                          <div className="font-medium">{acc.fullName}</div>
                          <div className="text-[11.5px] text-muted-foreground">{acc.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(acc.roles ?? []).map((r: string) => (
                          <span key={r} className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${ROLE_CLS[r] ?? 'bg-gray-100 text-gray-600'}`}>
                            {r}
                          </span>
                        ))}
                        {(!acc.roles || acc.roles.length === 0) && (
                          <span className="text-[10.5px] text-muted-foreground italic">Chưa gán</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 font-mono-num text-[12px] text-muted-foreground whitespace-nowrap">
                      {new Date(acc.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
