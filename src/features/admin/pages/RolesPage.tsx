import { Shield, Plus, CheckCircle, Lock } from 'lucide-react';
import { useAdminRoleList } from '@/features/admin/hooks/useAdminRoles';
import { RoleStatusEnum } from '@/features/admin/types/admin.types';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  [RoleStatusEnum.Active]:     { label: 'Hoạt động',  cls: 'bg-emerald-100 text-emerald-700' },
  [RoleStatusEnum.Inactive]:   { label: 'Tắt',        cls: 'bg-gray-100 text-gray-500'       },
  [RoleStatusEnum.Deprecated]: { label: 'Deprecated', cls: 'bg-amber-100 text-amber-700'     },
};

export default function RolesPage() {
  const { data, isLoading } = useAdminRoleList({ pageNumber: 1, pageSize: 50 });
  const raw   = data as unknown;
  const roles = Array.isArray(raw) ? raw : ((raw as { items?: unknown[] })?.items ?? []);
  const total = (raw as { totalItems?: number })?.totalItems ?? (Array.isArray(raw) ? raw.length : 0);

  return (
    <div className="p-6 space-y-5 max-w-[1440px]">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Admin · Người dùng
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? '…' : total} role — quản lý quyền truy cập hệ thống.
          </p>
        </div>
        <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
          <Plus size={14} /> Tạo role
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-3">
              <Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <Shield size={32} className="opacity-30" />
          <span className="text-sm">Chưa có role nào.</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const s = STATUS_MAP[role.status] ?? { label: String(role.status), cls: 'bg-gray-100 text-gray-500' };
            return (
              <div
                key={role.id}
                className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 hover:border-emerald-300 transition-colors"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${role.isSystemRole ? 'bg-purple-100' : 'bg-emerald-100'}`}>
                      {role.isSystemRole
                        ? <Lock size={14} className="text-purple-600" />
                        : <Shield size={14} className="text-emerald-600" />
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-[13.5px]">{role.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono-num">{role.normalizedName}</div>
                    </div>
                  </div>
                  <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.cls}`}>{s.label}</span>
                </div>

                {/* Description */}
                {role.description && (
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{role.description}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {role.isSystemRole
                      ? <><Lock size={11} /><span>System role</span></>
                      : <><CheckCircle size={11} className="text-emerald-500" /><span>Custom role</span></>
                    }
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono-num">
                    {new Date(role.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
