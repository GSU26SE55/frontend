import { NavLink } from 'react-router-dom'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { cn } from '@/shared/lib/utils'
import {
  Users, Battery, Settings, FileText,
  LayoutDashboard, Ticket, BarChart3, ClipboardList, Activity,
} from 'lucide-react'

const adminNav = [
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/batteries', label: 'Pin', icon: Battery },
  { to: '/admin/sla-rules', label: 'Quy tắc SLA', icon: Settings },
  { to: '/admin/audit-logs', label: 'Audit Log', icon: FileText },
  { to: '/admin/battery-readings', label: 'Battery Readings', icon: Activity },
]

const managerNav = [
  { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/manager/tickets', label: 'Hàng đợi ticket', icon: Ticket },
  { to: '/manager/reports', label: 'Báo cáo', icon: BarChart3 },
]

const staffNav = [
  { to: '/staff/tickets', label: 'Ticket của tôi', icon: ClipboardList },
]

const navByRole: Record<string, typeof adminNav> = {
  '1': adminNav,
  '2': managerNav,
  '3': staffNav,
}

export function Sidebar() {
  const user = useSessionStore((s) => s.user)
  const nav = user ? (navByRole[user.role] ?? []) : []

  return (
    <aside className="flex w-60 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6 font-semibold">
        Solar Battery
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to + label}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
