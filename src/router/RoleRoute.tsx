import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStore } from '@/shared/stores/sessionStore'

const ROLE_MAP = { admin: '1', manager: '2', staff: '3', customer: '4' } as const

interface RoleRouteProps {
  role: keyof typeof ROLE_MAP
}

export function RoleRoute({ role }: RoleRouteProps) {
  const user = useSessionStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== ROLE_MAP[role]) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
