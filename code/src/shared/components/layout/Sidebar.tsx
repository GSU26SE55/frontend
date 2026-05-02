import { BatteryCharging, LayoutDashboard } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { useSessionStore } from '@/shared/stores/sessionStore'
import type { UserRole } from '@/shared/types/auth.types'

const portalLinks: Record<UserRole, { label: string; to: string }[]> = {
  Admin: [{ label: 'Admin Dashboard', to: '/admin' }],
  Manager: [{ label: 'Manager Dashboard', to: '/manager' }],
  Staff: [{ label: 'Staff Dashboard', to: '/staff' }],
  Customer: [],
}

export function Sidebar() {
  const role = useSessionStore((state) => state.user?.role)
  const links = role ? portalLinks[role] : []

  return (
    <aside className="border-r bg-card px-4 py-5 max-lg:hidden">
      <div className="mb-8 flex items-center gap-2 font-semibold">
        <BatteryCharging className="size-5 text-primary" aria-hidden="true" />
        <span>Solar Battery</span>
      </div>
      <nav className="grid gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-muted text-foreground',
              )
            }
          >
            <LayoutDashboard className="size-4" aria-hidden="true" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
