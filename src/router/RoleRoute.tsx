import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStore } from '@/shared/stores/sessionStore'
import type { UserRole } from '@/shared/types/common.types'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useSessionStore()
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return <Outlet />
}
