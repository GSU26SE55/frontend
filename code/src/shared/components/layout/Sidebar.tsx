import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useSessionStore } from '@/shared/stores/sessionStore'

interface NavItem {
  label: string
  to: string
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Người dùng', to: '/admin/users' },
  { label: 'Cấu hình pin', to: '/admin/batteries' },
  { label: 'SLA Rules', to: '/admin/sla' },
  { label: 'Audit Log', to: '/admin/audit' },
]

const managerNav: NavItem[] = [
  { label: 'Dashboard', to: '/manager' },
  { label: 'Ticket Queue', to: '/manager/tickets' },
  { label: 'Báo cáo', to: '/manager/reports' },
]

const staffNav: NavItem[] = [
  { label: 'Ticket của tôi', to: '/staff' },
]

const navMap = { Admin: adminNav, Manager: managerNav, Staff: staffNav }

export function Sidebar() {
  const { user } = useSessionStore()
  const navItems = user ? (navMap[user.role] ?? []) : []

  return (
    <aside className="flex w-56 flex-col border-r bg-background px-3 py-4">
      <p className="mb-6 px-3 text-sm font-semibold tracking-tight text-muted-foreground uppercase">
        Battery Management
      </p>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
